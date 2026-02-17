<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductoCva;
use App\Models\ProductoManual;
use App\Services\BusquedaService;
use App\Services\CVAService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusquedaController extends Controller
{
    public function __construct(
        private readonly BusquedaService $busqueda,
        private readonly CVAService $cva
    ) {}

    private function catalogAvailable(): bool
    {
        return $this->cva->isConfigured()
            || ProductoCva::exists()
            || ProductoManual::where('anulado', false)->exists();
    }

    /**
     * Búsqueda tolerante a errores: normaliza la consulta, devuelve productos
     * priorizados por relevancia histórica y registra la búsqueda y los productos mostrados.
     *
     * Query: ?q=...&session_id=... (session_id opcional; user_id se toma del auth si existe)
     */
    public function index(Request $request): JsonResponse
    {
        if (! $this->catalogAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'El catálogo de productos no está disponible en este momento.',
                'code' => 'CATALOG_UNAVAILABLE',
            ], 503);
        }

        $q = $request->input('q', '');
        if (! is_string($q)) {
            $q = '';
        }
        $sessionId = $request->input('session_id');
        $userId = $request->user()?->id;

        $resultado = $this->busqueda->buscar($q, $sessionId, $userId);

        return response()->json([
            'success' => true,
            'data' => $resultado,
        ]);
    }

    /**
     * Registra que el usuario hizo clic en un producto dentro de los resultados de una búsqueda.
     * Body: busqueda_id (int), producto_clave (string)
     */
    public function registrarSeleccion(Request $request): JsonResponse
    {
        $busquedaId = (int) $request->input('busqueda_id');
        $productoClave = $request->input('producto_clave');
        if (! is_string($productoClave) || trim($productoClave) === '') {
            return response()->json([
                'success' => false,
                'message' => 'producto_clave es obligatorio.',
            ], 422);
        }

        $ok = $this->busqueda->registrarSeleccion($busquedaId, trim($productoClave));
        if (! $ok) {
            return response()->json([
                'success' => false,
                'message' => 'Búsqueda no encontrada.',
            ], 404);
        }

        return response()->json(['success' => true, 'message' => 'Selección registrada.']);
    }
}
