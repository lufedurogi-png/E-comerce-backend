<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CotizacionItem extends Model
{
    protected $table = 'cotizacion_items';

    protected $fillable = [
        'cotizacion_id',
        'clave',
        'nombre_producto',
        'cantidad',
        'precio_unitario',
        'imagen',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function cotizacion(): BelongsTo
    {
        return $this->belongsTo(Cotizacion::class);
    }
}
