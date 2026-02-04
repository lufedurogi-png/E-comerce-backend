<?php

namespace App\Services;

use Illuminate\Support\Str;

class CategoriaPrincipalService
{
    /**
     * Resuelve un grupo CVA a la id de categoría principal del proyecto.
     */
    public function grupoToCategoria(string $grupo): string
    {
        $grupo = trim($grupo);
        if ($grupo === '') {
            return 'otros';
        }

        $exacto = config('categorias.grupo_exacto', []);
        $key = $this->normalizeKey($grupo, array_keys($exacto));
        if ($key !== null) {
            return $exacto[$key];
        }

        $contiene = config('categorias.grupo_contiene', []);
        $grupoLower = Str::lower($grupo);
        foreach ($contiene as $regla) {
            $palabras = (array) ($regla['contiene'] ?? []);
            foreach ($palabras as $palabra) {
                if (Str::contains($grupoLower, Str::lower($palabra))) {
                    return $regla['categoria'];
                }
            }
        }

        return 'otros';
    }

    /**
     * Devuelve categorías principales con sus subcategorías (grupos CVA que existen en BD).
     *
     * @param  array<string>  $gruposDesdeDb
     * @return array<int, array{id: string, nombre: string, orden: int, subcategorias: array<string>}>
     */
    public function categoriasConSubcategorias(array $gruposDesdeDb): array
    {
        $principales = collect(config('categorias.principales', []))
            ->keyBy('id')
            ->map(fn ($c) => [
                'id' => $c['id'],
                'nombre' => $c['nombre'],
                'orden' => (int) ($c['orden'] ?? 999),
                'subcategorias' => [],
            ])
            ->all();

        foreach ($gruposDesdeDb as $grupo) {
            $grupo = trim($grupo);
            if ($grupo === '') {
                continue;
            }
            $catId = $this->grupoToCategoria($grupo);
            if (! isset($principales[$catId])) {
                $principales['otros'] = $principales['otros'] ?? [
                    'id' => 'otros',
                    'nombre' => 'Otros',
                    'orden' => 999,
                    'subcategorias' => [],
                ];
                $catId = 'otros';
            }
            $principales[$catId]['subcategorias'][] = $grupo;
        }

        $extra = config('categorias.subcategorias_extra', []);
        foreach ($principales as $id => $c) {
            if (! empty($extra[$id])) {
                $principales[$id]['subcategorias'] = array_values(array_unique(array_merge(
                    $principales[$id]['subcategorias'],
                    $extra[$id]
                )));
            }
            sort($principales[$id]['subcategorias']);
        }

        return collect($principales)
            ->sortBy('orden')
            ->values()
            ->all();
    }

    /**
     * IDs de categorías principales que existen en config.
     */
    public function idsCategoriasPrincipales(): array
    {
        return collect(config('categorias.principales', []))
            ->pluck('id')
            ->all();
    }

    /**
     * Dado un id de categoría principal, devuelve la lista de grupos CVA que le pertenecen (según BD).
     *
     * @param  array<string>  $gruposDesdeDb
     * @return array<string>
     */
    public function gruposPorCategoria(string $categoriaId, array $gruposDesdeDb): array
    {
        $out = [];
        foreach ($gruposDesdeDb as $grupo) {
            if ($this->grupoToCategoria(trim($grupo)) === $categoriaId) {
                $out[] = $grupo;
            }
        }
        sort($out);

        return $out;
    }

    private function normalizeKey(string $grupo, array $keys): ?string
    {
        $grupoLower = Str::lower($grupo);
        foreach ($keys as $k) {
            if (Str::lower($k) === $grupoLower) {
                return $k;
            }
        }

        return null;
    }
}
