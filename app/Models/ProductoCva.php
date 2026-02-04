<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoCva extends Model
{
    protected $table = 'productos_cva';

    protected $fillable = [
        'clave',
        'codigo_fabricante',
        'descripcion',
        'principal',
        'grupo',
        'subgrupo',
        'marca',
        'garantia',
        'clase',
        'moneda',
        'precio',
        'imagen',
        'imagenes',
        'disponible',
        'disponible_cd',
        'ficha_tecnica',
        'ficha_comercial',
        'destacado',
        'raw_data',
        'synced_at',
    ];

    protected $casts = [
        'precio' => 'decimal:2',
        'imagenes' => 'array',
        'raw_data' => 'array',
        'destacado' => 'boolean',
        'synced_at' => 'datetime',
    ];
}
