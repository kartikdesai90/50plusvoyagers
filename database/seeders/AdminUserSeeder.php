<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates (or promotes) the default administrator.
 *
 * Idempotent: re-running updates the existing account rather than failing on
 * the unique email constraint. Every row in `users` is an admin, so there is
 * deliberately excluded from the model's $fillable.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ADMIN_EMAIL', 'admin@50voyagers.com');
        $password = (string) env('ADMIN_PASSWORD', 'password');
        $name = (string) env('ADMIN_NAME', 'Admin User');

        $user = User::firstOrNew(['email' => $email]);

        $user->name = $name;
        $user->password = Hash::make($password);
        $user->email_verified_at ??= now();
        $user->save();

        $this->command?->info("Admin ready: {$email}");
    }
}
