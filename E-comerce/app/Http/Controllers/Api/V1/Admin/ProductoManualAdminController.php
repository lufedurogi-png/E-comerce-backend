<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductoManual;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ProductoManualAdminController extends Controller
{
    protected function getDisk(): string
    {
        return config('filesystems.productos_disk', 'public');
    }

    public function index(Request $request): JsonResponse
    {
        $query = ProductoManual::query()->orderByDesc('created_at');

        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('descripcion', 'like', "%{$term}%")
                    ->orWhere('clave', 'like', "%{$term}%")
                    ->orWhere('marca', 'like', "%{$term}%")
                    ->orWhere('codigo_fabricante', 'like', "%{$term}%");
            });
        }
        if ($request->filled('grupo')) {
            $query->where('grupo', $request->input('grupo'));
        }
        if ($request->filled('marca')) {
            $query->where('marca', $request->input('marca'));
        }
        if ($request->filled('principal')) {
            $query->where('principal', $request->input('principal'));
        }
        if ($request->has('anulado')) {
            $query->where('anulado', filter_var($request->input('anulado'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $items = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $items->getCollection(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ], Response::HTTP_OK);
    }

    public function store(Request $request): JsonResponse
    {
        $this->mergeJsonFields($request);

        $validated = $request->validate([
            'descripcion' => 'required|string|max:500',
            'codigo_fabricante' => 'nullable|string|max:200',
            'principal' => 'required|string|max:100',
            'grupo' => 'required|string|max:150',
            'marca' => 'required|string|max:150',
            'garantia' => 'nullable|string|max:50',
            'clase' => 'nullable|string|max:20',
            'moneda' => 'nullable|string|max:20',
            'precio' => 'required|numeric|min:0',
            'disponible' => 'nullable|integer|min:0',
            'disponible_cd' => 'nullable|integer|min:0',
            'ficha_tecnica' => 'nullable|string',
            'ficha_comercial' => 'nullable|string',
            'destacado' => 'nullable|boolean',
            'imagen' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:9216',
            'imagenes_secundarias' => 'nullable|array|max:20',
            'imagenes_secundarias.*' => 'image|mimes:jpeg,jpg,png,gif,webp|max:9216',
            'especificaciones_tecnicas' => 'nullable|array',
            'especificaciones_tecnicas.*.nombre' => 'required_with:especificaciones_tecnicas|string|max:255',
            'especificaciones_tecnicas.*.valor' => 'nullable|string|max:500',
            'dimensiones' => 'nullable|array',
            'dimensiones.*.nombre' => 'required_with:dimensiones|string|max:255',
            'dimensiones.*.valor' => 'nullable|string|max:500',
            'informacion_general' => 'nullable|array',
            'informacion_general.*.nombre' => 'required_with:informacion_general|string|max:255',
            'informacion_general.*.valor' => 'nullable|string|max:500',
        ]);

        $disk = $this->getDisk();

        $mainFile = $request->file('imagen');
        $mainPath = $mainFile->store('productos', $disk);
        $mainUrl = Storage::disk($disk)->url($mainPath);

        $secundarias = [];
        if ($request->hasFile('imagenes_secundarias')) {
            foreach ($request->file('imagenes_secundarias') as $file) {
                $path = $file->store('productos', $disk);
                $secundarias[] = Storage::disk($disk)->url($path);
            }
        }

        $clave = ProductoManual::generarClave();

        $producto = ProductoManual::create([
            'clave' => $clave,
            'codigo_fabricante' => $validated['codigo_fabricante'] ?? null,
            'descripcion' => $validated['descripcion'],
            'principal' => $validated['principal'],
            'grupo' => $validated['grupo'],
            'marca' => $validated['marca'],
            'garantia' => $validated['garantia'] ?? null,
            'clase' => $validated['clase'] ?? null,
            'moneda' => $validated['moneda'] ?? 'MXN',
            'precio' => $validated['precio'],
            'imagen' => $mainUrl,
            'imagenes' => $secundarias,
            'disponible' => $validated['disponible'] ?? 0,
            'disponible_cd' => $validated['disponible_cd'] ?? 0,
            'ficha_tecnica' => $validated['ficha_tecnica'] ?? null,
            'ficha_comercial' => $validated['ficha_comercial'] ?? null,
            'destacado' => $validated['destacado'] ?? false,
            'especificaciones_tecnicas' => $this->sanitizeSpecArray($validated['especificaciones_tecnicas'] ?? []),
            'dimensiones' => $this->sanitizeSpecArray($validated['dimensiones'] ?? []),
            'informacion_general' => $this->sanitizeSpecArray($validated['informacion_general'] ?? []),
            'anulado' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Producto creado correctamente',
            'data' => $producto,
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $producto = ProductoManual::find($id);
        if (! $producto) {
            return response()->json(['success' => false, 'message' => 'No encontrado'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['success' => true, 'data' => $producto], Response::HTTP_OK);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $producto = ProductoManual::find($id);
        if (! $producto) {
            return response()->json(['success' => false, 'message' => 'No encontrado'], Response::HTTP_NOT_FOUND);
        }

        $this->mergeJsonFields($request);

        $validated = $request->validate([
            'descripcion' => 'sometimes|required|string|max:500',
            'codigo_fabricante' => 'nullable|string|max:200',
            'principal' => 'sometimes|required|string|max:100',
            'grupo' => 'sometimes|required|string|max:150',
            'marca' => 'sometimes|required|string|max:150',
            'garantia' => 'nullable|string|max:50',
            'clase' => 'nullable|string|max:20',
            'moneda' => 'nullable|string|max:20',
            'precio' => 'sometimes|required|numeric|min:0',
            'disponible' => 'nullable|integer|min:0',
            'disponible_cd' => 'nullable|integer|min:0',
            'ficha_tecnica' => 'nullable|string',
            'ficha_comercial' => 'nullable|string',
            'destacado' => 'nullable|boolean',
            'imagen' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:9216',
            'imagenes_secundarias' => 'nullable|array|max:20',
            'imagenes_secundarias.*' => 'image|mimes:jpeg,jpg,png,gif,webp|max:9216',
            'especificaciones_tecnicas' => 'nullable|array',
            'dimensiones' => 'nullable|array',
            'informacion_general' => 'nullable|array',
            'informacion_general.*.nombre' => 'required_with:informacion_general|string|max:255',
            'informacion_general.*.valor' => 'nullable|string|max:500',
            'eliminar_imagen_principal' => 'nullable|boolean',
            'imagenes_secundarias_eliminar' => 'nullable|array',
            'imagenes_secundarias_eliminar.*' => 'string|max:600',
        ]);

        $disk = $this->getDisk();

        if (filter_var($request->input('eliminar_imagen_principal'), FILTER_VALIDATE_BOOLEAN)) {
            $this->deleteImageIfStored($producto->imagen, $disk);
            $producto->imagen = null;
        } elseif ($request->hasFile('imagen')) {
            $this->deleteImageIfStored($producto->imagen, $disk);
            $mainPath = $request->file('imagen')->store('productos', $disk);
            $producto->imagen = Storage::disk($disk)->url($mainPath);
        }

        $urlsToRemove = $request->input('imagenes_secundarias_eliminar', []);
        $currentSecundarias = $producto->imagenes ?? [];
        if (is_array($urlsToRemove) && ! empty($urlsToRemove)) {
            foreach ($urlsToRemove as $url) {
                $this->deleteImageIfStored($url, $disk);
                $currentSecundarias = array_values(array_filter($currentSecundarias, fn ($u) => $u !== $url));
            }
            $producto->imagenes = $currentSecundarias;
        }
        if ($request->hasFile('imagenes_secundarias')) {
            $nuevas = [];
            foreach ($request->file('imagenes_secundarias') as $file) {
                $path = $file->store('productos', $disk);
                $nuevas[] = Storage::disk($disk)->url($path);
            }
            $producto->imagenes = array_merge($currentSecundarias, $nuevas);
        }

        $skip = ['imagen', 'imagenes_secundarias', 'informacion_general'];
        foreach ($validated as $key => $value) {
            if (! in_array($key, $skip, true)) {
                $producto->$key = $value;
            }
        }
        if (isset($validated['especificaciones_tecnicas'])) {
            $producto->especificaciones_tecnicas = $this->sanitizeSpecArray($validated['especificaciones_tecnicas']);
        }
        if (isset($validated['dimensiones'])) {
            $producto->dimensiones = $this->sanitizeSpecArray($validated['dimensiones']);
        }
        if (array_key_exists('informacion_general', $validated)) {
            $producto->informacion_general = $this->sanitizeSpecArray($validated['informacion_general']);
        }
        $producto->save();

        return response()->json([
            'success' => true,
            'message' => 'Producto actualizado',
            'data' => $producto->fresh(),
        ], Response::HTTP_OK);
    }

    public function destroy(int $id): JsonResponse
    {
        $producto = ProductoManual::find($id);
        if (! $producto) {
            return response()->json(['success' => false, 'message' => 'No encontrado'], Response::HTTP_NOT_FOUND);
        }

        $disk = $this->getDisk();
        $this->deleteImageIfStored($producto->imagen, $disk);
        foreach ($producto->imagenes ?? [] as $url) {
            $this->deleteImageIfStored($url, $disk);
        }
        $producto->delete();

        return response()->json(['success' => true, 'message' => 'Producto eliminado'], Response::HTTP_OK);
    }

    public function toggleAnulado(int $id): JsonResponse
    {
        $producto = ProductoManual::find($id);
        if (! $producto) {
            return response()->json(['success' => false, 'message' => 'No encontrado'], Response::HTTP_NOT_FOUND);
        }
        $producto->anulado = ! $producto->anulado;
        $producto->save();

        return response()->json([
            'success' => true,
            'message' => $producto->anulado ? 'Producto anulado' : 'Producto reactivado',
            'data' => ['anulado' => $producto->anulado],
        ], Response::HTTP_OK);
    }

    public function gruposDistintos(): JsonResponse
    {
        $grupos = ProductoManual::query()
            ->select('grupo')
            ->distinct()
            ->whereNotNull('grupo')
            ->where('grupo', '!=', '')
            ->orderBy('grupo')
            ->pluck('grupo')
            ->all();

        return response()->json($grupos, Response::HTTP_OK);
    }

    public function marcasDistintas(): JsonResponse
    {
        $marcas = ProductoManual::query()
            ->select('marca')
            ->distinct()
            ->whereNotNull('marca')
            ->where('marca', '!=', '')
            ->orderBy('marca')
            ->pluck('marca')
            ->all();

        return response()->json($marcas, Response::HTTP_OK);
    }

    private function mergeJsonFields(Request $request): void
    {
        foreach (['especificaciones_tecnicas', 'dimensiones', 'informacion_general'] as $field) {
            $raw = $request->input($field);
            if (is_string($raw)) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $request->merge([$field => $decoded]);
                }
            }
        }
    }

    private function sanitizeSpecArray(?array $arr): array
    {
        if (! is_array($arr)) {
            return [];
        }
        $out = [];
        foreach ($arr as $item) {
            if (is_array($item) && ! empty(trim($item['nombre'] ?? ''))) {
                $out[] = [
                    'nombre' => trim($item['nombre']),
                    'valor' => trim($item['valor'] ?? ''),
                ];
            }
        }

        return $out;
    }

    private function deleteImageIfStored(?string $url, string $disk): void
    {
        if (! $url) {
            return;
        }
        $baseUrl = rtrim(Storage::disk($disk)->url(''), '/');
        $path = str_replace($baseUrl.'/', '', $url);
        if ($path && $path !== $url && Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }
}
