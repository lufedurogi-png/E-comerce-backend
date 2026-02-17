<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductoCva;
use App\Models\ProductoManual;
use App\Services\CategoriaPrincipalService;
use App\Services\CVAService;
use App\Services\DescuentoPrecioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductoController extends Controller
{
    public function __construct(
        private readonly CVAService $cva,
        private readonly CategoriaPrincipalService $categorias,
        private readonly DescuentoPrecioService $descuentoPrecio
    ) {}

    /** Catálogo ok si CVA configurado o si hay productos CVA o manuales en BD. */
    private function catalogAvailable(): bool
    {
        return $this->cva->isConfigured()
            || ProductoCva::exists()
            || ProductoManual::where('anulado', false)->exists();
    }

    private const CACHE_TTL = 180; // segundos listados
    private const GRUPOS_CACHE_TTL = 300; // 5 min para grupos distintos (cambian al sincronizar)

    /** Listado con filtros (grupo, categoria, marca, q, etc.). */
    public function index(Request $request): JsonResponse
    {
        if (! $this->catalogAvailable()) {
            return $this->catalogUnavailableResponse();
        }

        $cacheKey = 'productos_index_'.md5(serialize($request->query()));
        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($request) {
            return $this->indexQueryData($request);
        });

        return response()->json($data);
    }

    /** Grupos distintos en BD (CVA + manuales, cache 5 min). */
    private function getGruposEnDb(): array
    {
        return Cache::remember('productos_grupos_distinct', self::GRUPOS_CACHE_TTL, function () {
            $cva = ProductoCva::query()->select('grupo')->distinct()->whereNotNull('grupo')->where('grupo', '!=', '')->pluck('grupo');
            $manual = ProductoManual::query()->select('grupo')->distinct()->where('anulado', false)->whereNotNull('grupo')->where('grupo', '!=', '')->pluck('grupo');

            return $cva->merge($manual)->unique()->sort()->values()->all();
        });
    }

    /** Columnas mínimas para listado (sin ficha_tecnica, raw_data, etc.). */
    private const INDEX_SELECT = [
        'id', 'clave', 'codigo_fabricante', 'descripcion', 'grupo', 'marca',
        'precio', 'moneda', 'imagen', 'imagenes', 'disponible', 'disponible_cd', 'garantia', 'synced_at',
    ];

    private const MANUAL_INDEX_SELECT = ['id', 'clave', 'codigo_fabricante', 'descripcion', 'grupo', 'marca', 'precio', 'moneda', 'imagen', 'imagenes', 'disponible', 'disponible_cd', 'garantia', 'created_at'];

    /** @return array{success: bool, data: array{productos: array, total: int, per_page: int, current_page: int, last_page: int}} */
    private function indexQueryData(Request $request): array
    {
        $perPage = min((int) $request->input('per_page', 36), 100);
        $currentPage = max(1, (int) $request->input('page', 1));
        $orden = $request->input('orden', 'reciente');

        $cvaQuery = ProductoCva::query()->select(self::INDEX_SELECT);
        $manualQuery = ProductoManual::query()->select(self::MANUAL_INDEX_SELECT)->where('anulado', false);

        $this->applyIndexFilters($cvaQuery, $manualQuery, $request);

        $cvaQuery->orderByDesc('synced_at')->orderByDesc('id');
        $manualQuery->orderByDesc('created_at');

        $cva = $cvaQuery->limit(3000)->get();
        $manual = $manualQuery->limit(500)->get();
        $collection = $cva->concat($manual);

        if ($orden === 'precio_asc') {
            $collection = $collection->sortBy('precio')->values();
        } elseif ($orden === 'precio_desc') {
            $collection = $collection->sortByDesc('precio')->values();
        } else {
            $collection = $collection->sortByDesc(fn ($p) => $p->synced_at ?? $p->created_at ?? 0)->values();
        }

        $total = $collection->count();
        $offset = ($currentPage - 1) * $perPage;
        $pageItems = $collection->slice($offset, $perPage)->values();
        $claves = $pageItems->pluck('clave')->all();
        $descuentos = $this->descuentoPrecio->getDescuentosPorClaves($claves);
        $items = $pageItems->map(fn ($p) => $this->formatProducto($p, $descuentos[$p->clave] ?? null))->values()->all();

        return [
            'success' => true,
            'data' => [
                'productos' => $items,
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $currentPage,
                'last_page' => (int) ceil($total / $perPage) ?: 1,
            ],
        ];
    }

    private function applyIndexFilters($cvaQuery, $manualQuery, Request $request): void
    {
        if ($request->filled('categoria_principal')) {
            $gruposEnDb = $this->getGruposEnDb();
            $grupos = $this->categorias->gruposPorCategoria($request->input('categoria_principal'), $gruposEnDb);
            if (! empty($grupos)) {
                $cvaQuery->whereIn('grupo', $grupos);
                $manualQuery->where(function ($q) use ($grupos, $request) {
                    $q->whereIn('grupo', $grupos)
                        ->orWhere('principal', $request->input('categoria_principal'));
                });
            }
        }
        if ($request->filled('grupo')) {
            $grupo = $request->input('grupo');
            if (strtolower(trim($grupo)) === 'tinta') {
                $cvaQuery->where(function ($q) {
                    $q->whereRaw('LOWER(grupo) LIKE ?', ['%tinta%'])
                        ->orWhereRaw('LOWER(grupo) LIKE ?', ['%tóner%'])
                        ->orWhereRaw('LOWER(grupo) LIKE ?', ['%toner%'])
                        ->orWhereRaw('LOWER(grupo) LIKE ?', ['%cartucho%'])
                        ->orWhere(function ($q2) {
                            $q2->whereRaw('LOWER(grupo) LIKE ?', ['%consumibles%'])
                                ->where(function ($q3) {
                                    $q3->whereRaw('LOWER(descripcion) LIKE ?', ['%tinta%'])
                                        ->orWhereRaw('LOWER(descripcion) LIKE ?', ['%cartucho%'])
                                        ->orWhereRaw('LOWER(descripcion) LIKE ?', ['%tóner%'])
                                        ->orWhereRaw('LOWER(descripcion) LIKE ?', ['%toner%'])
                                        ->orWhereRaw('LOWER(descripcion) LIKE ?', ['%botella%']);
                                });
                        });
                });
                $manualQuery->where(function ($q) use ($grupo) {
                    $q->whereRaw('LOWER(grupo) LIKE ?', ['%'.strtolower($grupo).'%'])
                        ->orWhereRaw('LOWER(descripcion) LIKE ?', ['%tinta%'])
                        ->orWhereRaw('LOWER(descripcion) LIKE ?', ['%cartucho%']);
                });
            } else {
                $cvaQuery->where('grupo', $grupo);
                $manualQuery->where('grupo', $grupo);
            }
        }
        if ($request->filled('subgrupo')) {
            $cvaQuery->where('subgrupo', 'like', '%'.$request->input('subgrupo').'%');
        }
        if ($request->filled('marca')) {
            $cvaQuery->where('marca', $request->input('marca'));
            $manualQuery->where('marca', $request->input('marca'));
        }
        if ($request->filled('precio_min')) {
            $min = (float) $request->input('precio_min');
            $cvaQuery->where('precio', '>=', $min);
            $manualQuery->where('precio', '>=', $min);
        }
        if ($request->filled('precio_max')) {
            $max = (float) $request->input('precio_max');
            $cvaQuery->where('precio', '<=', $max);
            $manualQuery->where('precio', '<=', $max);
        }
        if ($request->filled('desc') || $request->filled('q')) {
            $term = $request->input('desc') ?: $request->input('q');
            $cvaQuery->where('descripcion', 'like', '%'.$term.'%');
            $manualQuery->where('descripcion', 'like', '%'.$term.'%');
        }
        if ($request->boolean('destacados')) {
            $cvaQuery->where('destacado', true);
            $manualQuery->where('destacado', true);
        }
        if ($request->filled('claves')) {
            $claves = is_array($request->claves) ? $request->claves : explode(',', $request->claves);
            $claves = array_filter(array_map('trim', $claves));
            if (! empty($claves)) {
                $cvaQuery->whereIn('clave', $claves);
                $manualQuery->whereIn('clave', $claves);
            }
        }
    }

    /** Destacados con imagen y stock, orden reciente. */
    public function destacados(Request $request): JsonResponse
    {
        if (! $this->catalogAvailable()) {
            return $this->catalogUnavailableResponse();
        }

        $limit = min((int) $request->input('limit', 12), 24);
        $data = Cache::remember('productos_destacados_'.$limit, self::CACHE_TTL, function () use ($limit) {
            $cva = ProductoCva::query()->whereNotNull('imagen')->where('imagen', '!=', '')->where(function ($q) {
                $q->where('disponible', '>', 0)->orWhere('disponible_cd', '>', 0);
            })->orderByDesc('synced_at')->orderByDesc('id')->limit($limit)->get();
            $manual = ProductoManual::query()->where('anulado', false)->whereNotNull('imagen')->where('imagen', '!=', '')->where(function ($q) {
                $q->where('disponible', '>', 0)->orWhere('disponible_cd', '>', 0);
            })->where('destacado', true)->orderByDesc('created_at')->limit($limit)->get();
            $collection = $cva->concat($manual)->sortByDesc(fn ($p) => $p->synced_at ?? $p->created_at)->take($limit)->values();
            $claves = $collection->pluck('clave')->all();
            $descuentos = $this->descuentoPrecio->getDescuentosPorClaves($claves);
            $items = $collection->map(fn ($p) => $this->formatProducto($p, $descuentos[$p->clave] ?? null));

            return ['success' => true, 'data' => $items->values()->all()];
        });

        return response()->json($data);
    }

    /** Últimos por synced_at. */
    public function ultimos(Request $request): JsonResponse
    {
        if (! $this->catalogAvailable()) {
            return $this->catalogUnavailableResponse();
        }

        $limit = min((int) $request->input('limit', 12), 24);
        $data = Cache::remember('productos_ultimos_'.$limit, self::CACHE_TTL, function () use ($limit) {
            $cva = ProductoCva::query()->orderByDesc('synced_at')->orderByDesc('id')->limit($limit)->get();
            $manual = ProductoManual::query()->where('anulado', false)->orderByDesc('created_at')->limit($limit)->get();
            $collection = $cva->concat($manual)->sortByDesc(fn ($p) => $p->synced_at ?? $p->created_at)->take($limit)->values();
            $claves = $collection->pluck('clave')->all();
            $descuentos = $this->descuentoPrecio->getDescuentosPorClaves($claves);
            $items = $collection->map(fn ($p) => $this->formatProducto($p, $descuentos[$p->clave] ?? null));

            return ['success' => true, 'data' => $items->values()->all()];
        });

        return response()->json($data);
    }

    /** Select para listado carrito/favoritos (sin ficha_tecnica ni raw). */
    private const POR_CLAVES_SELECT = [
        'id', 'clave', 'codigo_fabricante', 'descripcion', 'grupo', 'marca',
        'precio', 'moneda', 'imagen', 'imagenes', 'disponible', 'disponible_cd', 'garantia',
    ];

    private const POR_CLAVE_CACHE_TTL = 120; // por producto (carrito/favoritos)

    private static function productoPorClaveCacheKey(string $clave): string
    {
        return 'producto_por_clave_'.md5($clave).'_'.$clave;
    }

    /** Productos por claves; caché por clave (2ª petición misma clave = cache). */
    public function porClaves(Request $request): JsonResponse
    {
        if (! $this->catalogAvailable()) {
            return $this->catalogUnavailableResponse();
        }

        $claves = $request->input('claves', []);
        if (is_string($claves)) {
            $claves = array_filter(array_map('trim', explode(',', $claves)));
        }
        if (empty($claves)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $byClave = [];
        $missing = [];
        foreach (array_unique($claves) as $c) {
            $key = self::productoPorClaveCacheKey($c);
            $cached = Cache::get($key);
            if ($cached !== null && is_array($cached)) {
                $byClave[$c] = $cached;
            } else {
                $missing[] = $c;
            }
        }

        if (! empty($missing)) {
            $cvaClaves = array_filter($missing, fn ($c) => ! str_starts_with($c, 'MANUAL-'));
            $manualClaves = array_filter($missing, fn ($c) => str_starts_with($c, 'MANUAL-'));
            if (! empty($cvaClaves)) {
                $fresh = ProductoCva::query()->select(self::POR_CLAVES_SELECT)->whereIn('clave', $cvaClaves)->get();
                $descuentos = $this->descuentoPrecio->getDescuentosPorClaves($cvaClaves);
                foreach ($fresh as $p) {
                    $formatted = $this->formatProducto($p, $descuentos[$p->clave] ?? null);
                    $byClave[$p->clave] = $formatted;
                    Cache::put(self::productoPorClaveCacheKey($p->clave), $formatted, self::POR_CLAVE_CACHE_TTL);
                }
            }
            if (! empty($manualClaves)) {
                $manual = ProductoManual::query()->select(['id', 'clave', 'codigo_fabricante', 'descripcion', 'grupo', 'marca', 'precio', 'moneda', 'imagen', 'imagenes', 'disponible', 'disponible_cd', 'garantia'])->whereIn('clave', $manualClaves)->where('anulado', false)->get();
                foreach ($manual as $p) {
                    $formatted = $this->formatProducto($p, null);
                    $byClave[$p->clave] = $formatted;
                    Cache::put(self::productoPorClaveCacheKey($p->clave), $formatted, self::POR_CLAVE_CACHE_TTL);
                }
            }
        }

        $order = array_flip(array_values($claves));
        $list = collect($byClave)->sortBy(fn ($p) => $order[$p['clave']] ?? 999)->values()->all();

        $descuentosList = $this->descuentoPrecio->getDescuentosPorClaves($claves);
        foreach ($list as &$item) {
            if (isset($descuentosList[$item['clave']])) {
                $d = $descuentosList[$item['clave']];
                $item['tiene_descuento'] = true;
                $item['precio_anterior'] = $d['precio_anterior'];
                $item['precio_actual'] = $d['precio_actual'];
                $item['porcentaje_descuento'] = $d['porcentaje_descuento'];
            } else {
                $item['tiene_descuento'] = false;
            }
        }

        return response()->json(['success' => true, 'data' => $list]);
    }

    /**
     * Productos que pueden interesar (mismo grupo o marca que los vistos, excluyendo claves).
     */
    public function recomendados(Request $request): JsonResponse
    {
        if (! $this->catalogAvailable()) {
            return $this->catalogUnavailableResponse();
        }

        $clavesVistos = $request->input('claves', []);
        if (is_string($clavesVistos)) {
            $clavesVistos = array_filter(array_map('trim', explode(',', $clavesVistos)));
        }
        $limit = min((int) $request->input('limit', 12), 24);

        if (empty($clavesVistos)) {
            $cva = ProductoCva::query()->orderByDesc('synced_at')->limit($limit)->get();
            $manual = ProductoManual::query()->where('anulado', false)->orderByDesc('created_at')->limit($limit)->get();
            $collection = $cva->concat($manual)->sortByDesc(fn ($p) => $p->synced_at ?? $p->created_at)->take($limit)->values();
            $claves = $collection->pluck('clave')->all();
            $descuentos = $this->descuentoPrecio->getDescuentosPorClaves($claves);
            $items = $collection->map(fn ($p) => $this->formatProducto($p, $descuentos[$p->clave] ?? null));

            return response()->json(['success' => true, 'data' => $items->values()->all()]);
        }

        $vistosCva = ProductoCva::whereIn('clave', $clavesVistos)->get();
        $vistosManual = ProductoManual::whereIn('clave', $clavesVistos)->where('anulado', false)->get();
        $vistos = $vistosCva->concat($vistosManual);
        $grupos = $vistos->pluck('grupo')->filter()->unique()->values()->all();
        $marcas = $vistos->pluck('marca')->filter()->unique()->values()->all();

        $cvaQuery = ProductoCva::query()->whereNotIn('clave', $clavesVistos);
        $manualQuery = ProductoManual::query()->where('anulado', false)->whereNotIn('clave', $clavesVistos);
        if (! empty($grupos) || ! empty($marcas)) {
            $whereFn = function ($q) use ($grupos, $marcas) {
                if (! empty($grupos)) {
                    $q->whereIn('grupo', $grupos);
                }
                if (! empty($marcas)) {
                    $q->orWhereIn('marca', $marcas);
                }
            };
            $cvaQuery->where($whereFn);
            $manualQuery->where($whereFn);
        }
        $cva = $cvaQuery->orderByDesc('synced_at')->limit($limit)->get();
        $manual = $manualQuery->orderByDesc('created_at')->limit($limit)->get();
        $collection = $cva->concat($manual)->sortByDesc(fn ($p) => $p->synced_at ?? $p->created_at)->take($limit)->values();
        $claves = $collection->pluck('clave')->all();
        $descuentos = $this->descuentoPrecio->getDescuentosPorClaves($claves);
        $items = $collection->map(fn ($p) => $this->formatProducto($p, $descuentos[$p->clave] ?? null));

        return response()->json(['success' => true, 'data' => $items->values()->all()]);
    }

    /**
     * Detalle de un producto por clave (desde BD; si no existe, intenta traer de CVA y guardar).
     */
    public function show(string $clave): JsonResponse
    {
        if (! $this->catalogAvailable()) {
            return $this->catalogUnavailableResponse();
        }

        $cacheKey = 'producto_show_'.md5($clave);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        $producto = null;
        $manual = ProductoManual::where('clave', $clave)->where('anulado', false)->first();
        if ($manual) {
            $producto = $manual;
        } else {
            $producto = ProductoCva::where('clave', $clave)->first();
        }
        if (! $producto) {
            $art = $this->cva->fetchProducto($clave);
            if ($art) {
                $this->cva->upsertArticulo($art);
                $producto = ProductoCva::where('clave', $clave)->first();
            }
        }
        if (! $producto) {
            return response()->json(['success' => false, 'message' => 'Producto no encontrado.'], 404);
        }

        // Solo CVA: intentar obtener especificaciones/dimensiones de la API
        if ($producto instanceof ProductoCva && empty($producto->especificaciones_tecnicas)) {
            $infoTecnica = $this->cva->fetchInformacionTecnica($clave);
            if ($infoTecnica && isset($infoTecnica['especificaciones'])) {
                $producto->especificaciones_tecnicas = $infoTecnica['especificaciones'];
                $producto->save();
            }
        }

        if ($producto instanceof ProductoCva && empty($producto->dimensiones)) {
            $dimensiones = $this->cva->fetchDimensiones($clave);
            if ($dimensiones !== null) {
                $producto->dimensiones = $dimensiones;
                $producto->save();
            }
        }

        $formatted = $this->formatProductoDetalle($producto);
        $descuento = $this->descuentoPrecio->getDescuentoPorClave($producto->clave);
        if ($descuento) {
            $formatted['tiene_descuento'] = true;
            $formatted['precio_anterior'] = $descuento['precio_anterior'];
            $formatted['precio_actual'] = $descuento['precio_actual'];
            $formatted['porcentaje_descuento'] = $descuento['porcentaje_descuento'];
        } else {
            $formatted['tiene_descuento'] = false;
        }
        $data = ['success' => true, 'data' => $formatted];
        Cache::put($cacheKey, $data, self::CACHE_TTL);

        return response()->json($data);
    }

    /**
     * Categorías principales del proyecto con sus subcategorías (grupos CVA asignados por algoritmo).
     */
    public function categoriasPrincipales(): JsonResponse
    {
        $data = Cache::remember('productos_categorias_principales', self::CACHE_TTL, function () {
            $grupos = $this->getGruposEnDb();
            $tree = $this->categorias->categoriasConSubcategorias($grupos);

            return ['success' => true, 'data' => $tree];
        });

        return response()->json($data);
    }

    /**
     * Catálogos: grupos según lo que hay en la BD (CVA + manuales).
     */
    public function grupos(): JsonResponse
    {
        $list = $this->getGruposEnDb();

        return response()->json(['success' => true, 'data' => $list]);
    }

    /**
     * Marcas: todas o solo las que tienen productos en el grupo/categoría indicado.
     * Query: ?grupo=MOUSE o ?categoria_principal=Accesorios
     */
    public function marcas(Request $request): JsonResponse
    {
        $cacheKey = 'productos_marcas_'.$request->get('grupo', '').'_'.$request->get('categoria_principal', '');
        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($request) {
            $cvaQuery = ProductoCva::query();
            $manualQuery = ProductoManual::query()->where('anulado', false);
            if ($request->filled('grupo')) {
                $cvaQuery->where('grupo', $request->input('grupo'));
                $manualQuery->where('grupo', $request->input('grupo'));
            } elseif ($request->filled('categoria_principal')) {
                $gruposEnDb = $this->getGruposEnDb();
                $grupos = $this->categorias->gruposPorCategoria($request->input('categoria_principal'), $gruposEnDb);
                if (! empty($grupos)) {
                    $cvaQuery->whereIn('grupo', $grupos);
                    $manualQuery->whereIn('grupo', $grupos);
                }
            }
            $cva = $cvaQuery->select('marca')->distinct()->whereNotNull('marca')->where('marca', '!=', '')->pluck('marca');
            $manual = $manualQuery->select('marca')->distinct()->whereNotNull('marca')->where('marca', '!=', '')->pluck('marca');
            $list = $cva->merge($manual)->unique()->sort()->values()->all();

            return ['success' => true, 'data' => $list];
        });

        return response()->json($data);
    }

    /**
     * Subgrupos para un grupo (según lo que hay en la BD).
     */
    public function subgrupos(Request $request): JsonResponse
    {
        $grupo = $request->input('grupo', '');
        if ($grupo === '') {
            return response()->json(['success' => true, 'data' => []]);
        }

        $list = ProductoCva::query()
            ->select('subgrupo')
            ->distinct()
            ->where('grupo', $grupo)
            ->whereNotNull('subgrupo')
            ->where('subgrupo', '!=', '')
            ->orderBy('subgrupo')
            ->pluck('subgrupo')
            ->values()
            ->all();

        return response()->json(['success' => true, 'data' => $list]);
    }

    /**
     * Estado del catálogo (configurado = CVA con credenciales; disponible = hay productos en BD para mostrar).
     */
    public function estado(): JsonResponse
    {
        $data = Cache::remember('productos_estado', self::CACHE_TTL, function () {
            $configurado = $this->cva->isConfigured();
            $totalCva = ProductoCva::count();
            $totalManual = ProductoManual::where('anulado', false)->count();
            $total = $totalCva + $totalManual;

            return [
                'success' => true,
                'data' => [
                    'configurado' => $configurado,
                    'total_productos' => $total,
                    'disponible' => $total > 0,
                ],
            ];
        });

        return response()->json($data);
    }

    private function formatProducto(ProductoCva|ProductoManual $p, ?array $descuento = null): array
    {
        $arr = [
            'id' => $p->id,
            'clave' => $p->clave,
            'codigo_fabricante' => $p->codigo_fabricante,
            'descripcion' => $p->descripcion,
            'grupo' => $p->grupo,
            'marca' => $p->marca,
            'precio' => (float) $p->precio,
            'moneda' => $p->moneda,
            'imagen' => $p->imagen,
            'imagenes' => $p->imagenes ?? [],
            'disponible' => $p->disponible,
            'disponible_cd' => $p->disponible_cd,
            'garantia' => $p->garantia,
        ];
        if ($descuento !== null) {
            $arr['tiene_descuento'] = true;
            $arr['precio_anterior'] = $descuento['precio_anterior'];
            $arr['precio_actual'] = $descuento['precio_actual'];
            $arr['porcentaje_descuento'] = $descuento['porcentaje_descuento'];
        } else {
            $arr['tiene_descuento'] = false;
        }

        return $arr;
    }

    private function formatProductoDetalle(ProductoCva|ProductoManual $p): array
    {
        $rawData = $p->raw_data ?? null;
        if ($p instanceof ProductoManual && $rawData === null) {
            $rawData = $this->buildRawDataFromProductoManual($p);
        }

        return [
            'id' => $p->id,
            'clave' => $p->clave,
            'codigo_fabricante' => $p->codigo_fabricante,
            'descripcion' => $p->descripcion,
            'principal' => $p->principal,
            'grupo' => $p->grupo,
            'marca' => $p->marca,
            'garantia' => $p->garantia,
            'clase' => $p->clase,
            'moneda' => $p->moneda,
            'precio' => (float) $p->precio,
            'imagen' => $p->imagen,
            'imagenes' => $p->imagenes ?? [],
            'disponible' => $p->disponible,
            'disponible_cd' => $p->disponible_cd,
            'ficha_tecnica' => $p->ficha_tecnica,
            'ficha_comercial' => $p->ficha_comercial,
            'raw_data' => $rawData,
            'especificaciones_tecnicas' => $p->especificaciones_tecnicas ?? [],
            'dimensiones' => $p->dimensiones ?? [],
        ];
    }

    /** Construye raw_data para ProductoManual a partir de sus campos, para mostrar en "Información general". */
    private function buildRawDataFromProductoManual(ProductoManual $p): array
    {
        $data = [];
        if ($p->clave !== null && $p->clave !== '') {
            $data['clave'] = $p->clave;
        }
        if ($p->codigo_fabricante !== null && $p->codigo_fabricante !== '') {
            $data['codigo_fabricante'] = $p->codigo_fabricante;
        }
        if ($p->descripcion !== null && $p->descripcion !== '') {
            $data['descripcion'] = $p->descripcion;
        }
        if ($p->marca !== null && $p->marca !== '') {
            $data['marca'] = $p->marca;
        }
        if ($p->garantia !== null && $p->garantia !== '') {
            $data['garantia'] = $p->garantia;
        }
        if ($p->clase !== null && $p->clase !== '') {
            $data['clase'] = $p->clase;
        }
        $totalStock = ((int) ($p->disponible ?? 0)) + ((int) ($p->disponible_cd ?? 0));
        $data['disponibilidad'] = (string) $totalStock;

        $custom = $p->informacion_general ?? [];
        if (is_array($custom)) {
            foreach ($custom as $item) {
                if (is_array($item) && ! empty(trim($item['nombre'] ?? ''))) {
                    $data[trim($item['nombre'])] = trim($item['valor'] ?? '');
                }
            }
        }

        return $data;
    }

    private function catalogUnavailableResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'El catálogo de productos no está disponible en este momento. Por favor, intente más tarde.',
            'code' => 'CATALOG_UNAVAILABLE',
        ], 503);
    }
}
