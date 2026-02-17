<?php

namespace App\Services;

use App\Data\Response\AuthResponseData;
use App\Data\User\AccessUserData;
use App\Data\User\AdminRegisterData;
use App\Data\User\RegisterUserData;
use App\Data\User\UpdateUserData;
use App\Enum\User\UserRole;
use App\Enum\User\UserType;
use App\Models\UserLoginLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class TokenAuthService
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        private readonly UserService $userService,
        private readonly PermissionService $permissionService
    )
    {}

    public function register(RegisterUserData $data, UserType $type):AuthResponseData
    {
        $user =  $this->userService->create($data, $type);
        $this->permissionService->setRole($user, UserRole::CUSTOMER);
        
        $token = $this->createTokenForUser($user);

        return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($user),
            token: $token,
            auth_type: 'Bearer'
        );
    }

    public function generateToken(AccessUserData $data): AuthResponseData
    {
        $user = $this->userService->findByEmail($data->email);

        if (! $user) {
            return $this->failedAuthResponse();
        }
        if (! $this->validateCredentials($user, $data->password)) {
            return $this->failedAuthResponse();
        }

        $token = $this->createTokenForUser($user);
        $this->logLogin($user);

        return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($user),
            token: $token,
            auth_type: 'Bearer',
        );
    }

    public function adminRegister(AdminRegisterData $data): AuthResponseData
    {
        $user = $this->userService->create($data, UserType::ADMIN);
        $this->permissionService->setRole($user, UserRole::ADMIN);

        $token = $this->createTokenForUser($user);

        return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($user),
            token: $token,
            auth_type: 'Bearer'
        );
    }

    public function adminGenerateToken(AccessUserData $data): AuthResponseData
    {
        $user = $this->userService->findByEmail($data->email);

        if (! $user) {
            return $this->failedAuthResponse();
        }
        if (! $this->validateCredentials($user, $data->password)) {
            return $this->failedAuthResponse();
        }
        if (! $user->hasRole('admin')) {
            return new AuthResponseData(
                success: false,
                message: 'Solo los administradores pueden acceder.'
            );
        }

        $token = $this->createTokenForUser($user);
        $this->logLogin($user);

        return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($user),
            token: $token,
            auth_type: 'Bearer',
        );
    }

    public function revokeTokens():AuthResponseData
    {
        $user = Auth::user();
        
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $currentToken */
        $currentToken = $user->currentAccessToken();
        $currentToken?->delete();

        return new AuthResponseData(
            success: true,
            message: 'Tokens revoked successfully.'
        );
    }

    public function updateProfile(UpdateUserData $data):AuthResponseData
    {
        $user = Auth::user();
        $updatedUser = $this->userService->update($user, $data);

        if(!$data->password || empty($data->password)) {
            return new AuthResponseData(
                success: true,
                user: $this->userService->getUser($updatedUser),
                message: 'Profile updated successfully.'
            );
        }
        $user->tokens()->delete();
        $newToken = $this->createTokenForUser($updatedUser);

        return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($updatedUser),
            message: 'Profile updated successfully and token updated.',
            token: $newToken,
            auth_type: 'Bearer',
        );
    }

    private function createTokenForUser($user): string
    {
        $tokenName = $this->getTokenName($user->tipo);
        $abilities = $user->tipo->getAbilities();
        
        return $user->createToken($tokenName, $abilities)->plainTextToken;
    }

    private function getTokenName(UserType $type): string
    {
        return match ($type) {
            UserType::CUSTOMER => 'client-token',
            UserType::ADMIN => 'admin-token',
            UserType::SELLER => 'seller-token',
        };
    }

    private function validateCredentials($user, string $password): bool
    {
        return $user && Hash::check($password, $user->password);
    }

    private function failedAuthResponse(): AuthResponseData
    {
        return new AuthResponseData(
            success: false,
            message: 'The provided credentials are incorrect.'
        );
    }

    private function logLogin($user): void
    {
        UserLoginLog::create([
            'user_id' => $user->id,
            'logged_at' => now(),
            'tipo' => $user->tipo->value,
        ]);
    }
}
