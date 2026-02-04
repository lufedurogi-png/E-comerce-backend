<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Registro de cada búsqueda: texto original, normalizado, sesión y usuario.
 * Sirve para aprendizaje y análisis de comportamiento.
 */
class Busqueda extends Model
{
    protected $table = 'busquedas';

    protected $fillable = [
        'texto_original',
        'texto_normalizado',
        'session_id',
        'user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function productosMostrados(): HasMany
    {
        return $this->hasMany(BusquedaProductoMostrado::class, 'busqueda_id');
    }

    public function selecciones(): HasMany
    {
        return $this->hasMany(BusquedaSeleccion::class, 'busqueda_id');
    }
}
