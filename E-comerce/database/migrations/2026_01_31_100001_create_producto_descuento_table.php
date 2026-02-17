<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_descuento', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 100)->unique();
            $table->decimal('precio_anterior', 14, 2);
            $table->decimal('precio_actual', 14, 2);
            $table->decimal('porcentaje_descuento', 5, 2)->nullable();
            $table->timestamp('comparado_en');
            $table->timestamps();

            $table->index('comparado_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_descuento');
    }
};
