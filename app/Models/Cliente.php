<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $fillable = [
        'nombre',
        'apellidos',
        'telefono',
        'calle',
        'colonia',
        'ciudad',
        'estado',
        'codigo_postal',
        'numero_exterior',
        'numero_interior',
        'referencias',
        'razon_social',
        'rfc',
        'user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
