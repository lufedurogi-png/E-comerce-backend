<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Correcciones ortográficas aprendidas: término mal escrito → término correcto.
 * Se aplican solo cuando confirmaciones >= umbral configurado.
 */
class CorreccionAprendida extends Model
{
    protected $table = 'correcciones_aprendidas';

    protected $fillable = [
        'termino_original',
        'termino_corregido',
        'confirmaciones',
        'ultima_confirmacion_at',
    ];

    protected $casts = [
        'confirmaciones' => 'integer',
        'ultima_confirmacion_at' => 'datetime',
    ];
}
