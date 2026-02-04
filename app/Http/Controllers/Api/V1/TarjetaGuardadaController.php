<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TarjetaGuardada;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TarjetaGuardadaController extends Controller
{
    /**
     * Listar tarjetas del usuario autenticado. Solo ve las suyas.
     */
    public function index(): JsonResponse
    {
        $items = Auth::user()->tarjetasGuardadas()->orderByDesc('es_favorita')->orderByDesc('created_at')->get();

        $data = $items->map(fn (TarjetaGuardada $t) => [
            'id' => $t->id,
            'nombreTitular' => $t->nombre_titular,
            'last4' => $t->last4,
            'fechaCaducidad' => $t->fecha_caducidad,
            'esFavorita' => $t->es_favorita,
        ])->all();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Guardar nueva tarjeta. Se guarda el número completo (encriptado). CVV nunca se guarda.
     */
    public function store(Request $request): JsonResponse
    {
        $rules = [
            'nombre_titular' => 'required|string|max:150',
            'numero' => 'required|string|regex:/^\d{13,19}$/', // solo dígitos, 13-19 (no enviar CVV)
            'fecha_caducidad' => 'required|string|min:4|max:7', // MM/AA o MMAA
            'es_favorita' => 'boolean',
        ];
        $valid = $request->validate($rules);

        $numero = preg_replace('/\D/', '', $valid['numero']);
        $fecha = preg_replace('/\D/', '', $valid['fecha_caducidad']);
        if (strlen($fecha) === 4) {
            $valid['fecha_caducidad'] = substr($fecha, 0, 2) . '/' . substr($fecha, 2, 2);
        } else {
            $valid['fecha_caducidad'] = preg_replace('/\s+/', '', $valid['fecha_caducidad']);
        }
        $valid['user_id'] = Auth::id();
        $valid['last4'] = substr($numero, -4);
        $valid['es_favorita'] = (bool) ($valid['es_favorita'] ?? false);
        unset($valid['numero']);
        $valid['numero'] = $numero;

        if ($valid['es_favorita']) {
            Auth::user()->tarjetasGuardadas()->update(['es_favorita' => false]);
        }

        $t = TarjetaGuardada::create($valid);

        return response()->json([
            'success' => true,
            'message' => 'Tarjeta guardada.',
            'data' => [
                'id' => $t->id,
                'nombreTitular' => $t->nombre_titular,
                'last4' => $t->last4,
                'fechaCaducidad' => $t->fecha_caducidad,
                'esFavorita' => $t->es_favorita,
            ],
        ], 201);
    }

    /**
     * Actualizar tarjeta (nombre y/o favorita). Solo la del usuario.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $t = Auth::user()->tarjetasGuardadas()->find($id);
        if (!$t) {
            return response()->json(['success' => false, 'message' => 'Tarjeta no encontrada'], 404);
        }

        $rules = [
            'nombre_titular' => 'sometimes|string|max:150',
            'es_favorita' => 'boolean',
        ];
        $valid = $request->validate($rules);

        if (isset($valid['es_favorita']) && $valid['es_favorita']) {
            Auth::user()->tarjetasGuardadas()->where('id', '!=', $id)->update(['es_favorita' => false]);
        }

        $t->update(array_filter($valid));

        return response()->json([
            'success' => true,
            'message' => 'Tarjeta actualizada.',
            'data' => [
                'id' => $t->id,
                'nombreTitular' => $t->nombre_titular,
                'last4' => $t->last4,
                'fechaCaducidad' => $t->fecha_caducidad,
                'esFavorita' => $t->es_favorita,
            ],
        ]);
    }

    /**
     * Eliminar tarjeta. Solo la del usuario.
     */
    public function destroy(int $id): JsonResponse
    {
        $t = Auth::user()->tarjetasGuardadas()->find($id);
        if (!$t) {
            return response()->json(['success' => false, 'message' => 'Tarjeta no encontrada'], 404);
        }
        $t->delete();
        return response()->json(['success' => true, 'message' => 'Tarjeta eliminada.']);
    }
}
