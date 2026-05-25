<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Dashboards\UserController;
use App\Http\Controllers\PinController;
use App\Http\Controllers\Hazards\FloodPathController;
use App\Http\Controllers\Hazards\FloodLevelController;


Route::get('/test', function () {
    return response()->json([
        'api_working' => true
    ]);
});

// ---------------------------------------------------------------
// PUBLIC ROUTES — no token required
// ---------------------------------------------------------------
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

Route::get('flood-paths', [FloodPathController::class, 'index']);

// ---------------------------------------------------------------
// PIN PUBLIC ROUTES — no auth required
// ---------------------------------------------------------------
// FIX Bug 1: was 'getActiveMapMarkers' (non-existent) → correct method is getFacilities
Route::get('/pins',         [PinController::class, 'getFacilities']);
// FIX Bug 1: was 'getEvacAreaDetails' (non-existent) → added method to PinController
Route::get('/pins/nearby',  [PinController::class, 'getNearbyEvacuationAreas']);
Route::get('/pins/routes',  [PinController::class, 'getEvacuationRoutes']);
Route::get('/pins/{id}',    [PinController::class, 'getEvacAreaDetails']);

// ---------------------------------------------------------------
// ONLY CITIZEN ROUTES
// ---------------------------------------------------------------
Route::middleware('firebase.auth')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'profile']);

    Route::patch('/profile/email-sync', [ProfileController::class, 'syncEmail']);

    Route::patch('/profile/deactivate', [ProfileController::class, 'deactivateSelf']);

    // ---------------------------------------------------------------
    // PIN MUTATION ROUTES — require firebase.auth
    // FIX Bug 2: POST /pins was outside auth middleware → firebase_user was null
    // FIX Bug 3: PUT, DELETE, PATCH /verify had no routes at all
    // ---------------------------------------------------------------
    Route::post('/pins',              [PinController::class, 'storeEvacuationArea']);
    Route::put('/pins/{id}',          [PinController::class, 'updateEvacuationArea']);
    Route::delete('/pins/{id}',       [PinController::class, 'deleteEvacuationArea']);
    Route::patch('/pins/{id}/verify', [PinController::class, 'verifyEvacuationArea']);

});


// ---------------------------------------------------------------
// ONLY ADMIN ROUTES
// ---------------------------------------------------------------
Route::middleware(['firebase.auth', 'is.admin'])->prefix('admin')->group(function () {

    Route::post('/create-admin', [AdminController::class, 'createUser']);

    Route::patch('/users/{id}/deactivate', [UserController::class, 'deactivateUser']);

    Route::post('/create-govop', [AdminController::class, 'createGovOp']);

});

// 1 = admin; 2 = GovOp; 3 = indiv

// BARANGAY OR ADMIN ROUTES
Route::middleware(['firebase.auth', 'role:1,2'])->group(function () {

    Route::get('/admin/users', [UserController::class, 'allUsers']);

    Route::get('/users/{id}', [UserController::class, 'getUser']);

    Route::apiResource('flood-levels', FloodLevelController::class)->only(['index', 'store', 'update', 'show']);

    Route::get('flood-paths/{id}', [FloodPathController::class, 'show']);

});

// ALL ROLES EXCEPT GUEST
Route::middleware(['firebase.auth', 'role:1,2,3'])->group(function () {
    
    Route::put('/profile', [ProfileController::class, 'updateProfile']);

    Route::post('flood-paths', [FloodPathController::class, 'store']);

});
