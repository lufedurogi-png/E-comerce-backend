<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductoCva;
use App\Services\CategoriaPrincipalService;
use App\Services\CVAService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductoController extends Controller
{
    public function __construct(
        private readonly CVAService $cva,
        private readonly CategoriaPrincipalService $categorias
    ) {}

    /** Catálogo ok si CVA configurado o si ya hay productos en BD. */
    private function catalogAvailable(): bool
    {
        return $this->cva->isConfigured() || ProductoCva::exists();
    }

    private const CACHE_TTL = 90; // segundos listados

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

    /** @return array{success: bool, data: array{productos: \Illuminate\Support\Collection, total: int, per_page: int, current_page: int, last_page: int}} */
    private function indexQueryData(Request $request): array
    {
        $query = ProductoCva::query();

        if ($request->filled('categoria_principal')) {
            $gruposEnDb = ProductoCva::query()
                ->select('grupo')
                ->distinct()
                ->whereNotNull('grupo')
                ->where('grupo', '!=', '')
                ->pluck('grupo')
                ->all();
            $grupos = $this->categorias->gruposPorCategoria($request->input('categoria_principal'), $gruposEnDb);
            if (! empty($grupos)) {
                $query->whereIn('grupo', $grupos);
            }
        }
        if ($request->filled('grupo')) {
            $grupo = $request->input('grupo');
            if (strtolower(trim($grupo)) === 'tinta') {
                $query->where(function ($q) {
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
            } else {
                $query->where('grupo', 'like', '%'.$grupo.'%');
            }
        }
        if ($request->filled('subgrupo')) {
            $query->where('subgrupo', 'like', '%'.$request->input('subgrupo').'%');
        }
        if ($request->filled('marca')) {
            $query->where('marca', 'like', '%'.$request->input('marca').'%');
        }
        if ($request->filled('precio_min')) {
            $query->where('precio', '>=', (float) $request->input('precio_min'));
        }
        if ($request->filled('precio_max')) {
            $query->where('precio', '<=', (float) $request->input('precio_max'));
        }
        if ($request->filled('desc') || $request->filled('q')) {
            $term = $request->input('desc') ?: $request->input('q');
            $query->where('descripcion', 'like', '%'.$term.'%');
        }
        if ($request->boolean('destacados')) {
            $query->where('destacado', true);
        }
        if ($request->filled('claves')) {
            $claves = is_array($request->claves) ? $request->claves : explode(',', $request->claves);
            $claves = array_filter(array_map('trim', $claves));
            if (! empty($claves)) {
                $query->whereIn('clave', $claves);
            }
        }

        $orden = $request->input('orden', 'reciente');
        if ($orden === 'reciente') {
            $query->orderByDesc('synced_at')->orderByDesc('id');
        } elseif ($orden === 'precio_asc') {
            $query->orderBy('precio');
        } elseif ($orden === 'precio_desc') {
            $query->orderByDesc('precio');
        } else {
            $query->orderByDesc('synced_at')->orderByDesc('id');
        }

        $perPage = min((int) $request->input('per_page', 36), 100);
        $paginator = $query->paginate($perPage);

        $items = $paginator->getCollection()->map(fn ($p) => $this->formatProducto($p));

        return [
            'success' => true,
            'data' => [
                'productos' => $items->values()->all(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ];
    }

    /** Destacados con imagen y stock, orden reciente. */
    public function destacados(Request $request): JsonResponse
    {
        if (! $this->catalogAvailable()) {
            return $this->catalogUnavailableResponse();
        }

        $limit = min((int) $request->input('limit', 12), 24);
        $data = Cache::remember('productos_destacados_'.$limit, self::CACHE_TTL, function () use ($limit) {
            $items = ProductoCva::query()
                ->whereNotNull('imagen')
                ->where('imagen', '!=', '')
                ->where(function ($q) {
                    $q->where('disponible', '>', 0)->orWhere('disponible_cd', '>', 0);
                })
                ->orderByDesc('synced_at')
                ->orderByDesc('id')
                ->limit($limit)
                ->get()
                ->map(fn ($p) => $this->formatProducto($p));

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
            $items = ProductoCva::query()
                ->orderByDesc('synced_at')
                ->orderByDesc('id')
                ->limit($limit)
                ->get()
                ->map(fn ($p) => $this->formatProducto($p));

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
            $fresh = ProductoCva::query()
                ->select(self::POR_CLAVES_SELECT)
                ->whereIn('clave', $missing)
                ->get();
            foreach ($fresh as $p) {
                $formatted = $this->formatProducto($p);
                $byClave[$p->clave] = $formatted;
                Cache::put(self::productoPorClaveCacheKey($p->clave), $formatted, self::POR_CLAVE_CACHE_TTL);
            }
        }

        $order = array_flip(array_values($claves));
        $list = collect($byClave)->sortBy(fn ($p) => $order[$p['clave']] ?? 999)->values()->all();

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
            $items = ProductoCva::query()
                ->orderByDesc('synced_at')
                ->limit($limit)
                ->get()
                ->map(fn ($p) => $this->formatProducto($p));

            return response()->json(['success' => true, 'data' => $items]);
        }

        $vistos = ProductoCva::whereIn('clave', $clavesVistos)->get();
        $grupos = $vistos->pluck('grupo')->filter()->unique()->values()->all();
        $marcas = $vistos->pluck('marca')->filter()->unique()->values()->all();

        $query = ProductoCva::query()
            ->whereNotIn('clave', $clavesVistos);
        if (! empty($grupos) || ! empty($marcas)) {
            $query->where(function ($q) use ($grupos, $marcas) {
                if (! empty($grupos)) {
                    $q->whereIn('grupo', $grupos);
                }
                if (! empty($marcas)) {
                    $q->orWhereIn('marca', $marcas);
                }
            });
        }
        $items = $query->orderByDesc('synced_at')->limit($limit)->get()->map(fn ($p) => $this->formatProducto($p));

        return response()->json(['success' => true, 'data' => $items]);
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

        $producto = ProductoCva::where('clave', $clave)->first();
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

        $data = ['success' => true, 'data' => $this->formatProductoDetalle($producto)];
        Cache::put($cacheKey, $data, self::CACHE_TTL);

        return response()->json($data);
    }

    /**
     * Categorías principales del proyecto con sus subcategorías (grupos CVA asignados por algoritmo).
     */
    public function categoriasPrincipales(): JsonResponse
    {
        $data = Cache::remember('productos_categorias_principales', self::CACHE_TTL, function () {
            $grupos = ProductoCva::query()
                ->select('grupo')
                ->distinct()
                ->whereNotNull('grupo')
                ->where('grupo', '!=', '')
                ->orderBy('grupo')
                ->pluck('grupo')
                ->values()
                ->all();

            $tree = $this->categorias->categoriasConSubcategorias($grupos);

            return ['success' => true, 'data' => $tree];
        });

        return response()->json($data);
    }

    /**
     * Catálogos: grupos y marcas según lo que realmente hay en la BD (productos sincronizados).
     */
    public function grupos(): JsonResponse
    {
        $list = ProductoCva::query()
            ->select('grupo')
            ->distinct()
            ->whereNotNull('grupo')
            ->where('grupo', '!=', '')
            ->orderBy('grupo')
            ->pluck('grupo')
            ->values()
            ->all();

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
            $query = ProductoCva::query();

            if ($request->filled('grupo')) {
                $query->where('grupo', $request->input('grupo'));
            } elseif ($request->filled('categoria_principal')) {
                $gruposEnDb = ProductoCva::query()
                    ->select('grupo')
                    ->distinct()
                    ->whereNotNull('grupo')
                    ->where('grupo', '!=', '')
                    ->pluck('grupo')
                    ->all();
                $grupos = $this->categorias->gruposPorCategoria($request->input('categoria_principal'), $gruposEnDb);
                if (! empty($grupos)) {
                    $query->whereIn('grupo', $grupos);
                }
            }

            $list = $query
                ->select('marca')
                ->distinct()
                ->whereNotNull('marca')
                ->where('marca', '!=', '')
                ->orderBy('marca')
                ->pluck('marca')
                ->values()
                ->all();

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
            $total = ProductoCva::count();

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

    private function formatProducto(ProductoCva $p): array
    {
        return [
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
    }

    private function formatProductoDetalle(ProductoCva $p): array
    {
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
            'raw_data' => $p->raw_data,
        ];
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
