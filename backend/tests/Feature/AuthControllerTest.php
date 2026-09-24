<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_sales_credentials_can_sign_in(): void
    {
        config()->set('sales.admin', [
            'name' => 'Sales Administrator',
            'email' => 'sales@tmt.com',
            'password' => 'sales',
        ]);
        $this->seed();

        $this->postJson('/api/login', [
            'email' => 'sales@tmt.com',
            'password' => 'sales',
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'sales@tmt.com')
            ->assertJsonPath('user.role', 'sales_manager')
            ->assertJsonStructure(['token']);
    }

    public function test_valid_credentials_return_user_and_access_token(): void
    {
        $user = User::factory()->create([
            'email' => 'manager@example.com',
            'password' => Hash::make('correct-password'),
            'role' => 'sales_manager',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'manager@example.com',
            'password' => 'correct-password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', 'manager@example.com')
            ->assertJsonPath('user.role', 'sales_manager')
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'sales-dashboard',
        ]);
    }

    public function test_returns_401_when_credentials_are_incorrect(): void
    {
        User::factory()->create([
            'email' => 'manager@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'manager@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJsonPath('message', 'The provided credentials are incorrect.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_returns_422_when_login_fields_are_missing(): void
    {
        $this->postJson('/api/login')
            ->assertUnprocessable()
            ->assertInvalid([
                'email' => 'The email field is required.',
                'password' => 'The password field is required.',
            ]);
    }

    public function test_authenticated_user_can_restore_session_and_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'manager@example.com',
            'password' => Hash::make('correct-password'),
        ]);
        $token = $user->createToken('sales-dashboard')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', 'manager@example.com');

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Signed out successfully.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
