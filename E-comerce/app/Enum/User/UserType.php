<?php

namespace App\Enum\User;

enum UserType : int
{
    case ADMIN = 1;
    case CUSTOMER = 2; //cliente
    case SELLER = 3;   //vededor

    public function label(): string
    {
        return match($this) {
            UserType::ADMIN => 'Administrador',
            UserType::CUSTOMER => 'Cliente',
            UserType::SELLER => 'Vendedor',
        };
    }
    public static function toArray(): array
    {
        return array_map(fn($case) => [
            'id' => $case->value,
            'label' => $case->label(),
        ], self::cases());
    }

    public function getAbilities(): array
    {
        return match($this) {
            UserType::ADMIN => ['*'],
            UserType::CUSTOMER => [
                'cart:manage',    // Agregar/quitar productos
                'order:create',   // Comprar
                'order:view',     // Ver historial
                'profile:update', // Cambiar su dirección
            ],
            UserType::SELLER => ['list_products', 'view_sales'],
        };
    }
}
