<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $name = config('sales.admin.name');
        $email = config('sales.admin.email');
        $password = config('sales.admin.password');

        if (! is_string($name) || ! is_string($email) || ! is_string($password)) {
            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'role' => 'sales_manager',
                'closer_id' => null,
                'avatar_url' => null,
                'password' => Hash::make($password),
            ]
        );
    }
}
