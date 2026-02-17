<?php

namespace App\Data\User;

use Spatie\LaravelData\Data;

class RemoveRoleUserData extends Data
{
    public function __construct(
        public string $role,
        public string $adminPassword,
    ) {}

    public static function messages(): array
    {
        return [
            'adminPassword.required' => 'La contraseña del administrador es requerida',
            'role.required' => 'El nombre del rol a quitar es requerido',
        ];
    }
}
