<?php

namespace App\Services;

use App\Data\Response\AuthResponseData;
use App\Data\User\AccessUserData;
use App\Data\User\RegisterUserData;
use App\Data\User\UpdateUserData;
use App\Enum\User\UserRole;
use App\Enum\User\UserType;
use Illuminate\Support\Facades\Auth;

class SessionAuthService
{
    public function __construct(
        private readonly UserService $userService,
        private readonly PermissionService $permissionService
    )
    {}

    public function register(RegisterUserData $data, UserType $type):AuthResponseData
    {   
        $user =  $this->userService->create($data, $type);
        $this->permissionService->setRole($user, UserRole::CUSTOMER);
        
        Auth::login($user, $data->remember);

        if (request()->hasSession()) {
            request()->session()->regenerate();
        }

        return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($user)
        );
    }

    public function login(AccessUserData $data): AuthResponseData
    {
        $credentials = [
            'email' => $data->email,
            'password' => $data->password,
        ];

        if (!Auth::attempt($credentials, $data->remember)) {
            return new AuthResponseData(
                success: false,
                message: 'The provided credentials are incorrect.'
            );
        }
        if (request()->hasSession()) {
            request()->session()->regenerate();
        }

        $user = Auth::user();

        return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($user)
        );
    }

    public function logout(): AuthResponseData
    {
        auth()->guard('web')->logout();
        
        request()->session()->invalidate();
        request()->session()->regenerateToken();
        
        return new AuthResponseData(
            success: true,
            message: 'Logged out successfully.'
        );
    }
    
    public function updateProfile(UpdateUserData $data):AuthResponseData
    {
        $user = Auth::user();
        $updatedUser = $this->userService->update($user, $data);

        if(!$data->password) {
           return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($updatedUser),
            message: 'Profile updated successfully.'
           );
            
        }   

        if (request()->hasSession()) {
            request()->session()->regenerate();
        }

        return new AuthResponseData(
            success: true,
            user: $this->userService->getUser($updatedUser),
            message: 'Profile updated successfully. Please log in again.'
        );
    }
}
