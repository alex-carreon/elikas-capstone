<?php

namespace App\Jobs;

use App\Models\SMSBroadcast;
use App\Services\SMSBroadcastService;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendScheduledSMSBroadcast implements ShouldQueue, ShouldBeEncrypted
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        private readonly int $broadcastId,
        private readonly ?string $apiToken = null
    ) {}

    public function handle(SMSBroadcastService $smsService): void
    {
        // This guards only against truly unexpected exceptions
        // (e.g. DB errors) so a queue worker crash doesn't retry forever
        // without ever marking the broadcast as failed.
        try {
            $smsService->sendScheduledBroadcast($this->broadcastId, $this->apiToken);
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

        // status 4 = Failed (3 = Cancelled). Mark broadcast as failed
        // since all retry attempts have been exhausted.
        SMSBroadcast::where('id', $this->broadcastId)->update(['status' => 4]);
    }
}
