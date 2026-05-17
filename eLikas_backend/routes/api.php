<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Dashboards\UserController;
use App\Http\Controllers\PinController;

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

// ---------------------------------------------------------------
// PIN LOOKUP ROUTES — must be ABOVE /pins/{id}
// otherwise Laravel will treat "locations", "evac-types", etc.
// as the {id} parameter and run show() instead
// ---------------------------------------------------------------
Route::get('/pins/locations',        [PinController::class, 'getLocations']);
Route::post('/pins/locations',       [PinController::class, 'storeLocation']);
Route::get('/pins/evac-types',       [PinController::class, 'getEvacTypes']);
Route::post('/pins/evac-types',      [PinController::class, 'storeEvacType']);
Route::get('/pins/capacity-levels',  [PinController::class, 'getCapacityLevels']);
Route::post('/pins/capacity-levels', [PinController::class, 'storeCapacityLevel']);

// ---------------------------------------------------------------
// PIN ROUTES — {id} route must come AFTER the named routes above
// ---------------------------------------------------------------
Route::get('/pins',      [PinController::class, 'index']);
Route::get('/pins/{id}', [PinController::class, 'show']);
Route::post('/pins',     [PinController::class, 'store']);


// ---------------------------------------------------------------
// ONLY CITIZEN ROUTES
// ---------------------------------------------------------------
Route::middleware('firebase.auth')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'profile']);

    Route::patch('/profile/email-sync', [ProfileController::class, 'syncEmail']);

    Route::patch('/profile/deactivate', [ProfileController::class, 'deactivateSelf']);

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

});

// ALL ROLES EXCEPT GUEST
Route::middleware(['firebase.auth', 'role:1,2,3'])->group(function () {
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
});
