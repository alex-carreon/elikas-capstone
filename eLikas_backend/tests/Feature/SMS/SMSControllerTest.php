<?php

use App\Models\BroadcastStatus;
use App\Models\GovOp;
use App\Models\Location;
use App\Models\SMSBroadcast;
use App\Services\SMSBroadcastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use App\Models\SMSTemplate;



/**
 * SMS endpoint tests.
 *
 * Controllers covered:
 *   SMSController      (role:2 govops, role:1,2 shared)
 *   AdminSMSController (role:1 admin)
 *
 * SMSBroadcastService is mocked in every test — no real SMS sent, no DB
 * writes via the service. Http::fake() is used for verifyToken.
 *
 * Routes (govops only — role:2):
 *   GET    /api/sms/recipients
 *   GET    /api/sms/broadcast-info
 *   POST   /api/sms/broadcasts
 *   GET    /api/sms/broadcasts
 *   POST   /api/sms/broadcasts/send-now
 *   POST   /api/sms-broadcasts/schedule
 *   GET    /api/sms/broadcasts/{id}/status
 *   DELETE /api/sms/broadcasts/{id}
 *   PATCH  /api/sms/broadcasts/{id}/cancel
 *   POST   /api/sms/verify-token
 *   POST   /api/sms/templates
 *   GET    /api/sms/templates
 *   DELETE /api/sms/templates/{id}
 *
 * Routes (role:1,2):
 *   GET    /api/sms/statuses
 *
 * Routes (admin only — role:1):
 *   GET    /api/admin/sms/broadcasts
 *
 * Token helpers are in tests/Pest.php.
 * Govops test account must have a GovOp row with location_id set in the DB.
 */

/**
 * Build a persisted SMSBroadcast tied to the real govops test user's
 * existing GovOp record.
 */
function fakeBroadcast(array $overrides = []): SMSBroadcast
{
    $govopsUser = govopsUser();
    $govOp = $govopsUser->govOp; 

    if (! $govOp) {
        test()->fail("Test govops user (uid=" . env('FIREBASE_TEST_GOVOPS_UID') . ") has no GovOp record.");
    }

    $status = BroadcastStatus::first();

    if (! $status) {
        test()->fail('No BroadcastStatus rows found — seed BroadcastStatuses before running this test.');
    }

    return SMSBroadcast::create(array_merge([
        'sender_id'         => $govOp->id, 
        'location_id'       => $govOp->location_id,
        'message_content'   => 'Test broadcast content',
        'status'            => $status->id, 
        'scheduled_for'     => now(),
        'sent_at'           => now(),
        'total_recipients'  => 1,
    ], $overrides));
}

function fakeBroadcastFormatted(int $id = 1): array
{
    return [
        'id'               => $id,
        'message_content'  => 'Test broadcast message',
        'status'           => ['id' => 1, 'name' => 'Pending'],
        'total_recipients' => 5,
        'scheduled_for'    => null,
        'sent_at'          => null,
        'location'         => ['id' => 1, 'name' => 'Test Barangay'],
    ];
}

function fakeTemplate(array $overrides = []): SMSTemplate
{
    $govopsUser = govopsUser();
    $govOp = $govopsUser->govOp;

    if (! $govOp) {
        test()->fail("Test govops user has no GovOp record.");
    }

    $template = new SMSTemplate();
    $template->optr_id = $govOp->id;
    $template->template_name = $overrides['template_name'] ?? 'Test Template ' . uniqid();
    $template->message_content = $overrides['message_content'] ?? 'Template content here.';
    $template->save();

    return $template->refresh();
}
function fakeTemplateFormatted(int $id = 1): array
{
    return [
        'id'              => $id,
        'template_name'   => 'Test Template',
        'message_content' => 'Template content here.',
    ];
}

/**
 * Wrap items in a LengthAwarePaginator so the controller's ->items(),
 * ->currentPage(), ->lastPage(), etc. calls all work.
 */
function fakePaginator(array $items, int $total = 1, int $perPage = 15): LengthAwarePaginator
{
    return new LengthAwarePaginator(
        collect($items),
        $total,
        $perPage,
        1,
        ['path' => '/api/sms/broadcasts']
    );
}

