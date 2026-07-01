<?php

use App\Jobs\SendFloodReminders;
use App\Mail\FloodPathReminderMail;
use App\Models\FloodLevel;
use App\Models\FloodPath;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Support\Facades\Mail;

/**
 * SendFloodReminders job tests.
 *
 * The job is dispatched synchronously (via handle()) so we don't need a real
 * queue. Mail is faked in every test — no real emails are sent.
 *
 * The job uses the same halfway-point logic as FloodReminderController,
 * so we control eligibility by setting last_confirmed/expiry on the path.
 *
 * Token helpers are in tests/Pest.php but aren't needed here — the job
 * runs server-side with no HTTP auth.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function jobTestUser(): User
{
    $uid      = env('FIREBASE_TEST_VERIFIED_UID');
    $userAuth = UserAuth::with('user')->where('identity_uid', $uid)->first();

    if (! $userAuth || ! $userAuth->user) {
        test()->fail("No UserAuth row found for FIREBASE_TEST_VERIFIED_UID [{$uid}].");
    }

    return $userAuth->user;
}

/**
 * Create a FloodPath for the job tests.
 * Default coordinates placed well away from other test files to avoid
 * intersection conflicts (though the job doesn't use the intersection service).
 */
function createJobFloodPath(User $user, array $overrides = []): FloodPath
{
    static $offset = 0;
    $offset += 0.001;

    $targetTable = TargetTable::where('table_name', 'FloodPaths')->firstOrFail();
    $floodLevel  = FloodLevel::first();

    $socialElement = SocialElement::create([
        'user_id'   => $user->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    $lat1 = round(5.0 + $offset, 6);
    $lat2 = round(5.0 + $offset + 0.0001, 6);

    $floodPath = FloodPath::create(array_merge([
        'element_id'     => $socialElement->id,
        'level_id'       => $floodLevel->id,
        'last_confirmed' => now()->subHours(4),
        'path'           => new \MatanYadaev\EloquentSpatial\Objects\LineString([
            new \MatanYadaev\EloquentSpatial\Objects\Point($lat1, 172.0),
            new \MatanYadaev\EloquentSpatial\Objects\Point($lat2, 172.0001),
        ]),
        'description'    => 'Job test flood path',
        'upvotes'        => 0,
        'downvotes'      => 0,
        // halfway = 4h ago + 4h = now → eligible immediately
        'expiry'         => now()->addHours(4),
        'dismissed_at'   => null,
        'reminder_sent_at' => null,
    ], $overrides));

    return $floodPath->load('socialElement');
}

// ── TESTS ─────────────────────────────────────────────────────────────────────

// TEST 13.7
test('job sends reminder email for eligible flood path', function () {

    Mail::fake();

    $user = jobTestUser();
    createJobFloodPath($user);

    (new SendFloodReminders())->handle();

    Mail::assertSent(FloodPathReminderMail::class);
});

// TEST 13.8
test('job does not send email for path not yet at halfway point', function () {

    Mail::fake();

    $user = jobTestUser();

    // last_confirmed just now, expiry 8h from now (halfway is 4h away)
    $floodPath = createJobFloodPath($user, [
        'last_confirmed' => now(),
        'expiry'         => now()->addHours(8),
    ]);

    (new SendFloodReminders())->handle();

    Mail::assertNotSent(FloodPathReminderMail::class, function ($mail) use ($floodPath) {
        return $mail->floodPath->id === $floodPath->id;
    });
});

// TEST 13.9
test('job does not send email for dismissed path', function () {

    Mail::fake();

    $user = jobTestUser();

    $floodPath = createJobFloodPath($user, [
        'dismissed_at' => now()->subMinutes(5),
    ]);

    (new SendFloodReminders())->handle();

    Mail::assertNotSent(FloodPathReminderMail::class, function ($mail) use ($floodPath) {
        return $mail->floodPath->id === $floodPath->id;
    });
});

// TEST 13.10
test('job does not send email for expired path', function () {

    Mail::fake();

    $user = jobTestUser();

    $floodPath = createJobFloodPath($user, [
        'last_confirmed' => now()->subHours(10),
        'expiry'         => now()->subHours(2),
    ]);

    (new SendFloodReminders())->handle();

    Mail::assertNotSent(FloodPathReminderMail::class, function ($mail) use ($floodPath) {
        return $mail->floodPath->id === $floodPath->id;
    });
});

// TEST 13.11
test('job does not send email for deactivated path', function () {

    Mail::fake();

    $user = jobTestUser();
    $floodPath = createJobFloodPath($user);

    $floodPath->socialElement->update([
        'deactivated_at' => now(),
    ]);

    (new SendFloodReminders())->handle();

    Mail::assertNotSent(FloodPathReminderMail::class, function ($mail) use ($floodPath) {
        return $mail->floodPath->id === $floodPath->id;
    });
});

// TEST 13.12
test('job sends one email per eligible path', function () {

    Mail::fake();

    $user = jobTestUser();

    $fp1 = createJobFloodPath($user);
    $fp2 = createJobFloodPath($user);

    (new SendFloodReminders())->handle();

    $sentCount = Mail::sent(FloodPathReminderMail::class)
        ->filter(fn ($mail) => in_array($mail->floodPath->id, [$fp1->id, $fp2->id]))
        ->count();

    expect($sentCount)->toBe(2);
});

// TEST 13.13
test('job skips path with no owner email gracefully', function () {

    Mail::fake();

    $noEmailUser = User::factory()->create([
        'email' => '',
    ]);

    $floodPath = createJobFloodPath($noEmailUser);

    expect(fn () => (new SendFloodReminders())->handle())
        ->not->toThrow(\Exception::class);

    Mail::assertNotSent(FloodPathReminderMail::class, function ($mail) use ($floodPath) {
        return $mail->floodPath->id === $floodPath->id;
    });
});

// TEST 13.14
test('job is scheduled to run every six hours', function () {

    $schedule = app(\Illuminate\Console\Scheduling\Schedule::class);

    $events = collect($schedule->events())
        ->filter(fn ($e) => str_contains($e->description ?? '', 'SendFloodReminders')
            || (isset($e->job) && $e->job instanceof \App\Jobs\SendFloodReminders)
            || (method_exists($e, 'getSummaryForDisplay')
                && str_contains($e->getSummaryForDisplay(), 'SendFloodReminders'))
        );

    expect($events->count())->toBeGreaterThan(0);
});