<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos_cva', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 100)->unique();
            $table->string('codigo_fabricante', 200)->nullable();
            $table->string('descripcion')->nullable();
            $table->string('principal', 100)->nullable();
            $table->string('grupo', 150)->nullable();
            $table->string('marca', 150)->nullable();
            $table->string('garantia', 50)->nullable();
            $table->string('clase', 20)->nullable();
            $table->string('moneda', 20)->nullable();
            $table->decimal('precio', 14, 2)->default(0);
            $table->string('imagen', 500)->nullable();
            $table->json('imagenes')->nullable();
            $table->integer('disponible')->default(0);
            $table->integer('disponible_cd')->default(0);
            $table->text('ficha_tecnica')->nullable();
            $table->text('ficha_comercial')->nullable();
            $table->boolean('destacado')->default(false);
            $table->json('raw_data')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->index('grupo');
            $table->index('marca');
            $table->index('destacado');
            $table->index('synced_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos_cva');
    }
};
