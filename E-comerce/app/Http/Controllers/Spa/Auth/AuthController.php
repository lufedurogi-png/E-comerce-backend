<?php

namespace App\Http\Controllers\Spa\Auth;

use App\Data\User\AccessUserData;
use App\Data\User\RegisterUserData;
use App\Data\User\UpdateUserData;
use App\Data\User\UserCustomData;
use App\Enum\User\UserType;
use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Services\SessionAuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authServiceGeneral,
        private readonly SessionAuthService $authService
    )
    {}

    //metodo para registrar usuario cliente
    public function register(RegisterUserData $request){

        $authResponse = $this->authService->register($request, UserType::CUSTOMER);

        return response()->json($authResponse, 201);
    }

    public function login(AccessUserData $request){

        $authResponse = $this->authService->login($request);

        return response()->json($authResponse, $authResponse->success ? 200 : 401);

    }

    public function profile(Request $request){
        $user = $this->authServiceGeneral->profile();
        return response()->json($user, 200);
    }

    public function logout(Request $request){
        $result = $this->authService->logout();

        return response()->json($result, 200);
    }

    public function updateProfile(UpdateUserData $request){
        $authResponse = $this->authService->updateProfile($request);
        return response()->json($authResponse, 200);
    }

}