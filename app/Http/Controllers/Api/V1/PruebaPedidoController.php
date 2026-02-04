<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Temporal: crea un pedido de prueba desde un formulario y permite descargar el PDF.
 * Eliminar cuando ya no se necesite.
 */
class PruebaPedidoController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $valid = $request->validate([
            'fecha' => 'required|date',
            'folio' => 'required|string|max:20|unique:pedidos,folio',
            'monto' => 'required|numeric|min:0',
            'metodo_pago' => 'required|string|max:50',
            'estado_pago' => 'required|string|in:pagado,pendiente,reembolsado',
            'estatus_pedido' => 'required|string|in:pendiente,en_proceso,enviado,completado,cancelado',
            'items' => 'required|array|min:1',
            'items.*.nombre_producto' => 'required|string|max:255',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $pedido = DB::transaction(function () use ($valid, $user) {
                $p = $user->pedidos()->create([
                    'folio' => $valid['folio'],
                    'fecha' => $valid['fecha'],
                    'monto' => (float) $valid['monto'],
                    'metodo_pago' => $valid['metodo_pago'],
                    'estado_pago' => $valid['estado_pago'],
                    'estatus_pedido' => $valid['estatus_pedido'],
                ]);

                foreach ($valid['items'] as $it) {
                    $q = (int) $it['cantidad'];
                    $precio = (float) $it['precio_unitario'];
                    $p->items()->create([
                        'nombre_producto' => $it['nombre_producto'],
                        'cantidad' => $q,
                        'precio_unitario' => $precio,
                        'subtotal' => $q * $precio,
                    ]);
                }

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
            'message' => 'Pedido de prueba creado.',
            'data' => ['id' => $pedido->id, 'folio' => $pedido->folio],
        ], 201);
    }
}
