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
        try {

            $broadcast = SMSBroadcast::find($this->broadcastId);

            if (!$broadcast || $broadcast->status === 3) {
                return;
            }

            $result = $smsService->sendScheduledBroadcast($this->broadcastId, $this->apiToken);

            if (is_array($result) && (isset($result['failed']) && $result['failed'])) {
                throw new \Exception($result['message'] ?? 'Gateway dispatch failed.');
            }

        } catch (Throwable $e) {
            Log::error('SendScheduledSMSBroadcast@handle execution failed', [
                'broadcast_id' => $this->broadcastId,
                'attempt'      => $this->attempts(),
                'error'        => $e->getMessage(),
            ]);

            // Re-throw the exception so Laravel knows the job failed and can retry or fail.
            throw $e;
        }
    }

    /**
     * Called once all retry attempts are exhausted or a fatal error occurs.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error('SendScheduledSMSBroadcast permanently failed', [
            'broadcast_id' => $this->broadcastId,
            'error'        => $exception?->getMessage(),
        ]);

        // status 4 = Failed. Mark broadcast as failed in the database.
        SMSBroadcast::where('id', $this->broadcastId)->update(['status' => 4]);
    }
}
