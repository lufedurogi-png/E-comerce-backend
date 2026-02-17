<?php

namespace App\Services;

use App\Models\ProductoCva;
use Illuminate\Support\Facades\DB;

class DescuentoPrecioService
{
    /**
     * Sincroniza la tabla precios_referencia con el precio actual de cada producto en productos_cva.
     * Se ejecuta cada 3 días.
     */
    public function syncPreciosReferencia(): array
    {
        $now = now();
        $updated = 0;

        ProductoCva::query()
            ->select('id', 'clave', 'precio')
            ->chunkById(500, function ($productos) use ($now, &$updated) {
                foreach ($productos as $p) {
                    DB::table('precios_referencia')->updateOrInsert(
                        ['clave' => $p->clave],
                        [
                            'precio' => $p->precio,
                            'actualizado_en' => $now,
                            'updated_at' => $now,
                            'created_at' => $now,
                        ]
                    );
                    $updated++;
                }
            });

        return ['updated' => $updated];
    }

    /**
     * Compara precio actual (productos_cva) con precio de referencia (precios_referencia).
     * Si precio actual < referencia → hay descuento: inserta/actualiza en producto_descuento.
     * Si no hay descuento → elimina de producto_descuento si existía.
     * Se ejecuta cada 12 horas.
     */
    public function compararPrecios(): array
    {
        $now = now();
        $conDescuento = 0;
        $sinDescuento = 0;

        $referencias = DB::table('precios_referencia')->pluck('precio', 'clave');

        foreach ($referencias as $clave => $precioReferencia) {
            $producto = ProductoCva::where('clave', $clave)->first();
            if (! $producto) {
                continue;
            }

            $precioActual = (float) $producto->precio;
            $precioRef = (float) $precioReferencia;

            if ($precioActual < $precioRef && $precioRef > 0) {
                $porcentaje = round((($precioRef - $precioActual) / $precioRef) * 100, 2);
                DB::table('producto_descuento')->updateOrInsert(
                    ['clave' => $clave],
                    [
                        'precio_anterior' => $precioRef,
                        'precio_actual' => $precioActual,
                        'porcentaje_descuento' => $porcentaje,
                        'comparado_en' => $now,
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
                $conDescuento++;
            } else {
                $deleted = DB::table('producto_descuento')->where('clave', $clave)->delete();
                if ($deleted) {
                    $sinDescuento++;
                }
            }
        }

        // Limpiar producto_descuento para claves que ya no están en precios_referencia
        foreach (DB::table('producto_descuento')->pluck('clave') as $clave) {
            if (! $referencias->has($clave)) {
                DB::table('producto_descuento')->where('clave', $clave)->delete();
                $sinDescuento++;
            }
        }

        return ['con_descuento' => $conDescuento, 'sin_descuento' => $sinDescuento];
    }

    /**
     * Obtiene el descuento (si existe) para una clave.
     *
     * @return array{precio_anterior: float, precio_actual: float, porcentaje_descuento: float}|null
     */
    public function getDescuentoPorClave(string $clave): ?array
    {
        $row = DB::table('producto_descuento')->where('clave', $clave)->first();
        if (! $row) {
            return null;
        }

        return [
            'precio_anterior' => (float) $row->precio_anterior,
            'precio_actual' => (float) $row->precio_actual,
            'porcentaje_descuento' => (float) ($row->porcentaje_descuento ?? 0),
        ];
    }

    /**
     * Obtiene descuentos para varias claves de una vez (para listados).
     *
     * @param  array<string>  $claves
     * @return array<string, array{precio_anterior: float, precio_actual: float, porcentaje_descuento: float}>
     */
    public function getDescuentosPorClaves(array $claves): array
    {
        if (empty($claves)) {
            return [];
        }

        $rows = DB::table('producto_descuento')->whereIn('clave', $claves)->get();
        $out = [];
        foreach ($rows as $row) {
            $out[$row->clave] = [
                'precio_anterior' => (float) $row->precio_anterior,
                'precio_actual' => (float) $row->precio_actual,
                'porcentaje_descuento' => (float) ($row->porcentaje_descuento ?? 0),
            ];
        }

        return $out;
    }
}
