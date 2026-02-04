<?php

namespace App\Data\User;

use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Data;

class AccessUserData extends Data
{
    /**
     * CLASE PARA ACCESO DE USUARIO - LOGIN 
     */
    public function __construct(
        #[Max(255),Email()]
        public string $email,   
        #[Max(255), Min(8)]
        public string $password,
        #[BooleanType]
        public bool $remember = false,
    )
    {}

    public static function messages(): array
    {
        return [
            'email.email' => 'El campo correo electrónico debe ser una dirección de correo electrónico válida.',
            'email.max' => 'El campo correo electrónico no debe ser mayor a :max caracteres.',
            'password.max' => 'El campo contraseña no debe ser mayor a :max caracteres.',
            'password.min' => 'El campo contraseña debe tener al menos :min caracteres.',
        ];
    }
}
