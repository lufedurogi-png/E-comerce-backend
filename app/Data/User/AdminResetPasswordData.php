<?php

namespace App\Data\User;

use Spatie\LaravelData\Attributes\Validation\Confirmed;
use Spatie\LaravelData\Attributes\Validation\Password;
use Spatie\LaravelData\Data;

class AdminResetPasswordData extends Data
{
    public function __construct(
        #[Password(min: 8, letters: true, mixedCase: true, numbers: true, symbols: true, uncompromised: true, uncompromisedThreshold: 0), Confirmed]
        public string $password,
        public string $adminPassword,
    ) {}

    public static function messages(): array
    {
        return [
            'adminPassword.required' => 'La contraseña del administrador es requerida',
        ];
    }
}
