<?php

namespace App\Services;

use App\Models\BroadcastStatus;
use App\Models\Location;
use App\Models\PhoneNumber;
use App\Models\SMSBroadcast;
use Carbon\Carbon;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
            ->get();
    }

    public function allowedTargetLocationIds(int $govOpLocationId, array $requestedLocationIds = []): array
    {
        $requestedLocationIds = collect($requestedLocationIds)
            ->filter(fn ($id) => is_numeric($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($requestedLocationIds->isEmpty()) {
            return [$govOpLocationId];
        }

        $allowedIds = Location::query()
            ->where(function ($query) use ($govOpLocationId) {
                $query->where('id', $govOpLocationId)
                    ->orWhere('parent_id', $govOpLocationId);
            })
            ->whereIn('id', $requestedLocationIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if (count($allowedIds) !== $requestedLocationIds->count()) {
            throw ValidationException::withMessages([
                'target_location_ids' => ['One or more selected target locations are outside this GovOp location scope.'],
            ]);
        }

        return $allowedIds;
    }

    public function createDraftBroadcasts(array $data, int $senderId, int $govOpLocationId): Collection
    {
        $targetLocationIds = $this->allowedTargetLocationIds(
            $govOpLocationId,
            $this->extractTargetLocationIds($data)
        );

        $draftStatusId = $this->statusId('draft');

        return collect($targetLocationIds)->map(function (int $locationId) use ($data, $senderId, $draftStatusId) {
            $recipientCount = $this->getRecipientsForLocation($locationId)
                ->pluck('phone_no')
                ->filter()
                ->unique()
                ->count();

            return SMSBroadcast::create([
                'sender_id' => $senderId,
                'location_id' => $locationId,
                'message_content' => $data['message_content'],
                'status' => $draftStatusId,
                'scheduled_for' => now(),
                'sent_at' => null,
                'total_recipients' => $recipientCount,
            ])->load(['location', 'broadcast_status']);
        });
    }

    public function history(array $filters, int $senderId)
    {
        $limit = min(max((int) ($filters['limit'] ?? 15), 1), 100);

        $query = SMSBroadcast::with([
                'location',
                'broadcast_status',
                'gov_op.user.name',
            ])
            ->where('sender_id', $senderId)
            ->orderByDesc('scheduled_for')
            ->orderByDesc('id');

        if (!empty($filters['zone_id'])) {
            $query->where('location_id', (int) $filters['zone_id']);
        }

        if (!empty($filters['location_id'])) {
            $query->where('location_id', (int) $filters['location_id']);
        }

        if (!empty($filters['status'])) {
            $query->whereHas('broadcast_status', function ($statusQuery) use ($filters) {
                $statusQuery->where('status_name', $filters['status']);
            });
        }

        if (!empty($filters['date_from'])) {
            $query->where('scheduled_for', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (!empty($filters['date_to'])) {
            $query->where('scheduled_for', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        return $query->paginate($limit);
    }

    public function dispatchBroadcast(SMSBroadcast $broadcast): array
    {
        $phoneNumbers = $this->getRecipientsForLocation($broadcast->location_id)
            ->pluck('phone_no')
            ->filter()
            ->unique()
            ->values();

        if ($phoneNumbers->isEmpty()) {
            $broadcast->update([
                'status' => $this->statusId('failed'),
                'total_recipients' => 0,
            ]);

            throw ValidationException::withMessages([
                'recipients' => ['No user phone numbers found for the selected broadcast location.'],
            ]);
        }

        $broadcast->update([
            'total_recipients' => $phoneNumbers->count(),
        ]);

        $payload = [
            'api_token' => config('services.iprogsms.api_token'),
            'phone_number' => $phoneNumbers->implode(','),
            'message' => $broadcast->message_content,
            'sms_provider' => (int) config('services.iprogsms.sms_provider', 0),
        ];

        if (config('services.iprogsms.mock', true)) {
            Log::info('IPROGSMS mock SMS broadcast', [
                'broadcast_id' => $broadcast->id,
                'phone_number' => $payload['phone_number'],
                'message' => $payload['message'],
            ]);

            $broadcast->update([
                'status' => $this->statusId('sent'),
                'sent_at' => now(),
            ]);

            return [
                'provider' => 'iprogsms',
                'mock' => true,
                'response' => [
                    'message' => 'SMS broadcast logged in mock mode.',
                ],
            ];
        }

        if (empty($payload['api_token'])) {
            $broadcast->update([
                'status' => $this->statusId('failed'),
            ]);

            throw ValidationException::withMessages([
                'iprogsms_api_token' => ['IPROGSMS_API_TOKEN is not configured.'],
            ]);
        }

        $response = Http::timeout(15)
            ->asForm()
            ->post(rtrim(config('services.iprogsms.base_url'), '/') . '/sms_messages/send_bulk', $payload);

        if (!$response->successful()) {
            $this->markProviderFailure($broadcast, $response);

            return [
                'provider' => 'iprogsms',
                'mock' => false,
                'failed' => true,
                'status' => $response->status(),
                'response' => $response->json() ?? $response->body(),
            ];
        }

        $broadcast->update([
            'status' => $this->statusId('sent'),
            'sent_at' => now(),
        ]);

        return [
            'provider' => 'iprogsms',
            'mock' => false,
            'status' => $response->status(),
            'response' => $response->json() ?? $response->body(),
        ];
    }

    public function deliverySummary(SMSBroadcast $broadcast): array
    {
        $statusName = strtolower((string) $broadcast->broadcast_status?->status_name);
        $total = (int) $broadcast->total_recipients;

        $sent = 0;
        $failed = 0;
        $pending = $total;

        if ($broadcast->sent_at || $statusName === 'sent') {
            $sent = $total;
            $pending = 0;
        } elseif ($statusName === 'failed') {
            $failed = $total;
            $pending = 0;
        }

        return [
            'total_recipients' => $total,
            'pending' => $pending,
            'sent' => $sent,
            'failed' => $failed,
        ];
    }

    public function formatBroadcast(SMSBroadcast $broadcast): array
    {
        $broadcast->loadMissing(['location', 'broadcast_status', 'gov_op.user.name']);

        return [
            'id' => $broadcast->id,
            'sender_id' => $broadcast->sender_id,
            'sender' => [
                'gov_op_id' => $broadcast->gov_op?->id,
                'user_id' => $broadcast->gov_op?->user_id,
                'username' => $broadcast->gov_op?->user?->username,
                'point_person' => $broadcast->gov_op?->point_person,
                'point_position' => $broadcast->gov_op?->point_position,
            ],
            'location_id' => $broadcast->location_id,
            'location_name' => $broadcast->location?->name,
            'message_content' => $broadcast->message_content,
            'status' => [
                'id' => $broadcast->status,
                'name' => $broadcast->broadcast_status?->status_name,
            ],
            'scheduled_for' => optional($broadcast->scheduled_for)->toIso8601String(),
            'sent_at' => optional($broadcast->sent_at)->toIso8601String(),
            'total_recipients' => $broadcast->total_recipients,
            'delivery' => $this->deliverySummary($broadcast),
        ];
    }

    public function extractTargetLocationIds(array $data): array
    {
        $ids = $data['target_location_ids']
            ?? $data['target_area_ids']
            ?? $data['zone_ids']
            ?? $data['location_ids']
            ?? null;

        if ($ids === null && !empty($data['location_id'])) {
            $ids = [$data['location_id']];
        }

        return is_array($ids) ? $ids : [];
    }

    public function statusId(string $statusName): int
    {
        $normalizedStatusName = strtolower($statusName);

        $status = BroadcastStatus::query()
            ->whereRaw('LOWER(status_name) = ?', [$normalizedStatusName])
            ->first();

        if ($status) {
            return (int) $status->id;
        }

        $createdStatus = BroadcastStatus::create([
            'status_name' => $normalizedStatusName,
        ]);

        return (int) $createdStatus->id;
    }

    private function markProviderFailure(SMSBroadcast $broadcast, Response $response): void
    {
        Log::error('IPROGSMS send failed', [
            'broadcast_id' => $broadcast->id,
            'status' => $response->status(),
            'body' => $response->json() ?? $response->body(),
        ]);

        $broadcast->update([
            'status' => $this->statusId('failed'),
        ]);
    }
}
