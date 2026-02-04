<?php

namespace App\Enum\User;

enum UserRole: string
{
    case ADMIN = 'admin';
    case SELLER = 'seller';
    case CUSTOMER = 'customer';

    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'Administrator',
            self::SELLER => 'Vendedor',
            self::CUSTOMER => 'Cliente',
        };
    }
    
}
