<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('direcciones_envio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nombre');
            $table->string('calle');
            $table->string('numero_exterior')->nullable();
            $table->string('numero_interior')->nullable();
            $table->string('colonia');
            $table->string('ciudad');
            $table->string('estado');
            $table->string('codigo_postal', 10);
            $table->text('referencias')->nullable();
            $table->string('telefono', 20);
            $table->boolean('es_principal')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'es_principal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('direcciones_envio');
    }
};
