<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\PedidoItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class PedidoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Auth::user()->pedidos()->with('items')->orderByDesc('fecha');

        if ($request->filled('fecha_desde')) {
            $q->where('fecha', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $q->where('fecha', '<=', $request->fecha_hasta);
        }
        if ($request->filled('pago') && $request->pago !== 'todos') {
            $q->where('estado_pago', $request->pago);
        }
        if ($request->filled('estatus') && $request->estatus !== 'todos') {
            $q->where('estatus_pedido', $request->estatus);
        }
        if ($request->filled('folio')) {
            $q->where('folio', 'like', '%' . $request->folio . '%');
        }

        $perPage = (int) $request->get('per_page', 3);
        $perPage = in_array($perPage, [3, 10, 25, 50, 100], true) ? $perPage : 3;
        $paginated = $q->paginate($perPage);

        $items = collect($paginated->items())->map(fn (Pedido $p) => [
            'id' => $p->id,
            'fecha' => $p->fecha->format('d-m-Y'),
            'folio' => $p->folio,
            'monto' => (float) $p->monto,
            'metodo_pago' => $p->metodo_pago,
            'estado_pago' => $p->estado_pago,
            'estatus_pedido' => $p->estatus_pedido,
            'items' => $p->items->map(fn (PedidoItem $i) => [
                'nombre_producto' => $i->nombre_producto,
                'cantidad' => $i->cantidad,
                'precio_unitario' => (float) $i->precio_unitario,
                'subtotal' => (float) $i->subtotal,
            ])->all(),
        ])->all();

        return response()->json([
            'success' => true,
            'data' => [
                'pedidos' => $items,
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $pedido = Auth::user()->pedidos()->with(['items', 'direccionEnvio', 'datosFacturacion'])->find($id);
        if (!$pedido) {
            return response()->json(['success' => false, 'message' => 'Pedido no encontrado'], 404);
        }

        $d = $pedido;
        $data = [
            'id' => $d->id,
            'folio' => $d->folio,
            'fecha' => $d->fecha->format('d-m-Y'),
            'monto' => (float) $d->monto,
            'metodo_pago' => $d->metodo_pago,
            'estado_pago' => $d->estado_pago,
            'estatus_pedido' => $d->estatus_pedido,
            'items' => $d->items->map(fn (PedidoItem $i) => [
                'nombre_producto' => $i->nombre_producto,
                'cantidad' => $i->cantidad,
                'precio_unitario' => (float) $i->precio_unitario,
                'subtotal' => (float) $i->subtotal,
            ])->all(),
            'direccion_envio' => null,
            'datos_facturacion' => null,
        ];

        if ($d->direccionEnvio) {
            $de = $d->direccionEnvio;
            $data['direccion_envio'] = [
                'nombre' => $de->nombre,
                'calle' => $de->calle,
                'numero_exterior' => $de->numero_exterior,
                'numero_interior' => $de->numero_interior,
                'colonia' => $de->colonia,
                'ciudad' => $de->ciudad,
                'estado' => $de->estado,
                'codigo_postal' => $de->codigo_postal,
                'referencias' => $de->referencias,
                'telefono' => $de->telefono,
            ];
        }
        if ($d->datosFacturacion) {
            $df = $d->datosFacturacion;
            $data['datos_facturacion'] = [
                'razon_social' => $df->razon_social,
                'rfc' => $df->rfc,
                'calle' => $df->calle,
                'numero_exterior' => $df->numero_exterior,
                'numero_interior' => $df->numero_interior,
                'colonia' => $df->colonia,
                'ciudad' => $df->ciudad,
                'estado' => $df->estado,
                'codigo_postal' => $df->codigo_postal,
            ];
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function downloadPdf(int $id): Response|JsonResponse
    {
        $pedido = Auth::user()->pedidos()->with(['items', 'direccionEnvio', 'datosFacturacion', 'user'])->find($id);
        if (!$pedido) {
            return response()->json(['success' => false, 'message' => 'Pedido no encontrado'], 404);
        }

        $pdf = Pdf::loadView('pdf.pedido', ['pedido' => $pedido]);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->download('pedido-' . $pedido->folio . '.pdf');
    }

    /**
     * Mover pedido a papelera (soft delete). Solo si estatus es Completado o Cancelado.
     */
    public function destroy(int $id): JsonResponse
    {
        $pedido = Auth::user()->pedidos()->find($id);
        if (!$pedido) {
            return response()->json(['success' => false, 'message' => 'Pedido no encontrado'], 404);
        }
        $estatus = strtolower((string) $pedido->estatus_pedido);
        $permitidos = ['completado', 'cancelado'];
        if (!in_array($estatus, $permitidos, true)) {
            return response()->json(['success' => false, 'message' => 'Solo se pueden mover a papelera pedidos Completados o Cancelados.'], 422);
        }
        $pedido->delete();
        return response()->json(['success' => true, 'message' => 'Pedido movido a papelera.']);
    }

    /**
     * Listar pedidos en papelera (eliminados). 30 días para restaurar.
     */
    public function papelera(): JsonResponse
    {
        $pedidos = Auth::user()->pedidos()->onlyTrashed()->with('items')->orderByDesc('deleted_at')->get();
        $items = $pedidos->map(function (Pedido $p) {
            $deletedAt = $p->deleted_at ? $p->deleted_at->format('c') : null;
            $diasRestantes = null;
            if ($p->deleted_at) {
                $limite = $p->deleted_at->copy()->addDays(30);
                $diasRestantes = $limite->isPast() ? 0 : max(0, (int) now()->startOfDay()->diffInDays($limite->copy()->startOfDay(), false));
            }
            return [
                'id' => $p->id,
                'fecha' => $p->fecha->format('d-m-Y'),
                'folio' => $p->folio,
                'monto' => (float) $p->monto,
                'metodo_pago' => $p->metodo_pago,
                'estado_pago' => $p->estado_pago,
                'estatus_pedido' => $p->estatus_pedido,
                'deleted_at' => $deletedAt,
                'dias_para_restaurar' => $diasRestantes,
                'items' => $p->items->map(fn (PedidoItem $i) => [
                    'nombre_producto' => $i->nombre_producto,
                    'cantidad' => $i->cantidad,
                    'precio_unitario' => (float) $i->precio_unitario,
                    'subtotal' => (float) $i->subtotal,
                ])->all(),
            ];
        })->all();

        return response()->json(['success' => true, 'data' => ['pedidos' => $items]]);
    }

    /**
     * Restaurar pedido desde papelera. Solo si no han pasado más de 30 días.
     */
    public function restore(int $id): JsonResponse
    {
        $pedido = Auth::user()->pedidos()->onlyTrashed()->find($id);
        if (!$pedido) {
            return response()->json(['success' => false, 'message' => 'Pedido no encontrado en papelera.'], 404);
        }
        if (!$pedido->deleted_at) {
            $pedido->restore();
            return response()->json(['success' => true, 'message' => 'Pedido restaurado.']);
        }
        $limite = $pedido->deleted_at->copy()->addDays(30);
        if (now()->isAfter($limite)) {
            return response()->json(['success' => false, 'message' => 'Ya pasaron más de 30 días. No se puede restaurar.'], 422);
        }
        $pedido->restore();
        return response()->json(['success' => true, 'message' => 'Pedido restaurado.']);
    }
}
