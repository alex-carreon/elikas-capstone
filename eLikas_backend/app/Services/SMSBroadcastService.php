<?php

namespace App\Services;

use App\Jobs\SendScheduledSMSBroadcast;
use App\Models\PhoneNumber;
use App\Models\SMSBroadcast;
use App\Models\SMSTemplate;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SMSBroadcastService
{
    public function getRecipientsForLocation(int $locationId): Collection
    {
        return PhoneNumber::with([
                'user.name',
                'user.indivAcc.location',
            ])
            ->whereHas('user', function ($query) use ($locationId) {
                $query->whereNull('deactivated_at')
                    ->whereHas('indivAcc', function ($indivAccQuery) use ($locationId) {
                        $indivAccQuery->where('location_id', $locationId);
                    });
            })
            ->whereNotNull('phone_no')
            ->where('is_verified', true)
            ->get();
    }

    public function getAllUsersForLocation(int $locationId): Collection
    {
        return PhoneNumber::with([
                'user.name',
                'user.indivAcc.location',
            ])
            ->whereHas('user', function ($query) use ($locationId) {
                $query->whereNull('deactivated_at')
                    ->whereHas('indivAcc', function ($indivAccQuery) use ($locationId) {
                        $indivAccQuery->where('location_id', $locationId);
                    });
            })
            ->whereNotNull('phone_no')
            ->get();
    }

    public function createDraft(int $govOpId, int $locationId, string $messageContent, ?string $scheduledFor): SMSBroadcast
    {
        $totalRecipients = $this->getRecipientsForLocation($locationId)->count();

        if ($totalRecipients === 0) {
            abort(422, 'No registered recipients found for your location.');
        }

        return SMSBroadcast::create([
            'sender_id'        => $govOpId,
            'location_id'      => $locationId,
            'message_content'  => $messageContent,
            'status'           => 1,
            'scheduled_for'    => $scheduledFor ?? now(),
            'sent_at'          => null,
            'total_recipients' => $totalRecipients,
        ]);
    }

    public function getHistory(int $locationId, int $limit, array $filters = []): LengthAwarePaginator
    {
        $query = SMSBroadcast::with(['gov_op.user', 'location', 'broadcast_status'])
            ->where('location_id', $locationId);

        if (!empty($filters['id'])) {
            $query->where('id', (int) $filters['id']);
        }

        if (!empty($filters['message_content'])) {
            $query->where('message_content', 'LIKE', '%' . $filters['message_content'] . '%');
        }

        if (!empty($filters['search'])) {
            $query->where('message_content', 'LIKE', '%' . $filters['search'] . '%');
        }

        if (isset($filters['status'])) {
            $query->where('status', (int) $filters['status']);
        }

        if (!empty($filters['state'])) {
            if ($filters['state'] === 'active') {
                $query->where('status', 1);
            } else {
                $query->whereIn('status', [2, 3, 4]);
            }
        }

        return $query->orderByDesc('scheduled_for')->paginate($limit);
    }

    public function sendImmediate(int $govOpId, int $locationId, string $messageContent): array
    {
        $phoneNumbers = $this->getRecipientsForLocation($locationId)
            ->pluck('phone_no')
            ->filter()
            ->unique()
            ->values();

        if ($phoneNumbers->isEmpty()) {
            abort(422, 'No user phone numbers found for this GovOp location.');
        }

        $broadcast = SMSBroadcast::create([
            'sender_id'        => $govOpId,
            'location_id'      => $locationId,
            'message_content'  => $messageContent,
            'status'           => 1,
            'scheduled_for'    => now(),
            'sent_at'          => null,
            'total_recipients' => $phoneNumbers->count(),
        ]);

        return $this->dispatchBroadcastToGateway($broadcast);
    }

    public function scheduleBroadcast(int $govOpId, int $locationId, string $messageContent, string $scheduledFor): array
    {
        $scheduledAt = Carbon::parse($scheduledFor, 'Asia/Manila');
        $scheduledAtUtc = $scheduledAt->copy()->setTimezone('UTC');

        $broadcast = $this->createDraft($govOpId, $locationId, $messageContent, $scheduledAtUtc->toDateTimeString());

        $delaySeconds = now('Asia/Manila')->diffInSeconds($scheduledAt, false);
        $finalDelay = $delaySeconds > 0 ? $delaySeconds : 0;
        SendScheduledSMSBroadcast::dispatch($broadcast->id)->delay($finalDelay);

        return [
            'broadcast'      => $broadcast->fresh(['gov_op.user', 'location', 'broadcast_status']),
            'scheduled_for'  => $scheduledAt->toDateTimeString(),
            'delay_seconds'  => $finalDelay,
        ];
    }

    public function sendScheduledBroadcast(int $broadcastId): array
    {
        $broadcast = SMSBroadcast::find($broadcastId);

        if (!$broadcast) {
            Log::warning('Scheduled SMS broadcast no longer exists.', ['broadcast_id' => $broadcastId]);

            return [
                'broadcast' => null,
                'skipped'   => true,
                'reason'    => 'Broadcast not found.',
            ];
        }

        if ((int) $broadcast->status !== 1) {
            Log::info('Scheduled SMS broadcast skipped because status is no longer pending.', [
                'broadcast_id' => $broadcast->id,
                'status'       => $broadcast->status,
            ]);

            return [
                'broadcast' => $broadcast->fresh(['gov_op.user', 'location', 'broadcast_status']),
                'skipped'   => true,
                'reason'    => 'Broadcast is no longer pending.',
            ];
        }

        return $this->dispatchBroadcastToGateway($broadcast);
    }

    private function dispatchBroadcastToGateway(SMSBroadcast $broadcast): array
    {
        $phoneNumbers = $this->getRecipientsForLocation($broadcast->location_id)
            ->pluck('phone_no')
            ->filter()
            ->unique()
            ->values();

        if ($phoneNumbers->isEmpty()) {
            $broadcast->update(['status' => 3]);
            abort(422, 'No user phone numbers found for this GovOp location.');
        }

        $broadcast->update(['total_recipients' => $phoneNumbers->count()]);

        if (config('services.iprogsms.mock', true)) {
            Log::info('IPROGSMS mock SMS', [
                'broadcast_id' => $broadcast->id,
                'phone_number' => $phoneNumbers->implode(','),
                'message'      => $broadcast->message_content,
            ]);

            $broadcast->update(['status' => 2, 'sent_at' => now()]);

            return [
                'broadcast'        => $broadcast->fresh(['gov_op.user', 'location', 'broadcast_status']),
                'mock'             => true,
                'gateway_response' => null,
            ];
        }

        if (empty(config('services.iprogsms.api_token'))) {
            abort(500, 'IPROGSMS_API_TOKEN is not configured.');
        }

        $payload = [
            'api_token'    => config('services.iprogsms.api_token'),
            'phone_number' => $phoneNumbers->implode(','),
            'message'      => $broadcast->message_content,
            'sms_provider' => (int) config('services.iprogsms.sms_provider', 0),
        ];

        $response = Http::timeout(15)
            ->asForm()
            ->post(rtrim(config('services.iprogsms.base_url'), '/') . '/sms_messages/send_bulk', $payload);

        if (!$response->successful()) {
            $broadcast->update(['status' => 3]);

            Log::error('IPROGSMS immediate send failed', [
                'broadcast_id' => $broadcast->id,
                'http_status'  => $response->status(),
                'body'         => $response->json() ?? $response->body(),
            ]);

            return [
                'broadcast'        => $broadcast->fresh(['gov_op.user', 'location', 'broadcast_status']),
                'mock'             => false,
                'gateway_response' => $response->json(),
                'gateway_status'   => $response->status(),
                'failed'           => true,
            ];
        }

        $broadcast->update(['status' => 2, 'sent_at' => now()]);

        return [
            'broadcast'        => $broadcast->fresh(['gov_op.user', 'location', 'broadcast_status']),
            'mock'             => false,
            'gateway_response' => $response->json(),
            'failed'           => false,
        ];
    }

    public function getBroadcastForSender(int $broadcastId, int $govOpId): ?SMSBroadcast
    {
        return SMSBroadcast::with(['broadcast_status', 'location'])
            ->where('id', $broadcastId)
            ->where('sender_id', $govOpId)
            ->first();
    }

    /**
     * @param int $broadcastId
     * @param int $govOpId
     * @return bool
     */
    public function deleteBroadcast(int $broadcastId, int $govOpId): bool
    {
        $broadcast = SMSBroadcast::where('id', $broadcastId)
            ->where('sender_id', $govOpId)
            ->first();

        if (!$broadcast) {
            return false;
        }

        $broadcast->delete();
        return true;
    }

    public function createTemplate(int $govOpId, string $templateName, string $messageContent): SMSTemplate
    {
        return SMSTemplate::create([
            'optr_id'         => $govOpId,
            'template_name'   => $templateName,
            'message_content' => $messageContent,
            'created_at'      => now(),
        ]);
    }

    public function getTemplatesForOperator(int $govOpId, array $filters = []): Collection
    {
        $query = SMSTemplate::with('gov_op.user')
            ->where('optr_id', $govOpId)
            ->whereNull('deactivated_at');

        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('template_name', 'LIKE', $term)
                    ->orWhere('message_content', 'LIKE', $term);
            });
        }

        if (!empty($filters['name'])) {
            $query->where('template_name', 'LIKE', '%' . $filters['name'] . '%');
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function deleteTemplate(int $templateId, int $govOpId): bool
    {
        $template = SMSTemplate::where('id', $templateId)
            ->where('optr_id', $govOpId)
            ->first();

        if (!$template) {
            return false;
        }

        $template->delete();
        return true;
    }

    public function formatBroadcast(SMSBroadcast $broadcast): array
    {
        $sender = $broadcast->gov_op;

        return [
            'id'               => $broadcast->id,
            'message_content'  => $broadcast->message_content,
            'status'           => [
                'id'   => $broadcast->status,
                'name' => $broadcast->broadcast_status?->status_name ?? 'Unknown',
            ],
            'scheduled_for'    => Carbon::parse($broadcast->scheduled_for)->timezone('Asia/Manila')->toDateTimeString(),
            'sent_at'          => $broadcast->sent_at ? Carbon::parse($broadcast->sent_at)->timezone('Asia/Manila')->toDateTimeString() : null,
            'total_recipients' => $broadcast->total_recipients,
            'sender'           => [
                'govop_id'       => $sender?->id,
                'user_id'        => $sender?->user_id,
                'username'       => $sender?->user?->username,
                'point_person'   => $sender?->point_person,
                'point_position' => $sender?->point_position,
            ],
            'location'         => [
                'id'   => $broadcast->location?->id,
                'name' => $broadcast->location?->name,
            ],
        ];
    }

    public function formatTemplate(SMSTemplate $template): array
    {
        return [
            'id'              => $template->id,
            'template_name'   => $template->template_name,
            'message_content' => $template->message_content,
            'created_at'      => $template->created_at ? Carbon::parse($template->created_at)->timezone('Asia/Manila')->toDateTimeString() : null,
            'created_by'      => [
                'govop_id'    => $template->gov_op?->id,
                'username'    => $template->gov_op?->user?->username,
                'point_person'=> $template->gov_op?->point_person,
            ],
        ];
    }

    public function cancelBroadcast(int $broadcastId, int $govOpId): string
    {
        $broadcast = SMSBroadcast::where('id', $broadcastId)
            ->where('sender_id', $govOpId)
            ->first();

        if (!$broadcast) {
            return 'not_found';
        }

        if ((int) $broadcast->status !== 1) {
            return 'not_pending';
        }

        if ($broadcast->scheduled_for !== null && $broadcast->scheduled_for->lte(now())) {
            return 'window_passed';
        }

    $broadcast->update(['status' => 4]);

    return 'cancelled';
}

    public function getAllBroadcasts(int $limit, array $filters = []): LengthAwarePaginator
    {
        $query = SMSBroadcast::with(['gov_op.user', 'location', 'broadcast_status']);

        if (!empty($filters['search'])) {
            $query->where('message_content', 'LIKE', '%' . $filters['search'] . '%');
        }

        if (isset($filters['status'])) {
            $query->where('status', (int) $filters['status']);
        }

        if (!empty($filters['location_id'])) {
            $query->where('location_id', (int) $filters['location_id']);
        }

        return $query->orderByDesc('scheduled_for')->paginate($limit);
    }
    public function softDeleteTemplate(int $templateId, int $govOpId): bool
    {
        $template = SMSTemplate::where('id', $templateId)
            ->where('gov_op_id', $govOpId)
            ->whereNull('deactivated_at')
            ->first();

        if (!$template) {
            return false;
        }

        $template->update(['deactivated_at' => now()]);

        return true;
    }

}
