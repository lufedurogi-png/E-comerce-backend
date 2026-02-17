<?php

namespace Database\Seeders;

use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class PedidosSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'cliente@example.com')->first();
        if (!$user) {
            return;
        }

        $pedidos = [
            [
                'folio' => '000005',
                'fecha' => '2025-01-15',
                'monto' => 1250.00,
                'metodo_pago' => 'Tarjeta',
                'estado_pago' => 'pagado',
                'estatus_pedido' => 'completado',
                'items' => [
                    ['nombre_producto' => 'Teclado Mecánico NXT Pro', 'cantidad' => 1, 'precio_unitario' => 850.00, 'subtotal' => 850.00],
                    ['nombre_producto' => 'Mouse Inalámbrico', 'cantidad' => 1, 'precio_unitario' => 400.00, 'subtotal' => 400.00],
                ],
            ],
            [
                'folio' => '000006',
                'fecha' => '2025-01-20',
                'monto' => 3200.50,
                'metodo_pago' => 'Transferencia',
                'estado_pago' => 'pendiente',
                'estatus_pedido' => 'en_proceso',
                'items' => [
                    ['nombre_producto' => 'Monitor 24" Full HD', 'cantidad' => 1, 'precio_unitario' => 3200.50, 'subtotal' => 3200.50],
                ],
            ],
            [
                'folio' => '000007',
                'fecha' => '2025-11-07',
                'monto' => 688.02,
                'metodo_pago' => 'MercadoPago',
                'estado_pago' => 'pendiente',
                'estatus_pedido' => 'en_proceso',
                'items' => [
                    ['nombre_producto' => 'Cable HDMI 2.0 2m', 'cantidad' => 2, 'precio_unitario' => 344.01, 'subtotal' => 688.02],
                ],
            ],
        ];

        foreach ($pedidos as $p) {
            $items = $p['items'];
            unset($p['items']);
            $pedido = Pedido::firstOrCreate(
                ['folio' => $p['folio'], 'user_id' => $user->id],
                $p
            );
            if ($pedido->items()->count() === 0) {
                foreach ($items as $item) {
                    $pedido->items()->create($item);
                }
            }
        }
    }
}
