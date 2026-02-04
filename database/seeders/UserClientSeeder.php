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
        $cliente = User::create([
            'name' => 'Cliente Ejemplo',
            'email' => 'cliente@example.com',
            'password' => 'cliente@example.com',
            'tipo' => 2,
        ]);
        $cliente->assignRole(UserRole::CUSTOMER->value);

        $cliente2 = User::create([
            'name' => 'Cliente Ejemplo 2',
            'email' => 'cliente2@example.com',
            'password' => 'cliente2@example.com',
            'tipo' => 2,
        ]);
        $cliente2->assignRole(UserRole::CUSTOMER->value);
    }
}
