<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DatoFacturacion;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DatoFacturacionController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Auth::user()->datosFacturacion()->orderByDesc('es_principal')->orderByDesc('created_at')->get();

        $data = $items->map(fn (DatoFacturacion $d) => [
            'id' => $d->id,
            'razon_social' => $d->razon_social,
            'rfc' => $d->rfc,
            'calle' => $d->calle,
            'numero_exterior' => $d->numero_exterior,
            'numero_interior' => $d->numero_interior,
            'colonia' => $d->colonia,
            'ciudad' => $d->ciudad,
            'estado' => $d->estado,
            'codigo_postal' => $d->codigo_postal,
            'email_facturacion' => $d->email_facturacion,
            'telefono' => $d->telefono,
            'es_principal' => $d->es_principal,
        ])->all();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $rules = [
            'razon_social' => 'required|string|max:250',
            'rfc' => 'required|string|min:12|max:14',
            'calle' => 'required|string|max:250',
            'numero_exterior' => 'nullable|string|max:10',
            'numero_interior' => 'nullable|string|max:10',
            'colonia' => 'required|string|max:250',
            'ciudad' => 'required|string|max:100',
            'estado' => 'required|string|max:100',
            'codigo_postal' => 'required|string|size:5',
            'email_facturacion' => 'nullable|email|max:100',
            'telefono' => 'nullable|string|max:20',
            'es_principal' => 'boolean',
        ];
        $valid = $request->validate($rules);

        $valid['user_id'] = Auth::id();
        $valid['es_principal'] = (bool) ($valid['es_principal'] ?? false);
        $valid['rfc'] = strtoupper(preg_replace('/\s+/', '', $valid['rfc']));

        if ($valid['es_principal']) {
            Auth::user()->datosFacturacion()->update(['es_principal' => false]);
        }

        $d = DatoFacturacion::create($valid);

        return response()->json([
            'success' => true,
            'message' => 'Datos de facturación creados.',
            'data' => [
                'id' => $d->id,
                'razon_social' => $d->razon_social,
                'rfc' => $d->rfc,
                'calle' => $d->calle,
                'numero_exterior' => $d->numero_exterior,
                'numero_interior' => $d->numero_interior,
                'colonia' => $d->colonia,
                'ciudad' => $d->ciudad,
                'estado' => $d->estado,
                'codigo_postal' => $d->codigo_postal,
                'email_facturacion' => $d->email_facturacion,
                'telefono' => $d->telefono,
                'es_principal' => $d->es_principal,
            ],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $d = Auth::user()->datosFacturacion()->find($id);
        if (!$d) {
            return response()->json(['success' => false, 'message' => 'Datos de facturación no encontrados'], 404);
        }

        $rules = [
            'razon_social' => 'sometimes|string|max:250',
            'rfc' => 'sometimes|string|min:12|max:14',
            'calle' => 'sometimes|string|max:250',
            'numero_exterior' => 'nullable|string|max:10',
            'numero_interior' => 'nullable|string|max:10',
            'colonia' => 'sometimes|string|max:250',
            'ciudad' => 'sometimes|string|max:100',
            'estado' => 'sometimes|string|max:100',
            'codigo_postal' => 'sometimes|string|size:5',
            'email_facturacion' => 'nullable|email|max:100',
            'telefono' => 'nullable|string|max:20',
            'es_principal' => 'boolean',
        ];
        $valid = $request->validate($rules);

        if (isset($valid['rfc'])) {
            $valid['rfc'] = strtoupper(preg_replace('/\s+/', '', $valid['rfc']));
        }
        if (!empty($valid['es_principal'])) {
            Auth::user()->datosFacturacion()->update(['es_principal' => false]);
        }

        $d->update(array_filter($valid));

        return response()->json([
            'success' => true,
            'message' => 'Datos de facturación actualizados.',
            'data' => [
                'id' => $d->id,
                'razon_social' => $d->razon_social,
                'rfc' => $d->rfc,
                'calle' => $d->calle,
                'numero_exterior' => $d->numero_exterior,
                'numero_interior' => $d->numero_interior,
                'colonia' => $d->colonia,
                'ciudad' => $d->ciudad,
                'estado' => $d->estado,
                'codigo_postal' => $d->codigo_postal,
                'email_facturacion' => $d->email_facturacion,
                'telefono' => $d->telefono,
                'es_principal' => $d->es_principal,
            ],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $d = Auth::user()->datosFacturacion()->find($id);
        if (!$d) {
            return response()->json(['success' => false, 'message' => 'Datos de facturación no encontrados'], 404);
        }
        if (Pedido::where('datos_facturacion_id', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar: los datos de facturación están asociados a uno o más pedidos.',
            ], 422);
        }
        $d->delete();
        return response()->json(['success' => true, 'message' => 'Datos de facturación eliminados.']);
    }
}
