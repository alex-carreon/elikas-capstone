<?php

namespace App\Jobs;

use App\Services\SMSBroadcastService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendScheduledSMSBroadcast implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(private readonly int $broadcastId) {}

    public function handle(SMSBroadcastService $smsService): void
    {
        $smsService->sendScheduledBroadcast($this->broadcastId);
    }
}
