<?php

namespace App\Data\User;

use App\Enum\User\UserType;
use Spatie\LaravelData\Attributes\Validation\Confirmed;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Password;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Data;

class UserCustomData extends Data
{
    /**
     * Clase para registro de usuario con tipo personalizado
     */
    public function __construct(
        #[Max(230)]
        public string $name,
        #[Email(),Max(255),Unique('users','email')]
        public string $email,
        #[Password(min: 8, letters: true, mixedCase: true, numbers: true, symbols: true, uncompromised: true, uncompromisedThreshold: 0), Confirmed]
        public string $password,
        #[Enum(UserType::class)]
        public UserType $type
        
    )
    {
        //
    }

}
