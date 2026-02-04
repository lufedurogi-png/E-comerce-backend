<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registro de cada búsqueda: texto original, normalizado, sesión y usuario (opcional).
 * Sirve para aprendizaje y análisis de comportamiento.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('busquedas', function (Blueprint $table) {
            $table->id();
            $table->string('texto_original', 500)->comment('Texto tal cual lo escribió el usuario');
            $table->string('texto_normalizado', 500)->nullable()->comment('Versión corregida/normalizada si se aplicó');
            $table->string('session_id', 100)->nullable()->comment('Identificador de sesión (anonimizado si aplica)');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete()->comment('Usuario si está logueado');
            $table->timestamps();
        });

        Schema::table('busquedas', function (Blueprint $table) {
            $table->index('created_at');
            $table->index(['texto_normalizado', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('busquedas');
    }
};
