<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('publicidad')) {
            return;
        }
        Schema::create('publicidad', function (Blueprint $table) {
            $table->id();
            $table->string('url');
            $table->string('path')->nullable();
            $table->unsignedSmallInteger('orden')->default(0);
            $table->string('titulo')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publicidad');
    }
};
