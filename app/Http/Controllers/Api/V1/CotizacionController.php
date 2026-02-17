<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\CotizacionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CotizacionController extends Controller
{
    private static function formatItem(CotizacionItem $i): array
    {
        return [
            'clave' => $i->clave,
            'cantidad' => $i->cantidad,
            'nombre_producto' => $i->nombre_producto,
            'precio_unitario' => (float) $i->precio_unitario,
            'subtotal' => (float) ($i->cantidad * $i->precio_unitario),
            'imagen' => $i->imagen,
        ];
    }

    private static function formatCotizacion(Cotizacion $c): array
    {
        $updatedAt = $c->updated_at ? $c->updated_at->format('c') : null;
        $createdAt = $c->created_at ? $c->created_at->format('c') : null;
        $fechaEditada = ($updatedAt && $createdAt && $updatedAt !== $createdAt) ? $updatedAt : null;

        return [
            'id' => $c->id,
            'fecha' => $createdAt,
            'fecha_editada' => $fechaEditada,
            'items' => $c->items->map(fn (CotizacionItem $i) => self::formatItem($i))->all(),
            'total' => (float) $c->total,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $cotizaciones = Auth::user()->cotizaciones()
            ->with('items')
            ->orderByDesc('created_at')
            ->get();

        $data = $cotizaciones->map(fn (Cotizacion $c) => self::formatCotizacion($c))->all();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $valid = $request->validate([
            'items' => 'required|array',
            'items.*.clave' => 'required|string|max:100',
            'items.*.cantidad' => 'required|integer|min:1|max:9999',
            'items.*.nombre_producto' => 'required|string|max:500',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.imagen' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();
        $items = array_values(array_filter($valid['items'], fn ($i) => ! empty($i['clave']) && (int) ($i['cantidad'] ?? 0) > 0));

        if (empty($items)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe incluir al menos un ítem.',
            ], 422);
        }

        $total = 0;
        foreach ($items as $it) {
            $q = (int) $it['cantidad'];
            $precio = (float) $it['precio_unitario'];
            $total += $q * $precio;
        }

        $cotizacion = $user->cotizaciones()->create(['total' => round($total, 2)]);

        foreach ($items as $it) {
            $cotizacion->items()->create([
                'clave' => $it['clave'],
                'nombre_producto' => $it['nombre_producto'],
                'cantidad' => (int) $it['cantidad'],
                'precio_unitario' => (float) $it['precio_unitario'],
                'imagen' => $it['imagen'] ?? null,
            ]);
        }

        $cotizacion->load('items');

        return response()->json([
            'success' => true,
            'message' => 'Cotización guardada.',
            'data' => self::formatCotizacion($cotizacion),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $cotizacion = Auth::user()->cotizaciones()->with('items')->find($id);
        if (! $cotizacion) {
            return response()->json(['success' => false, 'message' => 'Cotización no encontrada.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => self::formatCotizacion($cotizacion),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $cotizacion = Auth::user()->cotizaciones()->with('items')->find($id);
        if (! $cotizacion) {
            return response()->json(['success' => false, 'message' => 'Cotización no encontrada.'], 404);
        }

        $valid = $request->validate([
            'items' => 'required|array',
            'items.*.clave' => 'required|string|max:100',
            'items.*.cantidad' => 'required|integer|min:1|max:9999',
            'items.*.nombre_producto' => 'required|string|max:500',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.imagen' => 'nullable|string|max:1000',
        ]);

        $items = array_values(array_filter($valid['items'], fn ($i) => ! empty($i['clave']) && (int) ($i['cantidad'] ?? 0) > 0));

        if (empty($items)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe incluir al menos un ítem.',
            ], 422);
        }

        $total = 0;
        foreach ($items as $it) {
            $q = (int) $it['cantidad'];
            $precio = (float) $it['precio_unitario'];
            $total += $q * $precio;
        }

        $cotizacion->items()->delete();
        foreach ($items as $it) {
            $cotizacion->items()->create([
                'clave' => $it['clave'],
                'nombre_producto' => $it['nombre_producto'],
                'cantidad' => (int) $it['cantidad'],
                'precio_unitario' => (float) $it['precio_unitario'],
                'imagen' => $it['imagen'] ?? null,
            ]);
        }
        $cotizacion->update(['total' => round($total, 2)]);
        $cotizacion->load('items');

        return response()->json([
            'success' => true,
            'message' => 'Cotización actualizada.',
            'data' => self::formatCotizacion($cotizacion),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $cotizacion = Auth::user()->cotizaciones()->find($id);
        if (! $cotizacion) {
            return response()->json(['success' => false, 'message' => 'Cotización no encontrada.'], 404);
        }
        $cotizacion->delete();

        return response()->json(['success' => true, 'message' => 'Cotización movida a papelera.']);
    }

    public function papelera(): JsonResponse
    {
        $cotizaciones = Auth::user()->cotizaciones()
            ->onlyTrashed()
            ->with('items')
            ->orderByDesc('deleted_at')
            ->get();

        $data = $cotizaciones->map(function (Cotizacion $c) {
            $deletedAt = $c->deleted_at ? $c->deleted_at->format('c') : null;
            $diasRestantes = 0;
            if ($c->deleted_at) {
                $limite = $c->deleted_at->copy()->addDays(30);
                $diasRestantes = $limite->isPast() ? 0 : max(0, (int) now()->startOfDay()->diffInDays($limite->copy()->startOfDay(), false));
            }
            return array_merge(self::formatCotizacion($c), [
                'deleted_at' => $deletedAt,
                'dias_para_restaurar' => $diasRestantes,
            ]);
        })->all();

        return response()->json([
            'success' => true,
            'data' => ['cotizaciones' => $data],
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $cotizacion = Auth::user()->cotizaciones()->onlyTrashed()->find($id);
        if (! $cotizacion) {
            return response()->json(['success' => false, 'message' => 'Cotización no encontrada en papelera.'], 404);
        }
        if ($cotizacion->deleted_at) {
            $limite = $cotizacion->deleted_at->copy()->addDays(30);
            if (now()->isAfter($limite)) {
                return response()->json(['success' => false, 'message' => 'Ya pasaron más de 30 días. No se puede restaurar.'], 422);
            }
        }
        $cotizacion->restore();

        return response()->json(['success' => true, 'message' => 'Cotización restaurada.']);
    }
}
