<?php

namespace App\Services;

use App\Data\User\AdminCreateUserData;
use App\Data\User\AdminRegisterData;
use App\Data\User\AdminUpdateUserData;
use App\Data\User\RegisterUserData;
use App\Data\User\UpdateUserData;
use App\Data\User\UserCustomData;
use App\Data\User\UserData;
use App\Enum\User\UserType;
use App\Models\User;
use Illuminate\Support\Str;

class UserService
{
    public function getUser(User $user, bool $withRoles = false, bool $withPermissions = false): UserData
    {
        return UserData::fromModel($user, $withRoles, $withPermissions);
    }

    /** Crear usuario; tipo del DTO o CUSTOMER por defecto. */
    public function create(RegisterUserData|UserCustomData|AdminCreateUserData|AdminRegisterData $data, ?UserType $type = null): User
    {
        $userType = $data instanceof UserCustomData || $data instanceof AdminCreateUserData
            ? $data->type
            : ($type ?? UserType::CUSTOMER);

        $name = $data->name;
        $email = $data->email;
        $password = $data->password;

        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'tipo' => $userType->value,
        ]);
    }

    public function update(User $user, UpdateUserData|AdminUpdateUserData $data): User
    {
        $payload = [];
        if ($data->name !== null) {
            $payload['name'] = $data->name;
        }
        if ($data->email !== null) {
            $payload['email'] = $data->email;
        }
        if (isset($data->password) && $data->password !== null && $data->password !== '') {
            $payload['password'] = $data->password;
        }

        if (!empty($payload)) {
            $user->update($payload);
        }
        $user->refresh();

        return $user;
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function listUsers(?string $search = null, ?string $role = null, ?string $permission = null)
    {
        $query = User::query()->with('roles');

        $search = $search ? Str::trim($search) : null;
        if ($search !== null && $search !== '') {
            $term = Str::lower($search);
            $likeTerm = '%' . $term . '%';
            $query->where(function ($q) use ($likeTerm) {
                $q->whereRaw('LOWER(name) LIKE ?', [$likeTerm])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$likeTerm]);
            });
        }

        if ($role) {
            $query->role($role);
        }

        if ($permission) {
            $query->whereHas('permissions', fn($q) => $q->where('name', $permission));
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}