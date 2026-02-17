<?php

namespace Database\Seeders;

use App\Enum\User\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cliente = User::firstOrCreate(
            ['email' => 'cliente@example.com'],
            ['name' => 'Cliente Ejemplo', 'password' => 'cliente@example.com', 'tipo' => 2]
        );
        if (! $cliente->hasRole(UserRole::CUSTOMER->value)) {
            $cliente->assignRole(UserRole::CUSTOMER->value);
        }

        $cliente2 = User::firstOrCreate(
            ['email' => 'cliente2@example.com'],
            ['name' => 'Cliente Ejemplo 2', 'password' => 'cliente2@example.com', 'tipo' => 2]
        );
        if (! $cliente2->hasRole(UserRole::CUSTOMER->value)) {
            $cliente2->assignRole(UserRole::CUSTOMER->value);
        }
    }
}
