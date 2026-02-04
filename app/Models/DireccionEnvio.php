<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DireccionEnvio extends Model
{
    use SoftDeletes;

    protected $table = 'direcciones_envio';

    protected $fillable = [
        'user_id',
        'nombre',
        'calle',
        'numero_exterior',
        'numero_interior',
        'colonia',
        'ciudad',
        'estado',
        'codigo_postal',
        'referencias',
        'telefono',
        'es_principal',
    ];

    protected $casts = [
        'es_principal' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
