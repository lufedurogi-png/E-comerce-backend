<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Publicidad;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PublicidadController extends Controller
{
    /**
     * Lista las imágenes de publicidad (público - para el carrusel de la tienda).
     */
    public function index(): JsonResponse
    {
        $imagenes = Publicidad::query()
            ->where('activo', true)
            ->orderBy('orden')
            ->orderBy('id')
            ->get(['id', 'url', 'titulo', 'orden'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'url' => $p->url,
                'titulo' => $p->titulo,
                'orden' => $p->orden,
            ]);

        return response()->json($imagenes, Response::HTTP_OK);
    }
}
