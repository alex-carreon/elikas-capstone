<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CapacityLevelController;
use App\Http\Controllers\Dashboards\CommentsAdminController;
use App\Http\Controllers\Comments\EvacComments;
use App\Http\Controllers\Dashboards\FloodPathAdminController;
use App\Http\Controllers\Dashboards\UserController;
use App\Http\Controllers\EmergencyContactController;
use App\Http\Controllers\EvacTypeController;
use App\Http\Controllers\Hazards\FloodLevelController;
use App\Http\Controllers\Hazards\FloodPathController;
use App\Http\Controllers\LocationsController;
use App\Http\Controllers\PinControllers\DeleteEvacuationAreaController;
use App\Http\Controllers\PinControllers\GetEvacAreaDetailsController;
use App\Http\Controllers\PinControllers\GetEvacAreasController;
use App\Http\Controllers\PinControllers\GetEvacuationRoutesController;
use App\Http\Controllers\PinControllers\GetNearbyEvacuationAreasController;
use App\Http\Controllers\PinControllers\StoreEvacuationAreaController;
use App\Http\Controllers\PinControllers\UpdateEvacuationAreaController;
use App\Http\Controllers\PinControllers\VerifyEvacuationAreaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SensorControllers\PublicSensorController;
use App\Http\Controllers\SensorControllers\SensorController;
use App\Http\Controllers\SMSController;
use App\Http\Controllers\VoteController;
use Illuminate\Support\Facades\Route;


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

Route::get('/locations/cities', [LocationsController::class, 'cities']);
Route::get('/locations/barangays', [LocationsController::class, 'barangays']);
Route::get('/emergency-contacts', [EmergencyContactController::class, 'index']);
Route::get('/evac-types', [EvacTypeController::class, 'index']);
Route::get('/capacity-levels', [CapacityLevelController::class, 'index']);

// ---------------------------------------------------------------
// PIN PUBLIC ROUTES — no token required
// ---------------------------------------------------------------
Route::get('/pins', [GetEvacAreasController::class, 'getEvacAreas']);
Route::get('/evacpins/users', [GetEvacAreasController::class, 'getMyEvacAreas'])->middleware('firebase.auth');
Route::get('/pins/nearby', [GetNearbyEvacuationAreasController::class, 'getNearbyEvacuationAreas']);
Route::get('/pins/routes', [GetEvacuationRoutesController::class, 'getEvacuationRoutes']);
Route::get('/pins/{id}', [GetEvacAreaDetailsController::class, 'getEvacAreaDetails']);



// ---------------------------------------------------------------
// ONLY ADMIN ROUTES
// ---------------------------------------------------------------
Route::prefix('admin')->middleware(['firebase.auth', 'role:1'])->group(function () {
    Route::post('/create-admin', [AdminController::class, 'createUser']);

    // Changed from deleteUser to match your controller naming preference
    Route::patch('/users/{id}/deactivate', [UserController::class, 'deactivateUser']);

    Route::post('/create-govop', [AdminController::class, 'createGovOp']);

    Route::get('/pins', [GetEvacAreasController::class, 'getAdminEvacAreas']);

    Route::get('flood-paths', [FloodPathAdminController::class, 'index']);
    
    //Comments
    Route::patch('/comments/{id}', [CommentsAdminController::class, 'update']);
    Route::patch('/comments/{id}/deactivate',[CommentsAdminController::class, 'deactivate']);

});

// ---------------------------------------------------------------
// ONLY GOVERNMENT OPERATOR ROUTES
// ---------------------------------------------------------------
Route::middleware(['firebase.auth', 'role:2'])->group(function () {
    Route::apiResource('sensors', SensorController::class)->except(['destroy']);
    Route::patch('/sensors/{sensor}/deactivate', [SensorController::class, 'deactivate']);
    Route::post('/sms/broadcasts', [SMSController::class, 'sendBroadcast']);
    Route::get('/sms/recipients', [SMSController::class, 'recipients']);
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
    Route::patch('/pins/{id}/verify', [VerifyEvacuationAreaController::class, 'verifyEvacuationArea']);

    Route::post('/emergency-contacts', [EmergencyContactController::class, 'store']);
    Route::patch('/emergency-contacts/{id}/deactivate', [EmergencyContactController::class, 'destroy']);
    Route::patch('/emergency-contacts/{id}/restore', [EmergencyContactController::class, 'restore']);
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
    Route::post('/pins', [StoreEvacuationAreaController::class, 'storeEvacuationArea']);
    Route::put('/pins/{id}', [UpdateEvacuationAreaController::class, 'updateEvacuationArea']);
    Route::delete('/pins/{id}', [DeleteEvacuationAreaController::class, 'deleteEvacuationArea']); //hard delete for admins
    Route::patch('/pins/{id}/deactivate', [DeleteEvacuationAreaController::class, 'deleteEvacuationArea']); //everyone else uses soft delete

    //VOTE
    Route::post('/flood-paths/{floodPathId}/vote', [VoteController::class, 'vote']);

    //COMMENTS
    Route::get('/evac-areas/{evacAreaId}/comments', [EvacComments::class, 'index']);
    Route::post('/evac-areas/{evacAreaId}/comments', [EvacComments::class, 'store']);
});
