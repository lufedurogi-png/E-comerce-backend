<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Correcciones ortográficas aprendidas: término mal escrito → término correcto.
 * Se actualizan cuando varias búsquedas con el mismo error llevan a selecciones exitosas.
 * Solo se aplican tras superar un umbral de confirmaciones.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('correcciones_aprendidas', function (Blueprint $table) {
            $table->id();
            $table->string('termino_original', 200)->comment('Texto tal como lo escriben los usuarios (con error)');
            $table->string('termino_corregido', 200)->comment('Término correcto al que se mapea');
            $table->unsignedInteger('confirmaciones')->default(0)->comment('Veces que esta corrección llevó a clics exitosos');
            $table->timestamp('ultima_confirmacion_at')->nullable();
            $table->timestamps();
        });

        Schema::table('correcciones_aprendidas', function (Blueprint $table) {
            $table->unique('termino_original');
            $table->index('confirmaciones');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('correcciones_aprendidas');
    }
};
