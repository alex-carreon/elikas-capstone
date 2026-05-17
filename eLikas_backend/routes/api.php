<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Dashboards\UserController;

Route::get('/test', function () {
    return response()->json([
        'api_working' => true
    ]);
});

// PUBLIC ROUTES
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);


// ONLY CITIZEN ROUTES
Route::middleware('firebase.auth')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'profile']);

    Route::patch('/profile/email-sync', [ProfileController::class, 'syncEmail']);

    Route::patch('/profile/deactivate', [ProfileController::class, 'deactivateSelf']);

});


// ONLY ADMIN ROUTES
Route::middleware(['firebase.auth', 'is.admin'])->prefix('admin')->group(function () {

    Route::post('/create-admin', [AdminController::class, 'createUser']);

    Route::patch('/users/{id}/deactivate', [UserController::class, 'deactivateUser']);

    Route::post('/create-govop', [AdminController::class, 'createGovOp']);

});

// 1 = admin; 2 = GovOp; 3 = indiv
// BARANGAY OR ADMIN ROUTES
Route::middleware(['firebase.auth', 'role:1,2'])->group(function () { 
   
    Route::get('/admin/users', [UserController::class, 'allUsers']);

});

// ALL ROLES EXCEPT GUEST
Route::middleware(['firebase.auth', 'role:1,2,3'])->group(function () { 
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
});

