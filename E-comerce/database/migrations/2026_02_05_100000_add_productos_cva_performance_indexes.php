<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Índices compuestos para acelerar las consultas de listado por grupo/categoría.
     */
    public function up(): void
    {
        Schema::table('productos_cva', function (Blueprint $table) {
            $table->index(['grupo', 'synced_at'], 'productos_cva_grupo_synced_idx');
            $table->index(['marca', 'synced_at'], 'productos_cva_marca_synced_idx');
        });
    }

    public function down(): void
    {
        Schema::table('productos_cva', function (Blueprint $table) {
            $table->dropIndex('productos_cva_grupo_synced_idx');
            $table->dropIndex('productos_cva_marca_synced_idx');
        });
    }
};
