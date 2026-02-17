<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductoCva;
use App\Models\ProductoManual;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class FavoritoController extends Controller
{
    /** Mismo caché que Carrito/Producto por clave. */
    private const PRODUCTO_CACHE_TTL = 120;
    private const PRODUCTO_SELECT = [
        'id', 'clave', 'codigo_fabricante', 'descripcion', 'grupo', 'marca',
        'precio', 'moneda', 'imagen', 'imagenes', 'disponible', 'disponible_cd', 'garantia',
    ];

    private static function productoCacheKey(string $clave): string
    {
        return 'producto_por_clave_'.md5($clave).'_'.$clave;
    }

    private static function formatProductoForList(ProductoCva|ProductoManual $p): array
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

    /** Productos por clave (caché o BD en una consulta). */
    private function getProductosByClaves(array $claves): array
    {
        $byClave = [];
        $missing = [];
        foreach ($claves as $c) {
            $key = self::productoCacheKey($c);
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
                $fresh = ProductoCva::query()->select(self::PRODUCTO_SELECT)->whereIn('clave', $cvaClaves)->get();
                foreach ($fresh as $p) {
                    $formatted = self::formatProductoForList($p);
                    $byClave[$p->clave] = $formatted;
                    Cache::put(self::productoCacheKey($p->clave), $formatted, self::PRODUCTO_CACHE_TTL);
                }
            }
            if (! empty($manualClaves)) {
                $manual = ProductoManual::query()->select(self::PRODUCTO_SELECT)->whereIn('clave', $manualClaves)->where('anulado', false)->get();
                foreach ($manual as $p) {
                    $formatted = self::formatProductoForList($p);
                    $byClave[$p->clave] = $formatted;
                    Cache::put(self::productoCacheKey($p->clave), $formatted, self::PRODUCTO_CACHE_TTL);
                }
            }
        }
        return array_values(array_filter(array_map(fn ($c) => $byClave[$c] ?? null, $claves)));
    }

    /** Favoritos con imagen, precio y stock (una petición). */
    public function index(Request $request): JsonResponse
    {
        try {
            $claves = Auth::user()->favoritos()->orderBy('created_at', 'desc')->pluck('clave')->all();
            $productos = $this->getProductosByClaves($claves);

            return response()->json([
                'success' => true,
                'data' => ['claves' => $claves, 'productos' => $productos],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar favoritos. ¿Ejecutaste la migración? (php artisan migrate)',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /** Agregar favorito por clave. */
    public function store(Request $request): JsonResponse
    {
        try {
            $valid = $request->validate([
                'clave' => 'required|string|max:100',
            ]);

            $user = Auth::user();
            $exists = $user->favoritos()->where('clave', $valid['clave'])->exists();
            if (!$exists) {
                $user->favoritos()->create(['clave' => $valid['clave']]);
            }

            $claves = $user->favoritos()->orderBy('created_at', 'desc')->pluck('clave')->all();
            $productos = $this->getProductosByClaves($claves);

            return response()->json([
                'success' => true,
                'data' => ['claves' => $claves, 'productos' => $productos],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al agregar a favoritos. ¿Ejecutaste la migración? (php artisan migrate)',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /** Quitar favorito por clave. */
    public function destroy(string $clave): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->favoritos()->where('clave', $clave)->delete();

            $claves = $user->favoritos()->orderBy('created_at', 'desc')->pluck('clave')->all();
            $productos = $this->getProductosByClaves($claves);

            return response()->json([
                'success' => true,
                'data' => ['claves' => $claves, 'productos' => $productos],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al quitar de favoritos.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
