<?php

namespace App\Data\Response;

use App\Data\User\UserData;

class AuthResponseData extends ApiResponseData
{
    public function __construct(
        bool $success,
        ?string $message = null,
        ?UserData $user = null,
        public ?string $token = null,
        public ?string $auth_type = null,
    ) {
        parent::__construct($success, $message, $user);
    }
}
