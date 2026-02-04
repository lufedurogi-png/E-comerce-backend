<?php

namespace App\Data\User;

use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Confirmed;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Password;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\References\RouteParameterReference;

class RegisterUserData extends Data
{
    /**
     * clase para registro de usuario cliente
     */
    public function __construct(
        #[Max(230)]
        public string $name,
        #[Email,Max(255),Unique('users','email')]
        public string $email,
        #[Password(min: 8, letters: true, mixedCase: true, numbers: true, symbols: true, uncompromised: true, uncompromisedThreshold: 0), Confirmed]
        public string $password,
        #[BooleanType]
        public bool $remember = false
    )
    {}

    public static function messages(): array
    {
        return [
            'name.max' => 'El campo nombre no debe ser mayor a :max caracteres.',
            'email.email' => 'El campo correo electrónico debe ser una dirección de correo electrónico válida.',
            'email.max' => 'El campo correo electrónico no debe ser mayor a :max caracteres.',
            'email.unique' => 'El correo electrónico ya está en uso por otro usuario.',
            'password.password' => 'La contraseña no cumple con los requisitos de seguridad.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
        ];
    }
}