// ── GET /api/sms/statuses (role:1,2) ─────────────────────────────────────────

// Test 7.1
test('statuses returns all broadcast statuses for govops', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/statuses');

    $response->assertOk();

    $response->assertJsonStructure([
        'statuses' => [
            '*' => ['id', 'name'],
        ],
    ]);
});

// Test 7.2
test('statuses returns all broadcast statuses for admin', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/statuses');

    $response->assertOk();
});

// Test 7.3
test('statuses blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/statuses');

    $response->assertStatus(403);
});

// Test 7.4
test('statuses requires authentication', function () {

    $response = $this->getJson('/api/sms/statuses');

    $response->assertStatus(401);
});

// ── GET /api/sms/recipients (role:2) ─────────────────────────────────────────

// Test 9.1
test('govops can get recipients for their location', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('getRecipientsForLocation')
            ->once()
            ->andReturn(collect([]));
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/recipients');

    $response->assertOk();

    $response->assertJsonStructure([
        'location_id',
        'total_recipients',
        'recipients',
    ]);
});

// Test 9.2
test('recipients blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/recipients');

    $response->assertStatus(403);
});

// Test 9.3
test('recipients requires authentication', function () {

    $response = $this->getJson('/api/sms/recipients');

    $response->assertStatus(401);
});

// ── GET /api/sms/broadcast-info (role:2) ─────────────────────────────────────

// Test 10.1
test('govops can get broadcast info', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('getRecipientsForLocation')
            ->once()
            ->andReturn(collect([]));

        $mock->shouldReceive('getEstimatedPrice')
            ->once()
            ->andReturn([
                'total_recipients' => 0,
                'estimated_price'  => 0.00,
                'sms_parts'        => 1,
            ]);
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/broadcast-info');

    $response->assertOk();

    $response->assertJsonStructure([
        'location_id',
        'total_recipients',
        'estimated_price',
        'recipients',
    ]);
});


// ── GET /api/sms/broadcasts (role:2) ──────────────────────────────────────────

// Test 10.1
test('govops can list their broadcast history', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $paginator = fakePaginator([fakeBroadcast()]);

        $mock->shouldReceive('getHistory')
            ->once()
            ->andReturn($paginator);

       $mock->shouldReceive('formatBroadcast')
            ->once()
            ->withAnyArgs()
            ->andReturn(fakeBroadcastFormatted());
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/broadcasts');

    $response->assertOk();

    $response->assertJsonStructure([
        'location_id',
        'broadcasts',
        'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
    ]);
});

// Test 10.2
test('history rejects requests for a different location', function () {

    $this->mock(SMSBroadcastService::class);

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/broadcasts?location_id=999999');

    $response->assertStatus(403);

    $response->assertJson(['message' => 'You may only view broadcasts for your own location.']);
});

// ── POST /api/sms/broadcasts/send-now (role:2) ────────────────────────────────

// Test 1.1
test('send immediate succeeds in mock mode', function () {

    // In mock mode the controller skips the X-iPROG-API-TOKEN header check
    config(['services.iprogsms.mock' => true]);

    $broadcast = fakeBroadcast();

    $this->mock(SMSBroadcastService::class, function ($mock) use ($broadcast) {
        $mock->shouldReceive('sendImmediate')
            ->once()
            ->andReturn([
                'failed'           => false,
                'mock'             => true,
                'broadcast'        => $broadcast,
                'gateway_response' => ['message' => 'Mock success'],
            ]);

        $mock->shouldReceive('formatBroadcast')
            ->once()
            ->andReturn(fakeBroadcastFormatted());
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('', [
        'message_content' => 'Immediate broadcast test.',
    ]);

    $response->assertStatus(202);

    $response->assertJson(['message' => 'SMS dispatched in mock mode.']);
});

// Test 1.2
test('send immediate requires X-iPROG-API-TOKEN when not in mock mode', function () {

    config(['services.iprogsms.mock' => false]);

    $this->mock(SMSBroadcastService::class);

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
        // No X-iPROG-API-TOKEN header
    ])->postJson('/api/sms/broadcasts/send-now', [
        'message_content' => 'Should fail.',
    ]);

    $response->assertStatus(422);

    expect($response->json('errors'))->toHaveKey('X-iPROG-API-TOKEN');
});

