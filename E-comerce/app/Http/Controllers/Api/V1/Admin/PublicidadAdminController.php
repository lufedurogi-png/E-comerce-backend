<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Publicidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class PublicidadAdminController extends Controller
{
    protected function getDisk(): string
    {
        return config('filesystems.publicidad_disk', 'public');
    }

    /**
     * Lista todas las imágenes de publicidad (incluye inactivas).
     */
    public function index(): JsonResponse
    {
        $imagenes = Publicidad::query()
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'url' => $p->url,
                'titulo' => $p->titulo,
                'orden' => $p->orden,
                'activo' => $p->activo,
            ]);

        return response()->json($imagenes, Response::HTTP_OK);
    }

    /**
     * Sube y guarda una nueva imagen de publicidad.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'imagen' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:9216',
            'titulo' => 'nullable|string|max:255',
            'orden' => 'nullable|integer|min:0',
        ]);

        $file = $request->file('imagen');
        $disk = $this->getDisk();

        $path = $file->store('publicidad', $disk);
        $url = Storage::disk($disk)->url($path);

        $orden = $request->input('orden');
        $maxOrden = Publicidad::max('orden') ?? 0;
        $orden = $orden !== null ? (int) $orden : $maxOrden + 1;

        $publicidad = Publicidad::create([
            'url' => $url,
            'path' => $path,
            'titulo' => $request->input('titulo'),
            'orden' => $orden,
            'activo' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Imagen guardada correctamente',
            'data' => [
                'id' => $publicidad->id,
                'url' => $publicidad->url,
                'titulo' => $publicidad->titulo,
                'orden' => $publicidad->orden,
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Elimina una imagen de publicidad.
     */
    public function destroy(int $id): JsonResponse
    {
        $publicidad = Publicidad::find($id);
        if (! $publicidad) {
            return response()->json(['success' => false, 'message' => 'No encontrada'], Response::HTTP_NOT_FOUND);
        }

        $disk = $this->getDisk();
        if ($publicidad->path && Storage::disk($disk)->exists($publicidad->path)) {
            Storage::disk($disk)->delete($publicidad->path);
        }

        $publicidad->delete();

        return response()->json([
            'success' => true,
            'message' => 'Imagen eliminada correctamente',
        ], Response::HTTP_OK);
    }
}
