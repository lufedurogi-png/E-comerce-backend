<?php

namespace App\Data\User;

use App\Enum\User\UserType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Data;

class AssignRoleUserData extends Data
{
    public function __construct(
        #[Enum(UserType::class)]
        public UserType $tipoUsuario,
        public string $adminPassword,
    ) {}

    public static function messages(): array
    {
        return [
            'adminPassword.required' => 'La contraseña del administrador es requerida',
        ];
    }
}
