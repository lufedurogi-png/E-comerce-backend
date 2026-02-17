<?php

namespace App\Services;

use App\Models\Busqueda;
use App\Models\BusquedaProductoMostrado;
use App\Models\BusquedaSeleccion;
use App\Models\CorreccionAprendida;
use App\Models\ProductoCva;
use App\Models\ProductoManual;
use App\Models\RelevanciaProductoTermino;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de búsqueda tolerante a errores, con registro de búsquedas,
 * aprendizaje de correcciones y priorización por relevancia histórica.
 */
class BusquedaService
{
    private const CACHE_KNOWN_TERMS_KEY = 'busqueda_known_terms';

    private const CACHE_KNOWN_TERMS_TTL_SECONDS = 3600;

    public function __construct() {}

    /**
     * Ejecuta una búsqueda: normaliza la consulta, obtiene productos priorizados
     * y registra la búsqueda y los productos mostrados.
     *
     * @return array{ busqueda_id: int, texto_original: string, texto_normalizado: string, correccion_aplicada: bool, productos: array }
     */
    public function buscar(string $query, ?string $sessionId = null, ?int $userId = null): array
    {
        $textoOriginal = $this->normalizarTexto($query);
        if ($textoOriginal === '') {
            return [
                'busqueda_id' => 0,
                'texto_original' => $query,
                'texto_normalizado' => '',
                'correccion_aplicada' => false,
                'productos' => [],
            ];
        }

        $textoNormalizado = $this->normalizarConsulta($textoOriginal);
        $correccionAplicada = $this->normalizarParaComparar($textoOriginal) !== $this->normalizarParaComparar($textoNormalizado);

        $busqueda = Busqueda::create([
            'texto_original' => $textoOriginal,
            'texto_normalizado' => $textoNormalizado,
            'session_id' => $sessionId,
            'user_id' => $userId,
        ]);

        $productos = $this->obtenerProductosOrdenadosPorRelevancia($textoNormalizado);

        $posicion = 1;
        foreach ($productos as $p) {
            BusquedaProductoMostrado::create([
                'busqueda_id' => $busqueda->id,
                'producto_clave' => $p->clave,
                'posicion' => $posicion++,
            ]);
        }

        $formateados = $productos->map(fn ($p) => $p instanceof ProductoManual ? $this->formatearProductoManual($p) : $this->formatearProducto($p))->values()->all();

        return [
            'busqueda_id' => $busqueda->id,
            'texto_original' => $textoOriginal,
            'texto_normalizado' => $textoNormalizado,
            'correccion_aplicada' => $correccionAplicada,
            'productos' => $formateados,
        ];
    }

    /**
     * Registra que el usuario seleccionó (clic) un producto en una búsqueda.
     * Actualiza relevancia y, si aplica, correcciones aprendidas.
     */
    public function registrarSeleccion(int $busquedaId, string $productoClave): bool
    {
        $busqueda = Busqueda::find($busquedaId);
        if (! $busqueda) {
            return false;
        }

        BusquedaSeleccion::create([
            'busqueda_id' => $busquedaId,
            'producto_clave' => $productoClave,
        ]);

        $termino = $this->normalizarParaComparar($busqueda->texto_normalizado);
        if ($termino !== '') {
            $rel = RelevanciaProductoTermino::firstOrNew([
                'termino_normalizado' => $termino,
                'producto_clave' => $productoClave,
            ]);
            $rel->veces_seleccionado = ($rel->veces_seleccionado ?? 0) + 1;
            $rel->ultima_seleccion_at = now();
            $rel->save();
        }

        $this->aprenderCorreccionesDesdeBusqueda($busqueda);

        return true;
    }

    /**
     * Normaliza la consulta aplicando correcciones aprendidas y similitud con términos conocidos.
     */
    public function normalizarConsulta(string $query): string
    {
        $palabras = $this->splitPalabras($query);
        $corregidas = [];
        foreach ($palabras as $palabra) {
            if ($palabra === '') {
                continue;
            }
            $mejor = $this->encontrarMejorCorreccion($palabra);
            $corregidas[] = $mejor ?? $palabra;
        }

        return implode(' ', $corregidas);
    }

