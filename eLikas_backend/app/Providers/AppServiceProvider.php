<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\RoutingService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(RoutingService::class, function ($app) {
            return new RoutingService(
                config('services.brouter.url') ?? 'http://localhost:17777'
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
