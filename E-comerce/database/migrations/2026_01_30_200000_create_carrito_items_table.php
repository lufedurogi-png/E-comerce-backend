<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carrito_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('clave', 100);
            $table->string('nombre_producto', 500);
            $table->unsignedInteger('cantidad')->default(1);
            $table->decimal('precio_unitario', 12, 2);
            $table->timestamps();

            $table->unique(['user_id', 'clave']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carrito_items');
    }
};
