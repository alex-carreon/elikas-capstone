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
        $this->app->bind(RoutingService::class, function () {
            return new RoutingService(config('services.brouter.url'));
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