// Test 1.3
test('send immediate returns failure response when service reports failed', function () {

    config(['services.iprogsms.mock' => true]);

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('sendImmediate')
            ->once()
            ->andReturn([
                'failed'           => true,
                'error_code'       => 'INVALID_TOKEN',
                'gateway_response' => ['message' => 'Invalid api token'],
                'gateway_message'  => 'Invalid api token',
            ]);
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms/broadcasts/send-now', [
        'message_content' => 'Test.',
    ]);

    $response->assertStatus(401);

    $response->assertJsonStructure(['message', 'error_code', 'iprogsms_response']);
});

// Test 1.4
test('send immediate validates message_content is required', function () {

    config(['services.iprogsms.mock' => true]);

    $this->mock(SMSBroadcastService::class);

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms/broadcasts/send-now', []);

    $response->assertStatus(422);
});

// ── POST /api/sms-broadcasts/schedule (role:2) ────────────────────────────────

// Test 2.1
test('schedule creates a scheduled broadcast in mock mode', function () {

    config(['services.iprogsms.mock' => true]);

    $broadcast = fakeBroadcast();

    $this->mock(SMSBroadcastService::class, function ($mock) use ($broadcast) {
        $mock->shouldReceive('scheduleBroadcast')
            ->once()
            ->andReturn([
                'broadcast'     => $broadcast,
                'scheduled_for' => now('Asia/Manila')->addHour()->toDateTimeString(),
                'delay_seconds' => 3600,
            ]);

        $mock->shouldReceive('formatBroadcast')
            ->once()
            ->andReturn(fakeBroadcastFormatted());
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms-broadcasts/schedule', [
        'message_content' => 'Scheduled broadcast test.',
        'scheduled_for'   => now('Asia/Manila')->addHour()->toDateTimeString(),
    ]);

    $response->assertStatus(202);

    $response->assertJsonStructure(['message', 'status', 'broadcast', 'queue']);

    $response->assertJson(['message' => 'SMS broadcast scheduled successfully.']);
});

// Test 2.2
test('schedule requires scheduled_for to be in the future', function () {

    config(['services.iprogsms.mock' => true]);

    $this->mock(SMSBroadcastService::class);

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms-broadcasts/schedule', [
        'message_content' => 'Test.',
        'scheduled_for'   => now()->subHour()->toDateTimeString(),
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['scheduled_for']);
});

// Test 2.3
test('schedule requires scheduled_for field', function () {

    config(['services.iprogsms.mock' => true]);

    $this->mock(SMSBroadcastService::class);

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms-broadcasts/schedule', [
        'message_content' => 'Test without schedule.',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['scheduled_for']);
});

// Test 2.4
test('schedule requires X-iPROG-API-TOKEN when not in mock mode', function () {

    config(['services.iprogsms.mock' => false]);

    $this->mock(SMSBroadcastService::class);

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms-broadcasts/schedule', [
        'message_content' => 'Test.',
        'scheduled_for'   => now()->addHour()->toDateTimeString(),
    ]);

    $response->assertStatus(422);

    expect($response->json('errors'))->toHaveKey('X-iPROG-API-TOKEN');
});

// ── PATCH /api/sms/broadcasts/{id}/cancel (role:2) ────────────────────────────

// Test 5.1
test('govops can cancel a pending broadcast', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('cancelBroadcast')
            ->once()
            ->andReturn('cancelled');
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/sms/broadcasts/1/cancel');

    $response->assertOk();

    $response->assertJson(['message' => 'Broadcast cancelled successfully.']);
});

// Test 5.2
test('cancel returns 422 when broadcast is not found or not owned', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('cancelBroadcast')
            ->once()
            ->andReturn('not_found');
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/sms/broadcasts/1/cancel');

    $response->assertStatus(422);

    expect($response->json('errors'))->toHaveKey('broadcast');
});

// Test 5.3
test('cancel returns 422 when broadcast is not pending', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('cancelBroadcast')
            ->once()
            ->andReturn('not_pending');
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/sms/broadcasts/1/cancel');

    $response->assertStatus(422);

    expect($response->json('errors'))->toHaveKey('status');
});

