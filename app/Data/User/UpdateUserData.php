<?php

namespace App\Data\User;

use Spatie\LaravelData\Attributes\Validation\Confirmed;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Password;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\References\AuthenticatedUserReference;

class UpdateUserData extends Data{
    
    public function __construct(
        #[Sometimes,Max(255)]
        public ?string $name,
        #[Sometimes,Max(255),Email,Unique('users','email',ignore: new AuthenticatedUserReference())]
        public ?string $email,
        #[Sometimes,Password(min: 8, letters: true, mixedCase: true, numbers: true, symbols: true, uncompromised: true, uncompromisedThreshold: 0), Confirmed]
        public ?string $password,
    )
    {
        //
    }

    public static function messages():array
    {
        return [
            'email.unique' => 'El correo electrónico ya está en uso por otro usuario.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password.password' => 'La contraseña no cumple con los requisitos de seguridad.',
            'email.email' => 'El correo electrónico no es válido.',
            'name.max' => 'El nombre no debe exceder los 255 caracteres.',
            'email.max' => 'El correo electrónico no debe exceder los 255 caracteres.',
        ];
    }
}
