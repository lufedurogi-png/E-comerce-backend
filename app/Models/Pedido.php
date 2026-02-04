<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pedido extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'folio',
        'user_id',
        'fecha',
        'monto',
        'metodo_pago',
        'estado_pago',
        'estatus_pedido',
        'direccion_envio_id',
        'datos_facturacion_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'monto' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function direccionEnvio(): BelongsTo
    {
        return $this->belongsTo(DireccionEnvio::class, 'direccion_envio_id');
    }

    public function datosFacturacion(): BelongsTo
    {
        return $this->belongsTo(DatoFacturacion::class, 'datos_facturacion_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PedidoItem::class, 'pedido_id');
    }
}
