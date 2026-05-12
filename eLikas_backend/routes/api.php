<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;

// PUBLIC ROUTES
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);


// PROTECTED ROUTES
Route::middleware('firebase.auth')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'profile']);
    Route::put('/profile', [ProfileController::class, 'updateProfile']);

});

// ADMIN ROUTES
Route::middleware(['firebase.auth', 'is.admin'])->prefix('admin')->group(function () {

    Route::post('/users', [AdminController::class, 'createUser']);

    Route::get('/users', [ProfileController::class, 'allUsers']);

});