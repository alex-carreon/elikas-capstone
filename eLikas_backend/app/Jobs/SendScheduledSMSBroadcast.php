<?php

namespace App\Jobs;

use App\Models\SMSBroadcast;
use App\Services\SMSBroadcastService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendScheduledSMSBroadcast implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(private readonly int $broadcastId) {}

    public function handle(SMSBroadcastService $smsService): void
    {
        // This guards only against truly unexpected exceptions
        // (e.g. DB errors) so a queue worker crash doesn't retry forever
        // without ever marking the broadcast as failed.
        try {
            $smsService->sendScheduledBroadcast($this->broadcastId);
        } catch (Throwable $e) {
            Log::error('SendScheduledSMSBroadcast@handle unexpected exception', [
                'broadcast_id' => $this->broadcastId,
                'attempt'      => $this->attempts(),
                'error'        => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Called once all retry attempts are exhausted.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error('SendScheduledSMSBroadcast permanently failed', [
            'broadcast_id' => $this->broadcastId,
            'error'        => $exception?->getMessage(),
        ]);

        // status 3 = Failed (matches the convention used elsewhere in
        // SMSBroadcastService for gateway/dispatch failures).
        SMSBroadcast::where('id', $this->broadcastId)->update(['status' => 3]);
    }
}
