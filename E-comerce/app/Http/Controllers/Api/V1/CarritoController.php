<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CarritoItem;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\ProductoCva;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CarritoController extends Controller
{
    private const CART_INDEX_CACHE_TTL = 15;

    /** Misma clave y TTL que ProductoController para reutilizar caché por producto. */
    private const PRODUCTO_CACHE_TTL = 120;
    private const PRODUCTO_SELECT = [
        'id', 'clave', 'codigo_fabricante', 'descripcion', 'grupo', 'marca',
        'precio', 'moneda', 'imagen', 'imagenes', 'disponible', 'disponible_cd', 'garantia',
    ];

    private static function cartCacheKey(int $userId): string
    {
        return 'carrito_index_'.$userId;
    }

    private static function productoCacheKey(string $clave): string
    {
        return 'producto_por_clave_'.md5($clave).'_'.$clave;
    }

    /** Formato producto para listado (misma estructura que ProductoController para compartir caché). */
    private static function formatProductoForList(ProductoCva $p): array
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

    /**
     * Listar items del carrito con imagen y stock incluidos. Una sola petición; una sola consulta BD si hay caché.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $key = self::cartCacheKey($user->id);
        $response = Cache::remember($key, self::CART_INDEX_CACHE_TTL, function () use ($user) {
            $items = $user->carritoItems()->orderBy('updated_at', 'desc')->get();
            $claves = $items->pluck('clave')->unique()->values()->all();

            $byClave = [];
            $missing = [];
            foreach ($claves as $c) {
                $cacheKey = self::productoCacheKey($c);
                $cached = Cache::get($cacheKey);
                if ($cached !== null && is_array($cached)) {
                    $byClave[$c] = $cached;
                } else {
                    $missing[] = $c;
                }
            }
            if (! empty($missing)) {
                $fresh = ProductoCva::query()
                    ->select(self::PRODUCTO_SELECT)
                    ->whereIn('clave', $missing)
                    ->get();
                foreach ($fresh as $p) {
                    $formatted = self::formatProductoForList($p);
                    $byClave[$p->clave] = $formatted;
                    Cache::put(self::productoCacheKey($p->clave), $formatted, self::PRODUCTO_CACHE_TTL);
                }
            }

            $data = [];
            foreach ($items as $i) {
                $producto = $byClave[$i->clave] ?? null;
                $imagen = $producto['imagen'] ?? null;
                if (empty($imagen) && ! empty($producto['imagenes'][0] ?? null)) {
                    $imagen = $producto['imagenes'][0];
                }
                $disponible = (int) ($producto['disponible'] ?? 0);
                $disponibleCd = (int) ($producto['disponible_cd'] ?? 0);
                $data[] = [
                    'clave' => $i->clave,
                    'nombre_producto' => $producto['descripcion'] ?? $i->nombre_producto,
                    'cantidad' => $i->cantidad,
                    'precio_unitario' => (float) $i->precio_unitario,
                    'subtotal' => (float) ($i->cantidad * $i->precio_unitario),
                    'imagen' => $imagen,
                    'imagenes' => $producto['imagenes'] ?? [],
                    'disponible' => $disponible,
                    'disponible_cd' => $disponibleCd,
                ];
            }
            $total = $items->sum(fn (CarritoItem $i) => $i->cantidad * $i->precio_unitario);

            return [
                'success' => true,
                'data' => [
                    'items' => $data,
                    'total' => round($total, 2),
                ],
            ];
        });

        return response()->json($response);
    }

    /**
     * Agregar o actualizar cantidad en el carrito (clave, cantidad).
     */
    public function store(Request $request): JsonResponse
    {
        $valid = $request->validate([
            'clave' => 'required|string|max:100',
            'cantidad' => 'required|integer|min:1|max:9999',
        ]);

        $producto = ProductoCva::where('clave', $valid['clave'])->first();
        if (! $producto) {
            return response()->json([
                'success' => false,
                'message' => 'Producto no encontrado.',
            ], 404);
        }

        $user = Auth::user();
        $item = $user->carritoItems()->where('clave', $valid['clave'])->first();

        $nombre = $producto->descripcion ?? $valid['clave'];
        $precio = (float) $producto->precio;

        if ($item) {
            $item->update([
                'cantidad' => (int) $valid['cantidad'],
                'nombre_producto' => $nombre,
                'precio_unitario' => $precio,
            ]);
        } else {
            $user->carritoItems()->create([
                'clave' => $valid['clave'],
                'nombre_producto' => $nombre,
                'cantidad' => (int) $valid['cantidad'],
                'precio_unitario' => $precio,
            ]);
        }

        Cache::forget(self::cartCacheKey($user->id));
        return $this->index($request);
    }

    /** Respuesta rápida del carrito sin cargar datos de producto (solo tabla carrito_items). */
    private function cartResponseSimple($user): array
    {
        $items = $user->carritoItems()->orderBy('updated_at', 'desc')->get();
        $data = $items->map(fn (CarritoItem $i) => [
            'clave' => $i->clave,
            'nombre_producto' => $i->nombre_producto,
            'cantidad' => $i->cantidad,
            'precio_unitario' => (float) $i->precio_unitario,
            'subtotal' => (float) ($i->cantidad * $i->precio_unitario),
        ])->all();
        $total = $items->sum(fn (CarritoItem $i) => $i->cantidad * $i->precio_unitario);

        return [
            'success' => true,
            'data' => [
                'items' => $data,
                'total' => round($total, 2),
            ],
        ];
    }

    /**
     * Quitar un item del carrito. Respuesta rápida (solo BD carrito); el front une imagen/stock del estado anterior.
     */
    public function destroy(string $clave): JsonResponse
    {
        $user = Auth::user();
        $user->carritoItems()->where('clave', $clave)->delete();
        Cache::forget(self::cartCacheKey($user->id));

        return response()->json($this->cartResponseSimple($user));
    }

    /**
     * Crear pedido desde el carrito y vaciarlo (checkout).
     * Body: metodo_pago (ej. Efectivo, Transferencia).
     */
    public function checkout(Request $request): JsonResponse
    {
        $valid = $request->validate([
            'metodo_pago' => 'required|string|max:50',
        ]);

        $user = Auth::user();
        $items = $user->carritoItems()->get();

        if ($items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'El carrito está vacío.',
            ], 422);
        }

        try {
            $pedido = DB::transaction(function () use ($user, $items, $valid) {
                $lastId = (int) Pedido::withTrashed()->max('id');
                $folio = str_pad((string) ($lastId + 1), 6, '0', STR_PAD_LEFT);

                $p = $user->pedidos()->create([
                    'folio' => $folio,
                    'fecha' => now()->toDateString(),
                    'monto' => 0,
                    'metodo_pago' => $valid['metodo_pago'],
                    'estado_pago' => 'pagado',
                    'estatus_pedido' => 'completado',
                ]);

                $monto = 0;
                foreach ($items as $it) {
                    $q = (int) $it->cantidad;
                    $precio = (float) $it->precio_unitario;
                    $subtotal = $q * $precio;
                    $p->items()->create([
                        'nombre_producto' => $it->nombre_producto,
                        'cantidad' => $q,
                        'precio_unitario' => $precio,
                        'subtotal' => $subtotal,
                    ]);
                    $monto += $subtotal;
                }

                $p->update(['monto' => $monto]);
                $user->carritoItems()->delete();
                Cache::forget(self::cartCacheKey($user->id));

                return $p;
            });
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el pedido.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pedido creado.',
            'data' => [
                'id' => $pedido->id,
                'folio' => $pedido->folio,
            ],
        ], 201);
    }
}
