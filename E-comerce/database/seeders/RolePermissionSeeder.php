<?php

namespace Database\Seeders;

use App\Enum\Permisos\PermissionEnum;
use App\Enum\User\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $guardName = 'web';

        // Crear todos los permisos
        foreach (PermissionEnum::cases() as $permission) {
            Permission::firstOrCreate([
                'name' => $permission->value,
                'guard_name' => $guardName
            ]);
        }

        // Crear roles y asignar permisos
        foreach (UserRole::cases() as $roleEnum) {
            $role = Role::firstOrCreate([
                'name' => $roleEnum->value,
                'guard_name' => $guardName
            ]);

            $permissions = PermissionEnum::forRole($roleEnum);
            $role->syncPermissions($permissions);
        }
    }
}