<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos_cva', function (Blueprint $table) {
            $table->json('dimensiones')->nullable()->after('especificaciones_tecnicas');
        });
    }

    public function down(): void
    {
        Schema::table('productos_cva', function (Blueprint $table) {
            $table->dropColumn('dimensiones');
        });
    }
};
