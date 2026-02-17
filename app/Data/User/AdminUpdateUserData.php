<?php

namespace App\Data\User;

use Spatie\LaravelData\Attributes\Validation\Confirmed;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Password;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\References\RouteParameterReference;

class AdminUpdateUserData extends Data
{
    public function __construct(
        #[Sometimes, Max(230)]
        public ?string $name = null,
        #[Sometimes, Email(), Max(255), Unique('users', 'email', ignore: new RouteParameterReference('usuarioId'))]
        public ?string $email = null,
        #[Sometimes, Password(min: 8, letters: true, mixedCase: true, numbers: true, symbols: true, uncompromised: true, uncompromisedThreshold: 0), Confirmed]
        public ?string $password = null,
        public string $adminPassword,
    ) {}

    public static function messages(): array
    {
        return [
            'adminPassword.required' => 'La contraseña del administrador es requerida',
        ];
    }
}
