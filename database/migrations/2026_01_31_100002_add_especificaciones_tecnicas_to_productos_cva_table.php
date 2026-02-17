<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos_cva', function (Blueprint $table) {
            $table->json('especificaciones_tecnicas')->nullable()->after('raw_data');
        });
    }

    public function down(): void
    {
        Schema::table('productos_cva', function (Blueprint $table) {
            $table->dropColumn('especificaciones_tecnicas');
        });
    }
};
