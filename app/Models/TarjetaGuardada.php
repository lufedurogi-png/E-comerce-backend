<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TarjetaGuardada extends Model
{
    protected $table = 'tarjetas_guardadas';

    protected $fillable = [
        'user_id',
        'numero',
        'nombre_titular',
        'last4',
        'fecha_caducidad',
        'es_favorita',
    ];

    protected $casts = [
        'numero' => 'encrypted',
        'es_favorita' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
