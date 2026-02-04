<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DatoFacturacion extends Model
{
    use SoftDeletes;

    protected $table = 'datos_facturacion';

    protected $fillable = [
        'user_id',
        'razon_social',
        'rfc',
        'calle',
        'numero_exterior',
        'numero_interior',
        'colonia',
        'ciudad',
        'estado',
        'codigo_postal',
        'email_facturacion',
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
