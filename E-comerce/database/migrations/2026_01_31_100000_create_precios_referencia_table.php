<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('precios_referencia', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 100)->unique();
            $table->decimal('precio', 14, 2);
            $table->timestamp('actualizado_en');
            $table->timestamps();

            $table->index('actualizado_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('precios_referencia');
    }
};