    /**
     * Términos conocidos del sistema (grupos, subgrupos, marcas) para similitud.
     *
     * @return array<string>
     */
    public function getTerminosConocidos(): array
    {
        return Cache::remember(self::CACHE_KNOWN_TERMS_KEY, self::CACHE_KNOWN_TERMS_TTL_SECONDS, function () {
            $grupos = ProductoCva::query()
                ->select('grupo')
                ->distinct()
                ->whereNotNull('grupo')
                ->where('grupo', '!=', '')
                ->pluck('grupo')
                ->map(fn ($g) => $this->normalizarParaComparar((string) $g))
                ->filter(fn ($g) => $g !== '')
                ->unique()
                ->values()
                ->all();

            $gruposManual = ProductoManual::query()
                ->select('grupo')
                ->distinct()
                ->where('anulado', false)
                ->whereNotNull('grupo')
                ->where('grupo', '!=', '')
                ->pluck('grupo')
                ->map(fn ($g) => $this->normalizarParaComparar((string) $g))
                ->filter(fn ($g) => $g !== '')
                ->unique()
                ->values()
                ->all();

            $subgrupos = ProductoCva::query()
                ->select('subgrupo')
                ->distinct()
                ->whereNotNull('subgrupo')
                ->where('subgrupo', '!=', '')
                ->pluck('subgrupo')
                ->map(fn ($s) => $this->normalizarParaComparar((string) $s))
                ->filter(fn ($s) => $s !== '')
                ->unique()
                ->values()
                ->all();

            $marcas = ProductoCva::query()
                ->select('marca')
                ->distinct()
                ->whereNotNull('marca')
                ->where('marca', '!=', '')
                ->pluck('marca')
                ->map(fn ($m) => $this->normalizarParaComparar((string) $m))
                ->filter(fn ($m) => $m !== '')
                ->unique()
                ->values()
                ->all();

            $marcasManual = ProductoManual::query()
                ->select('marca')
                ->distinct()
                ->where('anulado', false)
                ->whereNotNull('marca')
                ->where('marca', '!=', '')
                ->pluck('marca')
                ->map(fn ($m) => $this->normalizarParaComparar((string) $m))
                ->filter(fn ($m) => $m !== '')
                ->unique()
                ->values()
                ->all();

            return array_values(array_unique(array_merge($grupos, $gruposManual, $subgrupos, $marcas, $marcasManual)));
        });
    }

    public function limpiarCacheTerminos(): void
    {
        Cache::forget(self::CACHE_KNOWN_TERMS_KEY);
    }

    private function normalizarTexto(string $s): string
    {
        return trim(preg_replace('/\s+/', ' ', $s));
    }

    private function normalizarParaComparar(string $s): string
    {
        return mb_strtolower(trim($s), 'UTF-8');
    }

    /**
     * @return array<string>
     */
    private function splitPalabras(string $query): array
    {
        $n = $this->normalizarParaComparar($query);
        return $n === '' ? [] : preg_split('/\s+/', $n, -1, PREG_SPLIT_NO_EMPTY);
    }

    /**
     * Encuentra la mejor corrección para una palabra: primero correcciones aprendidas,
     * luego similitud con términos conocidos.
     */
    private function encontrarMejorCorreccion(string $palabra): ?string
    {
        $p = $this->normalizarParaComparar($palabra);
        if (strlen($p) < 2) {
            return null;
        }

        $umbral = (int) config('busqueda.umbral_confirmaciones', 3);
        $correccion = CorreccionAprendida::where('termino_original', $p)
            ->where('confirmaciones', '>=', $umbral)
            ->first();
        if ($correccion) {
            return $correccion->termino_corregido;
        }

        $terminos = $this->getTerminosConocidos();
        $minSim = (float) config('busqueda.similitud_minima_porcentaje', 70);
        $mejor = null;
        $mejorPorcentaje = 0.0;

        foreach ($terminos as $t) {
            if ($t === '') {
                continue;
            }
            similar_text($p, $t, $percent);
            if ($percent >= $minSim && $percent > $mejorPorcentaje) {
                $mejorPorcentaje = $percent;
                $mejor = $t;
            }
        }

        return $mejor;
    }

