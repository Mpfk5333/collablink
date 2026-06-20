<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        //
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Define authorization gates
        try {
            Gate::define('admin', fn($user) => $user->role === 'admin');
            Gate::define('client', fn($user) => $user->role === 'client');
            Gate::define('freelance', fn($user) => $user->role === 'freelance');
        } catch (\Exception $e) {
            // Gates will be defined after application bootstraps
        }
    }
}
