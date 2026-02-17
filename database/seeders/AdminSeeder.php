<?php

namespace Database\Seeders;

use App\Enum\User\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'admin@nxt.it.com'],
            [
                'name' => 'Admin',
                'password' => 'Admin123#',
                'tipo' => 1,
            ]
        );

        if (! $user->hasRole(UserRole::ADMIN->value)) {
            $user->assignRole(UserRole::ADMIN->value);
        }
    }
}
