<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Dashboards\UserController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\PublicSensorController;
use App\Http\Controllers\Hazards\FloodPathController;
use App\Http\Controllers\Hazards\FloodLevelController;
use App\Http\Controllers\Dashboards\FloodPathAdminController;
use App\Http\Controllers\PinControllers\GetEvacAreasController;
use App\Http\Controllers\PinControllers\GetEvacAreaDetailsController;
use App\Http\Controllers\PinControllers\GetNearbyEvacuationAreasController;
use App\Http\Controllers\PinControllers\GetEvacuationRoutesController;
use App\Http\Controllers\PinControllers\StoreEvacuationAreaController;
use App\Http\Controllers\PinControllers\UpdateEvacuationAreaController;
use App\Http\Controllers\PinControllers\DeleteEvacuationAreaController;
use App\Http\Controllers\PinControllers\VerifyEvacuationAreaController;


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
Route::get('/public/sensors', [PublicSensorController::class, 'index']);

Route::get('flood-paths', [FloodPathController::class, 'index']);


// ---------------------------------------------------------------
// PIN PUBLIC ROUTES — no token required
// ---------------------------------------------------------------
Route::get('/pins', [GetEvacAreasController::class, 'getEvacAreas']);
Route::get('/pins/history', [GetEvacAreasController::class, 'getMyEvacAreas'])->middleware('firebase.auth');
Route::get('/pins/nearby', [GetNearbyEvacuationAreasController::class, 'getNearbyEvacuationAreas']);
Route::get('/pins/routes', [GetEvacuationRoutesController::class, 'getEvacuationRoutes']);
Route::get('/pins/{id}', [GetEvacAreaDetailsController::class, 'getEvacAreaDetails']);

// ---------------------------------------------------------------
// ONLY CITIZEN ROUTES
// ---------------------------------------------------------------
Route::middleware('firebase.auth')->group(function () {
    //Pins related shtuff
    Route::post('/pins', [StoreEvacuationAreaController::class, 'storeEvacuationArea']);
    Route::put('/pins/{id}', [UpdateEvacuationAreaController::class, 'updateEvacuationArea']);
    Route::delete('/pins/{id}', [DeleteEvacuationAreaController::class, 'deleteEvacuationArea']);
    Route::patch('/pins/{id}/deactivate', [DeleteEvacuationAreaController::class, 'deleteEvacuationArea']);
    Route::put('/pins/{id}/deactivate', [DeleteEvacuationAreaController::class, 'deleteEvacuationArea']);
    Route::patch('/pins/{id}/verify', [VerifyEvacuationAreaController::class, 'verifyEvacuationArea']);
});


// ---------------------------------------------------------------
// ONLY ADMIN ROUTES
// ---------------------------------------------------------------
Route::prefix('admin')->middleware(['firebase.auth', 'role:1'])->group(function () {
    Route::post('/create-admin', [AdminController::class, 'createUser']);

    Route::patch('/users/{id}/deactivate', [UserController::class, 'deactivateUser']);

    Route::post('/create-govop', [AdminController::class, 'createGovOp']);

    Route::get('/pins', [GetEvacAreasController::class, 'getAdminEvacAreas']);

    Route::get('flood-paths', [FloodPathAdminController::class, 'index']);
});

// ---------------------------------------------------------------
// ONLY GOVERNMENT OPERATOR ROUTES
// ---------------------------------------------------------------
Route::middleware(['firebase.auth', 'role:2'])->group(function () {
    Route::apiResource('sensors', SensorController::class)->except(['destroy']);
    Route::patch('/sensors/{sensor}/deactivate', [SensorController::class, 'deactivate']);
});


// 1 = admin; 2 = GovOp; 3 = indiv

// BARANGAY OR ADMIN ROUTES
Route::middleware(['firebase.auth', 'role:1,2'])->group(function () {
    //USER DASHBOARD
    Route::get('/admin/users', [UserController::class, 'allUsers']);
    Route::get('/admin/users/{id}', [UserController::class, 'getUser']);
    Route::patch('/admin/users/{id}', [UserController::class, 'updateUser']); //can update any user

    Route::get('/sensors', [SensorController::class, 'index']);
    Route::get('/sensors/{sensor}', [SensorController::class, 'show']);

    Route::apiResource('flood-levels', FloodLevelController::class)->except(['index']);

    Route::get('flood-paths/{id}', [FloodPathController::class, 'show']);

});

// ALL ROLES EXCEPT GUEST
Route::middleware(['firebase.auth', 'role:1,2,3'])->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::patch('/profile/email-sync', [ProfileController::class, 'syncEmail']);
    //PROFILE
    Route::get('/profile', [ProfileController::class, 'profile']);
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
    Route::patch('/profile/deactivate', [ProfileController::class, 'deactivateSelf']);
    Route::patch('/profile/email-sync', [ProfileController::class, 'syncEmail']); // wala pa talaga

    //FLOOD LEVELS
    Route::get('flood-levels', [FloodLevelController::class, 'index']);
    
    //FLOODS
    Route::post('flood-paths', [FloodPathController::class, 'store']);
    Route::get('/flood-paths/my',     [FloodPathController::class, 'my']);
    Route::get('/flood-paths/{id}',   [FloodPathController::class, 'show'])
        ->whereNumber('id');
    Route::patch('/flood-paths/{id}', [FloodPathController::class, 'update']);
    Route::patch('/flood-paths/{id}/deactivate', [FloodPathController::class, 'destroy']); // soft delete

});
