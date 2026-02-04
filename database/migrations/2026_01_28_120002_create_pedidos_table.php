<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->string('folio', 20)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('fecha');
            $table->decimal('monto', 12, 2);
            $table->string('metodo_pago', 50);
            $table->string('estado_pago', 20)->default('pendiente'); // pagado, pendiente, reembolsado
            $table->string('estatus_pedido', 30)->default('en_proceso'); // pendiente, en_proceso, enviado, completado, cancelado
            $table->foreignId('direccion_envio_id')->nullable()->constrained('direcciones_envio')->onDelete('no action');
            $table->foreignId('datos_facturacion_id')->nullable()->constrained('datos_facturacion')->onDelete('no action');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'fecha']);
            $table->index(['user_id', 'estado_pago', 'estatus_pedido']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
