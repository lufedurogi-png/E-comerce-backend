<?php

namespace App\Data\User;

use Spatie\LaravelData\Attributes\Validation\Confirmed;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Password;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;

class AdminRegisterData extends Data
{
    public function __construct(
        #[Max(230)]
        public string $name,
        #[Email(), Max(255), Unique('users', 'email')]
        public string $email,
        #[Password(min: 8, letters: true, mixedCase: true, numbers: true, symbols: true, uncompromised: true, uncompromisedThreshold: 0), Confirmed]
        public string $password,
    ) {}
}
