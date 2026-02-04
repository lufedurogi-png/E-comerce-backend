<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DireccionEnvio;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DireccionEnvioController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Auth::user()->direccionesEnvio()->orderByDesc('es_principal')->orderByDesc('created_at')->get();

        $data = $items->map(fn (DireccionEnvio $d) => [
            'id' => $d->id,
            'nombre' => $d->nombre,
            'direccion' => trim(implode(' ', array_filter([
                $d->calle,
                $d->numero_exterior,
                $d->numero_interior,
            ]))),
            'direccion2' => $d->referencias ?? '',
            'ciudad' => implode(', ', array_filter([$d->ciudad, $d->estado, 'MÉXICO'])),
            'ciudad_nombre' => $d->ciudad,
            'telefono' => $d->telefono,
            'calle' => $d->calle,
            'numero_exterior' => $d->numero_exterior,
            'numero_interior' => $d->numero_interior,
            'colonia' => $d->colonia,
            'estado' => $d->estado,
            'codigo_postal' => $d->codigo_postal,
            'referencias' => $d->referencias,
            'es_principal' => $d->es_principal,
        ])->all();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $rules = [
            'nombre' => 'required|string|max:100',
            'calle' => 'required|string|max:250',
            'numero_exterior' => 'nullable|string|max:10',
            'numero_interior' => 'nullable|string|max:10',
            'colonia' => 'required|string|max:250',
            'ciudad' => 'required|string|max:100',
            'estado' => 'required|string|max:100',
            'codigo_postal' => 'required|string|size:5',
            'referencias' => 'nullable|string|max:500',
            'telefono' => 'required|string|max:20',
            'es_principal' => 'boolean',
        ];
        $valid = $request->validate($rules);

        $valid['user_id'] = Auth::id();
        $valid['es_principal'] = (bool) ($valid['es_principal'] ?? false);

        if ($valid['es_principal']) {
            Auth::user()->direccionesEnvio()->update(['es_principal' => false]);
        }

        $d = DireccionEnvio::create($valid);

        return response()->json([
            'success' => true,
            'message' => 'Dirección de envío creada.',
            'data' => [
                'id' => $d->id,
                'nombre' => $d->nombre,
                'direccion' => trim(implode(' ', array_filter([$d->calle, $d->numero_exterior, $d->numero_interior]))),
                'direccion2' => $d->referencias ?? '',
                'ciudad' => implode(', ', array_filter([$d->ciudad, $d->estado, 'MÉXICO'])),
                'telefono' => $d->telefono,
            ],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $d = Auth::user()->direccionesEnvio()->find($id);
        if (!$d) {
            return response()->json(['success' => false, 'message' => 'Dirección no encontrada'], 404);
        }

        $rules = [
            'nombre' => 'sometimes|string|max:100',
            'calle' => 'sometimes|string|max:250',
            'numero_exterior' => 'nullable|string|max:10',
            'numero_interior' => 'nullable|string|max:10',
            'colonia' => 'sometimes|string|max:250',
            'ciudad' => 'sometimes|string|max:100',
            'estado' => 'sometimes|string|max:100',
            'codigo_postal' => 'sometimes|string|size:5',
            'referencias' => 'nullable|string|max:500',
            'telefono' => 'sometimes|string|max:20',
            'es_principal' => 'boolean',
        ];
        $valid = $request->validate($rules);

        if (!empty($valid['es_principal'])) {
            Auth::user()->direccionesEnvio()->update(['es_principal' => false]);
        }

        $d->update(array_filter($valid));

        return response()->json([
            'success' => true,
            'message' => 'Dirección actualizada.',
            'data' => [
                'id' => $d->id,
                'nombre' => $d->nombre,
                'direccion' => trim(implode(' ', array_filter([$d->calle, $d->numero_exterior, $d->numero_interior]))),
                'direccion2' => $d->referencias ?? '',
                'ciudad' => implode(', ', array_filter([$d->ciudad, $d->estado, 'MÉXICO'])),
                'telefono' => $d->telefono,
            ],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $d = Auth::user()->direccionesEnvio()->find($id);
        if (!$d) {
            return response()->json(['success' => false, 'message' => 'Dirección no encontrada'], 404);
        }
        if (Pedido::where('direccion_envio_id', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar: la dirección está asociada a uno o más pedidos.',
            ], 422);
        }
        $d->delete();
        return response()->json(['success' => true, 'message' => 'Dirección eliminada.']);
    }
}
