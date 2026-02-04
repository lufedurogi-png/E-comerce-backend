<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registro de qué producto seleccionó (clic) el usuario a partir de una búsqueda.
 * El clic se considera señal implícita de relevancia para aprendizaje.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('busqueda_selecciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('busqueda_id')->constrained('busquedas')->cascadeOnDelete();
            $table->string('producto_clave', 100)->comment('Clave del producto en productos_cva que el usuario eligió');
            $table->timestamps();
        });

        Schema::table('busqueda_selecciones', function (Blueprint $table) {
            $table->index('busqueda_id');
            $table->index(['producto_clave', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('busqueda_selecciones');
    }
};
