<?php

namespace App\Services\Users;

use App\Data\Response\ApiResponseData;
use App\Data\User\AdminCreateUserData;
use App\Data\User\AdminPasswordConfirmData;
use App\Data\User\AdminResetPasswordData;
use App\Data\User\AdminUpdateUserData;
use App\Data\User\AssignRoleUserData;
use App\Data\User\RemoveRoleUserData;
use App\Data\User\UserData;
use App\Enum\Permisos\PermissionEnum;
use App\Enum\User\UserRole;
use App\Enum\User\UserType;
use App\Services\UserService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ManagerUsersService
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function getTypesUser(): ApiResponseData
    {
        return new ApiResponseData(
            success: true,
            data: UserType::toArray()
        );
    }

    public function getPermissions(): ApiResponseData
    {
        $permissions = array_map(fn ($p) => [
            'value' => $p->value,
            'label' => $p->label(),
            'group' => $p->group(),
        ], PermissionEnum::cases());

        return new ApiResponseData(success: true, data: $permissions);
    }

    public function createUser(AdminCreateUserData $data): ApiResponseData
    {
        if ($error = $this->validateAdminAction($data->adminPassword)) {
            return $error;
        }

        try {
            return DB::transaction(function () use ($data) {
                $user = $this->userService->create($data);
                $user->assignRole($this->mapUserTypeToRole($data->type)->value);

                return new ApiResponseData(
                    success: true,
                    message: 'Usuario registrado correctamente',
                    data: UserData::fromModel($user, true, true)
                );
            });
        } catch (\Exception $e) {
            return $this->errorResponse('Error al crear el usuario: ' . $e->getMessage());
        }
    }

    public function updateUser(AdminUpdateUserData $data, int $userId): ApiResponseData
    {
        if ($error = $this->validateAdminAction($data->adminPassword)) {
            return $error;
        }

        $user = $this->userService->findById($userId);
        if (! $user) {
            return $this->errorResponse('Usuario no encontrado');
        }

        try {
            $result = $this->userService->update($user, $data);

            return new ApiResponseData(
                success: true,
                message: 'Usuario actualizado correctamente',
                data: UserData::fromModel($result, true, true)
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al actualizar: ' . $e->getMessage());
        }
    }

    public function assignRoleToUser(AssignRoleUserData $data, int $userId): ApiResponseData
    {
        if ($error = $this->validateAdminAction($data->adminPassword)) {
            return $error;
        }

        try {
            return DB::transaction(function () use ($data, $userId) {
                $user = $this->userService->findById($userId);
                if (! $user) {
                    return $this->errorResponse('Usuario no encontrado');
                }

                $role = $this->mapUserTypeToRole($data->tipoUsuario);
                if ($user->hasRole($role->value)) {
                    return $this->errorResponse("El usuario ya tiene el rol: {$role->label()}");
                }

                $user->assignRole($role->value);
                $user->update(['tipo' => $data->tipoUsuario->value]);

                app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

                return new ApiResponseData(
                    success: true,
                    message: 'Rol asignado correctamente',
                    data: UserData::fromModel($user->fresh(), true, true)
                );
            });
        } catch (\Exception $e) {
            return $this->errorResponse('Error al asignar rol: ' . $e->getMessage());
        }
    }

    public function removeRoleFromUser(RemoveRoleUserData $data, int $userId): ApiResponseData
    {
        if ($error = $this->validateAdminAction($data->adminPassword)) {
            return $error;
        }

        $user = $this->userService->findById($userId);
        if (! $user) {
            return $this->errorResponse('Usuario no encontrado');
        }

        if (Auth::id() === $user->id && $data->role === 'admin') {
            return $this->errorResponse('No puedes quitarte tu propio rol de administrador');
        }

        $roleNames = $user->getRoleNames();
        if ($roleNames->count() <= 1) {
            return $this->errorResponse('El usuario debe tener al menos un rol. No se puede quitar el único rol.');
        }

        if (! $user->hasRole($data->role)) {
            return $this->errorResponse("El usuario no tiene el rol: {$data->role}");
        }

        try {
            $user->removeRole($data->role);
            $remaining = $user->getRoleNames();
            $newTipo = $this->roleNameToUserType($remaining->first());
            $user->update(['tipo' => $newTipo->value]);

            return new ApiResponseData(
                success: true,
                message: 'Rol quitado correctamente',
                data: UserData::fromModel($user->fresh(), true, true)
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al quitar rol: ' . $e->getMessage());
        }
    }

    private function roleNameToUserType(string $roleName): UserType
    {
        return match (strtolower($roleName)) {
            'admin' => UserType::ADMIN,
            'seller' => UserType::SELLER,
            default => UserType::CUSTOMER,
        };
    }

    public function deleteUser(AdminPasswordConfirmData $data, int $userId): ApiResponseData
    {
        if ($error = $this->validateAdminAction($data->adminPassword)) {
            return $error;
        }

        $user = $this->userService->findById($userId);
        if (! $user) {
            return $this->errorResponse('Usuario no encontrado');
        }

        if (Auth::id() === $user->id) {
            return $this->errorResponse('No puedes eliminarte a ti mismo');
        }

        try {
            $user->delete();

            return new ApiResponseData(success: true, message: 'Usuario eliminado correctamente');
        } catch (\Exception $e) {
            return $this->errorResponse('Error al eliminar: ' . $e->getMessage());
        }
    }

    public function resetPassword(AdminResetPasswordData $data, int $userId): ApiResponseData
    {
        if ($error = $this->validateAdminAction($data->adminPassword)) {
            return $error;
        }

        $user = $this->userService->findById($userId);
        if (! $user) {
            return $this->errorResponse('Usuario no encontrado');
        }

        try {
            $user->update(['password' => $data->password]);
            $user->tokens()->delete();

            return new ApiResponseData(success: true, message: 'Contraseña actualizada correctamente');
        } catch (\Exception $e) {
            return $this->errorResponse('Error al actualizar contraseña: ' . $e->getMessage());
        }
    }

    public function grantPermission(int $userId, \App\Data\User\GrantPermissionData $data): ApiResponseData
    {
        if ($error = $this->validateAdminAction($data->adminPassword)) {
            return $error;
        }

        $user = $this->userService->findById($userId);
        if (! $user) {
            return $this->errorResponse('Usuario no encontrado');
        }

        try {
            $user->givePermissionTo($data->permission);

            return new ApiResponseData(
                success: true,
                message: 'Permiso concedido',
                data: UserData::fromModel($user->fresh(), true, true)
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al conceder permiso: ' . $e->getMessage());
        }
    }

    public function revokePermission(int $userId, \App\Data\User\GrantPermissionData $data): ApiResponseData
    {
        if ($error = $this->validateAdminAction($data->adminPassword)) {
            return $error;
        }

        $user = $this->userService->findById($userId);
        if (! $user) {
            return $this->errorResponse('Usuario no encontrado');
        }

        try {
            $user->revokePermissionTo($data->permission);

            return new ApiResponseData(
                success: true,
                message: 'Permiso revocado',
                data: UserData::fromModel($user->fresh(), true, true)
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al revocar permiso: ' . $e->getMessage());
        }
    }

    public function listUsers(?string $search = null, ?string $role = null, ?string $permission = null): ApiResponseData
    {
        $users = $this->userService->listUsers($search, $role, $permission);
        $data = $users->map(fn ($u) => UserData::fromModel($u, true, true));

        return new ApiResponseData(success: true, data: $data->toArray());
    }

    private function validateAdminAction(string $password): ?ApiResponseData
    {
        $admin = Auth::user();
        if (! $admin || ! $admin->hasRole('admin')) {
            return $this->errorResponse('No tiene permisos para realizar esta acción');
        }
        if (! Hash::check($password, $admin->password)) {
            return $this->errorResponse('Contraseña de confirmación incorrecta');
        }

        return null;
    }

    private function mapUserTypeToRole(UserType $type): UserRole
    {
        return match ($type) {
            UserType::ADMIN => UserRole::ADMIN,
            UserType::CUSTOMER => UserRole::CUSTOMER,
            UserType::SELLER => UserRole::SELLER,
        };
    }

    private function errorResponse(string $message): ApiResponseData
    {
        return new ApiResponseData(success: false, message: $message);
    }
}
