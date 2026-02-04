<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Registro de qué producto seleccionó (clic) el usuario a partir de una búsqueda.
 * El clic se considera señal implícita de relevancia para aprendizaje.
 */
class BusquedaSeleccion extends Model
{
    protected $table = 'busqueda_selecciones';

    protected $fillable = [
        'busqueda_id',
        'producto_clave',
    ];

    public function busqueda(): BelongsTo
    {
        return $this->belongsTo(Busqueda::class);
    }
}
