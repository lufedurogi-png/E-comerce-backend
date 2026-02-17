<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoManual extends Model
{
    protected $table = 'productos_manuales';

    protected $fillable = [
        'clave',
        'codigo_fabricante',
        'descripcion',
        'principal',
        'grupo',
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
        'especificaciones_tecnicas',
        'dimensiones',
        'informacion_general',
        'anulado',
    ];

    protected $casts = [
        'precio' => 'decimal:2',
        'imagenes' => 'array',
        'especificaciones_tecnicas' => 'array',
        'dimensiones' => 'array',
        'informacion_general' => 'array',
        'destacado' => 'boolean',
        'anulado' => 'boolean',
    ];

    public static function generarClave(): string
    {
        return 'MANUAL-'.strtoupper(uniqid()).'-'.mt_rand(100, 999);
    }
}