// Test 5.4
test('cancel returns 422 when execution window has passed', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('cancelBroadcast')
            ->once()
            ->andReturn('window_passed');
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/sms/broadcasts/1/cancel');

    $response->assertStatus(422);

    expect($response->json('errors'))->toHaveKey('scheduled_for');
});

// ── POST /api/sms/verify-token (role:2) ───────────────────────────────────────

// Test 1.5
test('verify token requires api_token field', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms/verify-token', []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['api_token']);
});

// TEST 1.6
test('verify token requires api_token of at least 8 characters', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms/verify-token', [
        'api_token' => 'short',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['api_token']);
});

// TEST 1.7
test('verify token blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms/verify-token', [
        'api_token' => 'valid-token-12345',
    ]);

    $response->assertStatus(403);
});

// ── POST /api/sms/templates (role:2) ──────────────────────────────────────────

// Test 6.1
test('govops can create an sms template', function () {

    $template = fakeTemplate();

    $this->mock(SMSBroadcastService::class, function ($mock) use ($template) {
        $mock->shouldReceive('createTemplate')
            ->once()
            ->andReturn($template);

        $mock->shouldReceive('formatTemplate')
            ->once()
            ->andReturn(fakeTemplateFormatted());
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms/templates', [
        'template_name'   => 'My Template',
        'message_content' => 'Template message content.',
    ]);

    $response->assertCreated();

    $response->assertJson(['message' => 'SMS template created successfully.']);

    $response->assertJsonStructure(['message', 'template']);
});

// TEST 6.2
test('store template validates required fields', function () {

    $this->mock(SMSBroadcastService::class);

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms/templates', []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['template_name', 'message_content']);
});

// TEST 6.3
test('store template validates template_name max 50 characters', function () {

    $this->mock(SMSBroadcastService::class);

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sms/templates', [
        'template_name'   => str_repeat('a', 51),
        'message_content' => 'Content.',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['template_name']);
});

// ── GET /api/sms/templates (role:2) ───────────────────────────────────────────

// TEST 7.1
test('govops can list their templates', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('getTemplatesForOperator')
            ->once()
            ->andReturn(collect([fakeTemplate()]));

        $mock->shouldReceive('formatTemplate')
            ->once()
            ->andReturn(fakeTemplateFormatted());
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/templates');

    $response->assertOk();

    $response->assertJsonStructure(['templates', 'total']);
});

// TEST 7.2
test('templates list blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sms/templates');

    $response->assertStatus(403);
});

// ── DELETE /api/sms/templates/{id} (role:2) ───────────────────────────────────

// TEST 8.1
test('govops can delete their template', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('deleteTemplate')
            ->once()
            ->andReturn(true);
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->deleteJson('/api/sms/templates/1');

    $response->assertOk();

    $response->assertJson(['message' => 'Template deleted successfully.']);
});

// TEST 8.2
test('delete template returns 404 when not found or not owned', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $mock->shouldReceive('deleteTemplate')
            ->once()
            ->andReturn(false);
    });

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->deleteJson('/api/sms/templates/999999');

    $response->assertNotFound();
});

// ── GET /api/admin/sms/broadcasts (role:1) ────────────────────────────────────

// TEST 10.1
test('admin can list all broadcasts across all govops', function () {

    $this->mock(SMSBroadcastService::class, function ($mock) {
        $paginator = fakePaginator([fakeBroadcast()]);

        $mock->shouldReceive('getAllBroadcasts')
            ->once()
            ->andReturn($paginator);

        $mock->shouldReceive('formatBroadcast')
            ->once()
            ->andReturn(fakeBroadcastFormatted());
    });

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/sms/broadcasts');

    $response->assertOk();

    $response->assertJsonStructure([
        'broadcasts',
        'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
    ]);
});

// TEST 10.2
test('admin sms index blocks govops users', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/sms/broadcasts');

    $response->assertStatus(403);
});

// TEST 10.3
test('admin sms index blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/sms/broadcasts');

    $response->assertStatus(403);
});

// TEST 10.4
test('admin sms index requires authentication', function () {

    $response = $this->getJson('/api/admin/sms/broadcasts');

    $response->assertStatus(401);
});