    private function obtenerProductosOrdenadosPorRelevancia(string $textoNormalizado): \Illuminate\Support\Collection
    {
        $termino = $this->normalizarParaComparar($textoNormalizado);
        if ($termino === '') {
            return collect();
        }

        $palabras = preg_split('/\s+/', $termino, -1, PREG_SPLIT_NO_EMPTY);
        if (empty($palabras)) {
            return collect();
        }

        $limite = (int) config('busqueda.limite_resultados', 50);
        $productos = collect();

        // Buscar en ProductoCva
        $queryCva = ProductoCva::query();
        foreach ($palabras as $palabra) {
            $like = '%'.$palabra.'%';
            $queryCva->where(function ($q) use ($like) {
                $q->whereRaw('LOWER(descripcion) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(grupo) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(subgrupo) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(marca) LIKE ?', [$like]);
            });
        }
        $cva = $queryCva->limit($limite)->get();
        $productos = $productos->merge($cva->map(fn ($p) => (object) ['tipo' => 'cva', 'model' => $p]));

        // Buscar en ProductoManual (no anulados)
        $queryManual = ProductoManual::query()->where('anulado', false);
        foreach ($palabras as $palabra) {
            $like = '%'.$palabra.'%';
            $queryManual->where(function ($q) use ($like) {
                $q->whereRaw('LOWER(descripcion) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(grupo) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(marca) LIKE ?', [$like]);
            });
        }
        $manual = $queryManual->limit($limite)->get();
        $productos = $productos->merge($manual->map(fn ($p) => (object) ['tipo' => 'manual', 'model' => $p]));

        $claves = $productos->pluck('model.clave')->filter()->all();
        $relevancias = RelevanciaProductoTermino::where('termino_normalizado', $termino)
            ->whereIn('producto_clave', $claves)
            ->get()
            ->keyBy('producto_clave');

        $productos = $productos
            ->sortByDesc(function ($item) use ($relevancias) {
                $r = $relevancias->get($item->model->clave ?? '');

                return $r ? $r->veces_seleccionado : 0;
            })
            ->values()
            ->take($limite);

        return $productos->map(fn ($item) => $item->model);
    }

    private function aprenderCorreccionesDesdeBusqueda(Busqueda $busqueda): void
    {
        $original = $this->splitPalabras($busqueda->texto_original);
        $normalizado = $this->splitPalabras($busqueda->texto_normalizado);
        $n = min(count($original), count($normalizado));
        for ($i = 0; $i < $n; $i++) {
            $o = $original[$i];
            $nrm = $normalizado[$i];
            if ($o !== $nrm && $o !== '' && $nrm !== '') {
                $corr = CorreccionAprendida::firstOrNew(
                    ['termino_original' => $o],
                    ['termino_corregido' => $nrm, 'confirmaciones' => 0]
                );
                if ($corr->termino_corregido !== $nrm) {
                    continue;
                }
                $corr->confirmaciones = ($corr->confirmaciones ?? 0) + 1;
                $corr->ultima_confirmacion_at = now();
                $corr->save();
            }
        }
    }

    private function formatearProducto(ProductoCva $p): array
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

    private function formatearProductoManual(ProductoManual $p): array
    {
        return [
            'id' => $p->id,
            'clave' => $p->clave,
            'codigo_fabricante' => $p->codigo_fabricante,
            'descripcion' => $p->descripcion,
            'grupo' => $p->grupo,
            'marca' => $p->marca,
            'precio' => (float) $p->precio,
            'moneda' => $p->moneda ?? 'MXN',
            'imagen' => $p->imagen,
            'imagenes' => $p->imagenes ?? [],
            'disponible' => $p->disponible ?? 0,
            'disponible_cd' => $p->disponible_cd ?? 0,
            'garantia' => $p->garantia,
        ];
    }
}
