<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Relevancia producto–término para priorizar resultados.
 * Cuántas veces un producto fue seleccionado para un término (normalizado).
 */
class RelevanciaProductoTermino extends Model
{
    protected $table = 'relevancia_producto_termino';

    protected $fillable = [
        'termino_normalizado',
        'producto_clave',
        'veces_seleccionado',
        'ultima_seleccion_at',
    ];

    protected $casts = [
        'veces_seleccionado' => 'integer',
        'ultima_seleccion_at' => 'datetime',
    ];
}
