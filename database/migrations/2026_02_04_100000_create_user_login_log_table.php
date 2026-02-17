<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registro de cada inicio de sesión (cliente, admin o vendedor) para estadísticas de actividad.
     */
    public function up(): void
    {
        Schema::create('user_login_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->dateTime('logged_at');
            $table->unsignedTinyInteger('tipo')->comment('1=admin, 2=cliente, 3=vendedor');
            $table->timestamps();

            $table->index('logged_at');
            $table->index(['logged_at', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_login_log');
    }
};
