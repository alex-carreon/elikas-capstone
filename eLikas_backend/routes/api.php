<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CapacityLevelController;
use App\Http\Controllers\Comments\EvacComments;
use App\Http\Controllers\Dashboards\AdminFlagController;
use App\Http\Controllers\Dashboards\CommentsAdminController;
use App\Http\Controllers\Dashboards\FloodPathAdminController;
use App\Http\Controllers\Dashboards\UserController;
use App\Http\Controllers\EmergencyContactController;
use App\Http\Controllers\EvacTypeController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\Flags\FlagCommentController;
use App\Http\Controllers\Flags\FlagFloodController;
use App\Http\Controllers\Hazards\FloodLevelController;
use App\Http\Controllers\Hazards\FloodPathController;
use App\Http\Controllers\Hazards\FloodReminderController;
use App\Http\Controllers\LocationsController;
use App\Http\Controllers\OtpController;
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
use App\Http\Controllers\SensorControllers\SensorLogController;
use App\Http\Controllers\SMSController;
use App\Http\Controllers\TargetTableController;
use App\Http\Controllers\Votes\VoteCommentController;
use App\Http\Controllers\Votes\VoteController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminSMSController;
use App\Http\Controllers\EvacRouteController;
use App\Http\Controllers\MediaCleanupController;

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
Route::get('/public/sensors/{sensor}', [PublicSensorController::class, 'show']);

Route::get('/locations/cities', [LocationsController::class, 'cities']);
Route::get('/locations/barangays', [LocationsController::class, 'barangays']);
Route::get('/emergency-contacts', [EmergencyContactController::class, 'index']);
Route::get('/emergency-contacts/{id}', [EmergencyContactController::class, 'show'])
    ->whereNumber('id');
Route::get('/evac-types', [EvacTypeController::class, 'index']);
Route::get('/capacity-levels', [CapacityLevelController::class, 'index']);

Route::post('/sensor-logs', [SensorLogController::class, 'store']);

