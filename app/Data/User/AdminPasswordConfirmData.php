<?php

namespace App\Data\User;

use Spatie\LaravelData\Data;

class AdminPasswordConfirmData extends Data
{
    public function __construct(
        public string $adminPassword,
    ) {}

    public static function messages(): array
    {
        return [
            'adminPassword.required' => 'La contraseña del administrador es requerida',
        ];
    }
}
