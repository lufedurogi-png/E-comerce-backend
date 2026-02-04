<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Productos que se mostraron como resultado en cada búsqueda y en qué posición.
 * Permite analizar qué se ofreció y priorizar según selecciones posteriores.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('busqueda_productos_mostrados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('busqueda_id')->constrained('busquedas')->cascadeOnDelete();
            $table->string('producto_clave', 100)->comment('Clave del producto en productos_cva');
            $table->unsignedSmallInteger('posicion')->default(0)->comment('Orden en que se mostró (1-based)');
            $table->timestamps();
        });

        Schema::table('busqueda_productos_mostrados', function (Blueprint $table) {
            $table->index(['busqueda_id', 'posicion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('busqueda_productos_mostrados');
    }
};
