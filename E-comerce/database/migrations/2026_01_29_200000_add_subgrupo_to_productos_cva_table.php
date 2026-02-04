<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos_cva', function (Blueprint $table) {
            $table->string('subgrupo', 150)->nullable()->after('grupo');
            $table->index('subgrupo');
        });
    }

    public function down(): void
    {
        Schema::table('productos_cva', function (Blueprint $table) {
            $table->dropIndex(['subgrupo']);
            $table->dropColumn('subgrupo');
        });
    }
};
