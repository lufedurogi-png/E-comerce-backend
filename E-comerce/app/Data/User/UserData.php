<?php

namespace App\Data\User;

use App\Enum\User\UserType;
use App\Models\User;
use Spatie\LaravelData\Data;

class UserData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public ?UserType $tipo,
        public ?string $email_verified_at = null,
        /** @var array<string>|null */
        public ?array $roles = null,
        /** @var array<string>|null */
        public ?array $permissions = null,
    ) {}

    public static function fromModel(User $user, bool $withRoles = false, bool $withPermissions = false): self
    {
        $roles = $withRoles ? $user->getRoleNames()->toArray() : null;
        $permissions = $withPermissions ? $user->getAllPermissions()->pluck('name')->toArray() : null;

        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            tipo: $user->tipo,
            email_verified_at: $user->email_verified_at?->toIso8601String(),
            roles: $roles,
            permissions: $permissions,
        );
    }
}
