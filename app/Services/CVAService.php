<?php

namespace App\Services;

use App\Models\ProductoCva;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CVAService
{
    private string $baseUrl;

    private ?string $user;

    private ?string $password;

    private int $tokenTtlHours;

    private float $porcentaje;

    private bool $monedaPesos;

    private const CACHE_TOKEN_KEY = 'cva_api_token';

    public function __construct()
    {
        $config = config('services.cva');
        $this->baseUrl = rtrim($config['base_url'] ?? '', '/');
        $this->user = $config['user'] ?? null;
        $this->password = $config['password'] ?? null;
        $this->tokenTtlHours = (int) ($config['token_ttl_hours'] ?? 12);
        $this->porcentaje = (float) ($config['porcentaje_utilidad'] ?? 0);
        $this->monedaPesos = (bool) ($config['moneda_pesos'] ?? true);
    }

    public function isConfigured(): bool
    {
        return ! empty($this->user) && ! empty($this->password);
    }

    /**
     * Obtiene el token CVA (desde cache si es válido, o genera uno nuevo).
     */
    public function getToken(): ?string
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $token = Cache::get(self::CACHE_TOKEN_KEY);
        if ($token) {
            return $token;
        }

        $response = Http::acceptJson()
            ->post($this->baseUrl.'/user/login', [
                'user' => $this->user,
                'password' => $this->password,
            ]);

        if (! $response->successful()) {
            Log::warning('CVA login failed', ['status' => $response->status(), 'body' => $response->body()]);

            return null;
        }

        $data = $response->json();
        $token = $data['token'] ?? null;
        if ($token) {
            Cache::put(self::CACHE_TOKEN_KEY, $token, now()->addHours($this->tokenTtlHours));
        }

        return $token;
    }

    /**
     * Limpia el token en cache (útil cuando hay 403).
     */
    public function forgetToken(): void
    {
        Cache::forget(self::CACHE_TOKEN_KEY);
    }

    /**
     * Obtiene una página del catálogo CVA (lista_precios).
     *
     * @param  array{page?: int, grupo?: string, marca?: string, desc?: string, images?: bool, dt?: bool, dc?: bool, MonedaPesos?: bool, porcentaje?: float}  $params
     */
    public function fetchListaPrecios(array $params = []): array
    {
        $token = $this->getToken();
        if (! $token) {
            return ['articulos' => [], 'paginacion' => ['total_paginas' => 0, 'pagina' => 1], 'error' => 'no_credentials'];
        }

        $query = array_filter([
            'page' => $params['page'] ?? 1,
            'grupo' => $params['grupo'] ?? null,
            'marca' => $params['marca'] ?? null,
            'desc' => $params['desc'] ?? null,
            'images' => ($params['images'] ?? true) ? '1' : null,
            'dt' => ($params['dt'] ?? false) ? '1' : null,
            'dc' => ($params['dc'] ?? false) ? '1' : null,
            'subgpo' => ($params['subgpo'] ?? false) ? '1' : null,
            'MonedaPesos' => $this->monedaPesos ? 'true' : null,
            'porcentaje' => $this->porcentaje > 0 ? $this->porcentaje : null,
        ]);

        $response = Http::acceptJson()
            ->withToken($token)
            ->get($this->baseUrl.'/catalogo_clientes/lista_precios', $query);

        if ($response->status() === 403) {
            $this->forgetToken();

            return ['articulos' => [], 'paginacion' => ['total_paginas' => 0, 'pagina' => 1], 'error' => 'token_expired'];
        }

        if (! $response->successful()) {
            Log::warning('CVA lista_precios failed', ['status' => $response->status()]);

            return ['articulos' => [], 'paginacion' => ['total_paginas' => 0, 'pagina' => 1], 'error' => 'api_error'];
        }

        $data = $response->json();
        if (isset($data['articulos'])) {
            return [
                'articulos' => $data['articulos'],
                'paginacion' => $data['paginacion'] ?? ['total_paginas' => 1, 'pagina' => 1],
            ];
        }

        if (isset($data['id'])) {
            return [
                'articulos' => [$data],
                'paginacion' => ['total_paginas' => 1, 'pagina' => 1],
            ];
        }

        return ['articulos' => [], 'paginacion' => ['total_paginas' => 0, 'pagina' => 1]];
    }

    /**
     * Obtiene un producto individual por clave (con imágenes y descripciones).
     */
    public function fetchProducto(string $clave): ?array
    {
        $token = $this->getToken();
        if (! $token) {
            return null;
        }

        $query = [
            'clave' => $clave,
            'images' => '1',
            'dt' => '1',
            'dc' => '1',
            'MonedaPesos' => $this->monedaPesos ? 'true' : 'true',
            'porcentaje' => $this->porcentaje > 0 ? $this->porcentaje : null,
        ];
        $query = array_filter($query);

        $response = Http::acceptJson()
            ->withToken($token)
            ->get($this->baseUrl.'/catalogo_clientes/lista_precios', $query);

        if ($response->status() === 403) {
            $this->forgetToken();

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $data = $response->json();
        if (isset($data['id']) || isset($data['clave'])) {
            return $data;
        }

        return null;
    }

    /**
     * Sincroniza una página del catálogo a la tabla productos_cva.
     */
    public function syncPage(int $page = 1): array
    {
        $result = $this->fetchListaPrecios(['page' => $page, 'images' => true, 'subgpo' => true]);
        if (! empty($result['error'])) {
            return $result;
        }

        $count = 0;
        foreach ($result['articulos'] as $art) {
            $saved = $this->upsertArticulo($art);
            if ($saved) {
                $count++;
            }
        }

        return ['synced' => $count, 'paginacion' => $result['paginacion']];
    }

    /**
     * Sincroniza todo el catálogo (todas las páginas).
     */
    public function syncFullCatalog(): array
    {
        $totalSynced = 0;
        $page = 1;
        $totalPages = 1;

        do {
            $result = $this->syncPage($page);
            if (! empty($result['error'])) {
                return ['error' => $result['error'], 'synced' => $totalSynced];
            }
            $totalSynced += $result['synced'] ?? 0;
            $totalPages = $result['paginacion']['total_paginas'] ?? 1;
            $page++;
        } while ($page <= $totalPages);

        return ['synced' => $totalSynced, 'pages' => $page - 1];
    }

    /**
     * Inserta o actualiza un artículo en productos_cva.
     */
    public function upsertArticulo(array $art): bool
    {
        $clave = $art['clave'] ?? null;
        if (! $clave) {
            return false;
        }

        $imagen = $art['imagen'] ?? null;
        $imagenes = $art['imagenes'] ?? null;
        if (is_array($imagenes) && ! empty($imagenes)) {
            // ya es array de URLs
        } elseif ($imagen) {
            $imagenes = [$imagen];
        } else {
            $imagenes = [];
        }

        $precio = (float) ($art['precio'] ?? 0);
        if ($this->porcentaje > 0) {
            $precio = $precio * (1 + $this->porcentaje / 100);
        }

        ProductoCva::updateOrCreate(
            ['clave' => $clave],
            [
                'codigo_fabricante' => $art['codigo_fabricante'] ?? null,
                'descripcion' => $art['descripcion'] ?? null,
                'principal' => $art['principal'] ?? null,
                'grupo' => $art['grupo'] ?? null,
                'subgrupo' => $art['subgrupo'] ?? null,
                'marca' => $art['marca'] ?? null,
                'garantia' => $art['garantia'] ?? null,
                'clase' => $art['clase'] ?? null,
                'moneda' => $art['moneda'] ?? null,
                'precio' => $precio,
                'imagen' => $imagen,
                'imagenes' => $imagenes,
                'disponible' => (int) ($art['disponible'] ?? 0),
                'disponible_cd' => (int) ($art['disponibleCD'] ?? 0),
                'ficha_tecnica' => $art['ficha_tecnica'] ?? null,
                'ficha_comercial' => $art['ficha_comercial'] ?? null,
                'destacado' => false,
                'raw_data' => $art,
                'synced_at' => now(),
            ]
        );

        return true;
    }

    /**
     * Obtiene catálogo de grupos desde CVA (sin auth).
     */
    public function fetchGrupos(): array
    {
        $response = Http::acceptJson()->get($this->baseUrl.'/catalogo_clientes/grupos');
        if (! $response->successful()) {
            return [];
        }
        $data = $response->json();

        return $data['grupos'] ?? [];
    }

    /**
     * Obtiene catálogo de marcas desde CVA (sin auth).
     */
    public function fetchMarcas(): array
    {
        $response = Http::acceptJson()->get($this->baseUrl.'/catalogo_clientes/marcas');
        if (! $response->successful()) {
            return [];
        }
        $data = $response->json();

        return $data['marcas'] ?? [];
    }
}
