<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Productos que se mostraron como resultado en cada búsqueda y en qué posición.
 */
class BusquedaProductoMostrado extends Model
{
    protected $table = 'busqueda_productos_mostrados';

    protected $fillable = [
        'busqueda_id',
        'producto_clave',
        'posicion',
    ];

    protected $casts = [
        'posicion' => 'integer',
    ];

    public function busqueda(): BelongsTo
    {
        return $this->belongsTo(Busqueda::class);
    }
}
