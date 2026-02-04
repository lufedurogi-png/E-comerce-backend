<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relevancia producto–término para priorizar resultados.
 * Cuántas veces un producto fue seleccionado para un término (normalizado).
 * Sirve para ordenar resultados por comportamiento histórico agregado.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relevancia_producto_termino', function (Blueprint $table) {
            $table->id();
            $table->string('termino_normalizado', 200)->comment('Término de búsqueda normalizado');
            $table->string('producto_clave', 100)->comment('Clave del producto en productos_cva');
            $table->unsignedInteger('veces_seleccionado')->default(0)->comment('Clics desde búsquedas con este término');
            $table->timestamp('ultima_seleccion_at')->nullable();
            $table->timestamps();
        });

        Schema::table('relevancia_producto_termino', function (Blueprint $table) {
            $table->unique(['termino_normalizado', 'producto_clave']);
            $table->index(['termino_normalizado', 'veces_seleccionado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relevancia_producto_termino');
    }
};