Route::post('/email/resend-verification', [AuthController::class, 'resendVerification']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:5,1');

Route::get('/route', [EvacRouteController::class, 'getRoute']);

// ---------------------------------------------------------------
// PIN ROUTES
// ---------------------------------------------------------------
Route::get('/pins/nearby', [GetNearbyEvacuationAreasController::class, 'getNearbyEvacuationAreas']);
Route::get('/pins/routes', [GetEvacuationRoutesController::class, 'getEvacuationRoutes']);



// ---------------------------------------------------------------
// OPTIONAL FIREBASE MIDDLEWARE
// ---------------------------------------------------------------
Route::middleware('optional.firebase.auth')->group(function () {
    Route::get('/flood-paths', [FloodPathController::class, 'index']);
    Route::get('/pins', [GetEvacAreasController::class, 'getEvacAreas']);
    Route::get('/evacpins/users/coords', [GetEvacAreasController::class, 'getRoleIndivCoords']);
    Route::get('/pins/{id}', [GetEvacAreaDetailsController::class, 'getEvacAreaDetails'])->whereNumber('id');
});

// ---------------------------------------------------------------
// ONLY ADMIN ROUTES
// ---------------------------------------------------------------
Route::prefix('admin')->middleware(['firebase.auth', 'role:1'])->group(function () {
    Route::post('/create-admin', [AdminController::class, 'createUser']);

    Route::patch('/users/{id}/deactivate', [UserController::class, 'deactivateUser']);

    Route::post('/create-govop', [AdminController::class, 'createGovOp']);

    Route::get('/pins', [GetEvacAreasController::class, 'getAdminEvacAreas']);

    Route::get('/emergency-contacts', [EmergencyContactController::class, 'indexAdmin']);

    Route::get('flood-paths', [FloodPathAdminController::class, 'index']);

    //USER DASHBOARD
    Route::get('/users', [UserController::class, 'allUsers']);
    Route::get('/users/{id}', [UserController::class, 'getUser']);
    Route::patch('/users/{id}', [UserController::class, 'updateUser']); //can update any user

    //FLAGS
    Route::get('/comments/flags', [AdminFlagController::class, 'commentFlags']);
    Route::get('/comments/flags/{commentId}', [AdminFlagController::class, 'commentDetail']);

    Route::get('/flood-paths/flags', [AdminFlagController::class, 'floodPathFlags']);
    Route::get('/flood-paths/flags/{floodPathId}', [AdminFlagController::class, 'floodPathDetail']);

    Route::patch('/flags/{elementId}/approve', [AdminFlagController::class, 'approve']);
    Route::patch('/flags/{elementId}/reject', [AdminFlagController::class, 'reject']);

    //Comments
    Route::patch('/comments/{id}', [CommentsAdminController::class, 'update']);
    Route::patch('/comments/{id}/deactivate',[CommentsAdminController::class, 'deactivate']);

    Route::get('/evac-areas/{evacAreaId}/comments',[CommentsAdminController::class, 'index']);
    Route::get('/comments/{id}',[CommentsAdminController::class, 'show']);

    Route::get('/feedback', [FeedbackController::class, 'index']);
    Route::get('/feedback/{id}', [FeedbackController::class, 'show'])->whereNumber('id');
    Route::delete('/feedback/{id}', [FeedbackController::class, 'destroy'])->whereNumber('id');

    Route::post('/create-admin', [AdminController::class, 'createUser']);

    Route::apiResource('audit-logs', AuditLogController::class)->only(['index', 'show']);

    Route::get('/target-tables', [TargetTableController::class, 'index']);

    //SMS
    Route::get('/sms/broadcasts', [AdminSMSController::class, 'index']);

    //Delete Media (media record ID or direct path in server as /media/{id or path})
    Route::delete('/media/', [MediaCleanupController::class, 'destroy']);
});

// ---------------------------------------------------------------
// ONLY GOVERNMENT OPERATOR ROUTES
// ---------------------------------------------------------------
Route::middleware(['firebase.auth', 'role:2'])->group(function () {
    Route::apiResource('sensors', SensorController::class)->except(['destroy']);
    Route::patch('/sensors/{sensor}/deactivate', [SensorController::class, 'deactivate']);

    // ---------------------------------------------------------------
    // SMS SYSTEM
    // ---------------------------------------------------------------
    Route::get('/sms/recipients', [SMSController::class, 'recipients']);
    Route::get('/sms/broadcast-info', [SMSController::class, 'broadcastInfo']);

    // SMS — Broadcasts / Direct Messages
    Route::post('/sms/broadcasts', [SMSController::class, 'store']);
    Route::get('/sms/broadcasts', [SMSController::class, 'history']);
    Route::post('/sms/broadcasts/send-now', [SMSController::class, 'sendImmediate']);
    Route::post('/sms-broadcasts/schedule', [SMSController::class, 'schedule']);
    Route::get('/sms/broadcasts/{broadcastId}/status', [SMSController::class, 'status'])->whereNumber('broadcastId');
    Route::delete('/sms/broadcasts/{broadcastId}', [SMSController::class, 'destroy'])->whereNumber('broadcastId');
    Route::patch('/sms/broadcasts/{broadcastId}/cancel', [SMSController::class, 'cancel'])
        ->whereNumber('broadcastId');
    Route::post('/sms/verify-token', [SMSController::class, 'verifyToken']);


    // SMS — Templates
    Route::post('/sms/templates', [SMSController::class, 'storeTemplate']);
    Route::get('/sms/templates', [SMSController::class, 'indexTemplates']);
    Route::delete('/sms/templates/{templateId}', [SMSController::class, 'destroyTemplate'])->whereNumber('templateId');
});


// 1 = admin; 2 = brgy_op; 3 = indiv; city_op = 3

// BARANGAY OR ADMIN ROUTES
Route::middleware(['firebase.auth', 'role:1,2'])->group(function () {
    Route::get('/sensors', [SensorController::class, 'index']);
    Route::get('/sensors/{sensor}', [SensorController::class, 'show']);
    Route::get('sensors/{sensor_code}/logs', [SensorLogController::class, 'index']);

    Route::apiResource('flood-levels', FloodLevelController::class)->except(['index']);

    Route::get('flood-paths/{id}', [FloodPathController::class, 'show']);
    Route::patch('/pins/{id}/verify', [VerifyEvacuationAreaController::class, 'verifyEvacuationArea']);

    Route::post('/emergency-contacts', [EmergencyContactController::class, 'store']);
    Route::patch('/emergency-contacts/{id}', [EmergencyContactController::class, 'update']);
    Route::patch('/emergency-contacts/{id}/deactivate', [EmergencyContactController::class, 'destroy']);
    Route::patch('/emergency-contacts/{id}/restore', [EmergencyContactController::class, 'restore']);

    //SMS
    Route::get('/sms/statuses', [SMSController::class, 'statuses']);

});

// ALL ROLES EXCEPT GUEST
Route::middleware(['firebase.auth', 'role:1,2,3'])->group(function () {

    //REMINDERS
   Route::get('flood-reminders', [FloodReminderController::class, 'index']);
    Route::post('flood-reminders/remind-later', [FloodReminderController::class, 'remindLater']);
    Route::post('flood-reminders/dismiss', [FloodReminderController::class, 'dismissReminder']);

    //AUTH
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    //FEEDBACK
    Route::post('/feedback', [FeedbackController::class, 'store']);

    //PROFILE
    Route::get('/profile', [ProfileController::class, 'profile']);
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
    Route::patch('/profile/deactivate', [ProfileController::class, 'deactivateSelf']);
    Route::post('/profile/email-sync', [ProfileController::class, 'syncEmail']);
    Route::patch('/profile/change-email', [ProfileController::class, 'changeEmail']);

    //FLOOD LEVELS
    Route::get('flood-levels', [FloodLevelController::class, 'index']);

    //FLOODS
    Route::post('flood-paths', [FloodPathController::class, 'store']);
    Route::get('/flood-paths/my', [FloodPathController::class, 'my']);
    Route::get('/flood-paths/{id}', [FloodPathController::class, 'show'])
        ->whereNumber('id');
    Route::patch('/flood-paths/{id}', [FloodPathController::class, 'update']);
    Route::patch('/flood-paths/{id}/deactivate', [FloodPathController::class, 'destroy']); // soft delete
    Route::post('/flood-paths/{id}/media', [FloodPathController::class, 'addMedia']);

    //EVAC PINS
    Route::post('/pins', [StoreEvacuationAreaController::class, 'storeEvacuationArea']);
    Route::put('/pins/{id}', [UpdateEvacuationAreaController::class, 'updateEvacuationArea']);
    Route::delete('/pins/{id}', [DeleteEvacuationAreaController::class, 'deleteEvacuationArea']); //hard delete for admins
    Route::patch('/pins/{id}/deactivate', [DeleteEvacuationAreaController::class, 'deleteEvacuationArea']); //everyone else uses soft delete

    //VOTE
    Route::post('/flood-paths/{floodPathId}/vote', [VoteController::class, 'vote']);
    Route::post('/comments/{commentId}/vote', [VoteCommentController::class, 'vote']);

    //COMMENTS
    Route::get('/evac-areas/{evacAreaId}/comments', [EvacComments::class, 'index']);
    Route::post('/evac-areas/{evacAreaId}/comments', [EvacComments::class, 'store']);
    Route::get('/comments/{id}',[EvacComments::class, 'show']);


    //SENSORS
    Route::get('/sensors/{sensor}', [SensorController::class, 'show']);

    //pins
    Route::get('/pins/my-coords', [GetEvacAreasController::class, 'getMyCoords']);
    Route::get('/evacpins/users', [GetEvacAreasController::class, 'getMyEvacHistory']);
    Route::get('/evacpins/users/history', [GetEvacAreasController::class, 'getMyEvacHistory']);

    Route::patch('/pins/{id}/restore', [DeleteEvacuationAreaController::class, 'restoreEvacuationArea']);

    //Emergency contact
    Route::get('/emergency-contacts/location/{location_id}', [EmergencyContactController::class, 'getByLocationId']);

    //FLAGS
    Route::post('/comments/{commentId}/flag', [FlagCommentController::class, 'store']);
    Route::post('/flood-paths/{floodPathId}/flag', [FlagFloodController::class, 'store']);
    Route::get('/flag-reasons', [FlagCommentController::class, 'reasons']);

    //OTPsms
    Route::post('/otp/send', [OtpController::class, 'send']);
    Route::post('/otp/verify', [OtpController::class, 'verify']);
});
