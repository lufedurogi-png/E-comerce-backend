<?php

namespace App\Services;

use App\Data\Response\AuthResponseData;
use App\Data\User\AccessUserData;
use App\Data\User\RegisterUserData;
use App\Data\User\UserCustomData;
use App\Data\User\UserData;
use App\Enum\User\UserType;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    
    public function __construct(
        private readonly UserService $userService
    )
    {}

   

    public function profile(){
        $user = Auth::user();
        $result = UserData::fromModel($user);

        return new AuthResponseData(
            success: true,
            user: $result
        );
    }

    
}
