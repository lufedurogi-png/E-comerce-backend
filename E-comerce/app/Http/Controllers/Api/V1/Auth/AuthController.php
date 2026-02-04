<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Data\User\AccessUserData;
use App\Data\User\RegisterUserData;
use App\Data\User\UpdateUserData;
use App\Enum\User\UserType;
use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Services\TokenAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private readonly TokenAuthService $authService,
        private readonly AuthService $authServiceGeneral
    )
    {}

    public function register(RegisterUserData $request){

        $authResponse = $this->authService->register($request, UserType::CUSTOMER);

        return response()->json($authResponse, 201);
    }

    public function profile(Request $request){
        $user = $this->authServiceGeneral->profile();
        return response()->json($user, 200);
    }

    public function generateToken(AccessUserData $request){

        $authResponse = $this->authService->generateToken($request);

        return response()->json($authResponse, $authResponse->success ? 200 : 401);

    }

    public function revokeTokens(Request $request){
        $result = $this->authService->revokeTokens();
        return response()->json($result, 200);

    }

    public function updateProfile(UpdateUserData $request){
        $authResponse = $this->authService->updateProfile($request);
        return response()->json($authResponse, 200);
    }

    public function changePassword(Request $request)
    {
        $valid = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ], [
            'current_password.required' => 'La contraseña actual es obligatoria.',
            'password.required' => 'La nueva contraseña es obligatoria.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
        ]);

        $user = Auth::user();
        if (!Hash::check($valid['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual no es correcta.',
                'errors' => ['current_password' => ['La contraseña actual no es correcta.']],
            ], 422);
        }

        $user->update(['password' => $valid['password']]);

        return response()->json(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
    }
}
