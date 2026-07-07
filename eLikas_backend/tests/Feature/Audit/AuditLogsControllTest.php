<?php

use App\Models\AuditLog;
use App\Models\TargetTable;

/**
 * AuditLogController tests.
 *
 * Routes (admin only, role:1):
 *   GET /api/admin/audit-logs        -> index
 *   GET /api/admin/audit-logs/{id}   -> show
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Create an AuditLog row directly in the DB.
 */
function createAuditLog(array $overrides = []): AuditLog
{
    static $counter = 0;
    $counter++;

    $admin = adminUser();
    $targetTable = TargetTable::first();

    if (! $targetTable) {
        test()->fail('No TargetTable rows found — seed TargetTables before running this test.');
    }

    return AuditLog::create(array_merge([
        'log_id'           => (string) $counter,
        'user_type'        => get_class($admin),
        'user_id'          => $admin->id,
        'event'            => 'created',
        'target_table_id'  => $targetTable->id,
        'target_id'        => $counter,
        'old_values'       => json_encode([]),
        'new_values'       => json_encode(['name' => 'Test Value ' . $counter]),
        'ip_address'       => '127.0.0.1',
        'user_agent'       => 'Pest Test Suite',
    ], $overrides));
}

// ── GET /api/admin/audit-logs ───────────────────────────────────────────────────

// Test 1.1
test('admin can list audit logs', function () {

    $token = adminToken();
    createAuditLog();
    createAuditLog();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/audit-logs');

    $response->assertOk();

    $response->assertJsonStructure([
        'data' => [
            '*' => ['id', 'logId', 'userType', 'userName', 'activity', 'table', 'actionDate'],
        ],
    ]);
});

// Test 1.2
test('audit logs index is forbidden for non-admin roles', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/audit-logs');

    $response->assertForbidden();
});

// Test 1.3
test('audit logs index requires authentication', function () {

    $response = $this->getJson('/api/admin/audit-logs');

    $response->assertUnauthorized();
});

// ── GET /api/admin/audit-logs/{id} ─────────────────────────────────────────────

// Test 2.1
test('admin can view a single audit log with full details', function () {

    $token = adminToken();
    $log = createAuditLog([
        'old_values' => json_encode(['status' => 'draft']),
        'new_values' => json_encode(['status' => 'published']),
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/audit-logs/{$log->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'data' => [
            'id', 'logId', 'userType', 'userName', 'activity', 'table',
            'targetId', 'oldValues', 'newValues', 'ipAddress', 'userAgent', 'actionDate',
        ],
    ]);

     $response->assertJsonPath('data.id', $log->id);
});

// Test 2.2
test('audit log show returns 404 for non-existent log', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/audit-logs/999999');

    $response->assertNotFound();
});

// Test 2.3
test('audit log show is forbidden for non-admin roles', function () {

    $token = govopsToken();
    $log = createAuditLog();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/audit-logs/{$log->id}");

    $response->assertForbidden();
});

// TEST 4
test('filters by event type', function () {

    $token = adminToken();
    $created = createAuditLog(['event' => 'created']);
    $deleted = createAuditLog(['event' => 'deleted']);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/audit-logs?event[]=deleted');

    $response->assertOk();

    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($deleted->id);
    expect($ids)->not->toContain($created->id);
});

// Test 3.1
test('search filters by partial match on user name', function () {

    $token = adminToken();
    $admin = adminUser();
    $individual = individualUser();

    $admin->loadMissing('name');
    if (! $admin->name) {
        \App\Models\Name::create([
            'user_id'    => $admin->id,
            'first_name' => 'Zeltron',
            'last_name'  => 'TestAdmin',
        ]);
        $admin->load('name');
    }

    $matching = createAuditLog(['user_id' => $admin->id]);
    $otherLog  = createAuditLog(['user_id' => $individual->id]);

    $nameFragment = substr($admin->name->first_name, 0, 4);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/audit-logs?search={$nameFragment}");

    $response->assertOk();

    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($matching->id);
    expect($ids)->not->toContain($otherLog->id);
});


// Test 3.2
test('search with no matches returns an empty result set', function () {

    $token = adminToken();
    createAuditLog();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/audit-logs?search=ThisStringShouldNeverMatchAnything999');

    $response->assertOk();
    expect($response->json('data'))->toBeEmpty();
});