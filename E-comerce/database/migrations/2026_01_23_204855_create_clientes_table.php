<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            //identificacion del cliente
            $table->string('nombre');
            $table->string('apellidos');
            $table->string('telefono')->nullable()->unique();
            //direccion del cliente
            $table->string('calle');
            $table->string('colonia');
            $table->string('ciudad');
            $table->string('estado');
            $table->string('codigo_postal');
            $table->string('numero_exterior')->nullable();
            $table->string('numero_interior')->nullable();
            //otros
            $table->string('referencias')->nullable();
            $table->string('razon_social')->nullable();
            $table->string('rfc')->nullable()->unique();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('no action')->onUpdate('cascade');
            $table->timestamps();
            $table->softDeletes();

            $table->index('nombre');
            $table->index('rfc');
            $table->index('telefono');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
