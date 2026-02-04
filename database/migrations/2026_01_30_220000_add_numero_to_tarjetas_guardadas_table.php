<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarjetas_guardadas', function (Blueprint $table) {
            $table->text('numero')->nullable()->after('user_id'); // cifrado con cast Encrypted en el modelo
        });
    }

    public function down(): void
    {
        Schema::table('tarjetas_guardadas', function (Blueprint $table) {
            $table->dropColumn('numero');
        });
    }
};
