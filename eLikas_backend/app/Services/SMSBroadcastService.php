<?php

namespace App\Services;

use App\Jobs\SendScheduledSMSBroadcast;
use App\Models\PhoneNumber;
use App\Models\SMSBroadcast;
use App\Models\SMSTemplate;
use App\Models\GovOp;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;


class SMSBroadcastService
{
    public function __construct(private readonly OtpService $otpService) {}

    private function filterSupportedPhoneNumbers(Collection $phoneNumbers): Collection
    {
        return $phoneNumbers
            ->map(function ($phone) {
                $num = trim((string) $phone);

                if ($this->otpService->isSmartNumber($num)) {
                    return null;
                }

                return $num;
            })
            ->filter()
            ->unique()
            ->values();
    }

    public function getRecipientsForLocation(int $locationId): Collection
    {
        return PhoneNumber::with([
                'user',
                'user.name',
                'user.indivAcc.location',
            ])
            ->whereHas('user.indivAcc', function ($query) use ($locationId) {
                $query->where('location_id', $locationId);
            })
            ->where('is_verified', true)
            ->whereNotNull('phone_no')
            ->get();
    }

    /**
     * Return just the count of verified active recipients for a location.
     * Used by the broadcast screen to show recipient analytics before sending.
     */
    public function getRecipientCount(int $locationId): int
    {
        return PhoneNumber::whereHas('user', function ($query) use ($locationId) {
                $query->whereNull('deactivated_at')
                    ->whereHas('indivAcc', function ($q) use ($locationId) {
                        $q->where('location_id', $locationId);
                    });
            })
            ->whereNotNull('phone_no')
            ->where('is_verified', true)
            ->count();
    }

    /**
     * Estimate SMS price before sending.
     *
     * iPROG charges ₱1.00 per SMS per recipient.
     * A single SMS fits 160 characters. Every additional 160-char block
     * is billed as another SMS per recipient.
     *
     * Includes the sender/timestamp header that dispatchBroadcastToGateway
     * actually sends, so the segment count here matches what iPROG bills.
     *
     * @param int        $recipientCount  Number of verified recipients.
     * @param string     $message         The message content to be sent.
     * @param GovOp|null $govOp           Sender, used to size the header. Pass
     *                                    null to estimate on raw message length only.
     * @return array{
     *   recipient_count: int,
     *   message_length: int,
     *   sms_parts: int,
     *   price_per_recipient: float,
     *   estimated_total_price: float,
     *   currency: string
     * }
     */
    public function getEstimatedPrice(int $recipientCount, string $message, ?GovOp $govOp = null): array
    {
        $headerLength   = mb_strlen($this->buildSenderHeader($govOp));
        $messageLength  = $headerLength + mb_strlen($message);
        $smsParts       = max(1, (int) ceil($messageLength / 160));
        $pricePerSms    = 1.00; // ₱1.00 per SMS per recipient (iPROG rate)
        $estimatedTotal = $recipientCount * $smsParts * $pricePerSms;

        return [
            'recipient_count'       => $recipientCount,
            'message_length'        => $messageLength,
            'sms_parts'             => $smsParts,
            'price_per_recipient'   => (float) ($smsParts * $pricePerSms),
            'estimated_total_price' => (float) $estimatedTotal,
            'currency'              => 'PHP',
        ];
    }

    /**
     * Build the "[sender | timestamp]\n" header prepended to every outgoing
     * SMS. Shared by the actual gateway dispatch and the price estimator so
     * the two never disagree on message length.
     */
    private function buildSenderHeader(?GovOp $govOp): string
    {
        $senderName = $govOp?->point_person ?: $govOp?->user?->username ?: 'GovOp';
        $timestamp  = now('Asia/Manila')->format('M j, Y g:i A');

        return "[{$senderName} | {$timestamp}]\n";
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
        $supportedPhoneNumbers = $this->filterSupportedPhoneNumbers(
            $this->getRecipientsForLocation($locationId)->pluck('phone_no')
        );
        $totalRecipients = $supportedPhoneNumbers->count();

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

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (int) $filters['status']);
        }

        elseif (!empty($filters['state'])) {
            if ($filters['state'] === 'active') {
                $query->where('status', 1); // Only Scheduled
            } else {
                $query->whereIn('status', [2, 3, 4]); // Sent, Cancelled, Failed
            }
        }

        return $query->orderByDesc('scheduled_for')->paginate($limit);
    }

    public function sendImmediate(int $govOpId, int $locationId, string $messageContent, ?string $apiToken = null): array
    {
        $phoneNumbers = $this->filterSupportedPhoneNumbers(
            $this->getRecipientsForLocation($locationId)->pluck('phone_no')
        );

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

        return $this->dispatchBroadcastToGateway($broadcast, $apiToken);
    }

    public function scheduleBroadcast(
        int $govOpId,
        int $locationId,
        string $messageContent,
        string $scheduledFor,
        ?string $apiToken = null
    ): array
    {
        $scheduledAt = Carbon::parse($scheduledFor, 'Asia/Manila');
        $scheduledAtUtc = $scheduledAt->copy()->setTimezone('UTC');

        $broadcast = $this->createDraft(
            $govOpId,
            $locationId,
            $messageContent,
            $scheduledAtUtc->toDateTimeString()
        );

        $delaySeconds = now('Asia/Manila')->diffInSeconds($scheduledAt, false);
        $finalDelay = $delaySeconds > 0 ? $delaySeconds : 0;
        SendScheduledSMSBroadcast::dispatch($broadcast->id, $apiToken)->delay($finalDelay);

        return [
            'broadcast'      => $broadcast->fresh(['gov_op.user', 'location', 'broadcast_status']),
            'scheduled_for'  => $scheduledAt->toDateTimeString(),
            'delay_seconds'  => $finalDelay,
        ];
    }

    public function sendScheduledBroadcast(int $broadcastId, ?string $apiToken = null): array
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

        $result = $this->dispatchBroadcastToGateway($broadcast, $apiToken);

        if ($result['failed'] ?? false) {
            throw new RuntimeException($result['gateway_message'] ?? 'Scheduled SMS broadcast failed.');
        }

        return $result;
    }

    private function dispatchBroadcastToGateway(SMSBroadcast $broadcast, ?string $apiToken = null): array
    {
        $phoneNumbers = $this->filterSupportedPhoneNumbers(
            $this->getRecipientsForLocation($broadcast->location_id)->pluck('phone_no')
        );

        $formattedPhoneNumbers = $phoneNumbers
            ->map(function ($phone) {
                $num = trim((string) $phone);

                if (str_starts_with($num, '63')) {
                    $num = '0' . substr($num, 2);
                } elseif (!str_starts_with($num, '0')) {
                    $num = '0' . $num;
                }

                return $num;
            })
            ->filter()
            ->unique()
            ->values();

        if ($formattedPhoneNumbers->isEmpty()) {
            $broadcast->update(['status' => 4]);
            abort(422, 'No user phone numbers found for this GovOp location.');
        }

        $broadcast->update(['total_recipients' => $formattedPhoneNumbers->count()]);

        $resolvedToken = $apiToken ?: config('services.iprogsms.api_token');
        if (empty($resolvedToken)) {
            $broadcast->update(['status' => 4]);

            return [
                'broadcast'         => $broadcast,
                'failed'            => true,
                'error_code'        => 'MISSING_TOKEN',
                'gateway_message'   => 'No API token provided.',
                'gateway_response'  => [
                    'message' => 'Missing api token configuration.',
                ],
            ];
        }

        $outgoingMessage = $this->buildOutgoingMessage($broadcast);

        $payload = [
            'phone_number' => $formattedPhoneNumbers->implode(','),
            'message'      => $outgoingMessage,
        ];

        Log::info('IPROGSMS bulk payload debug', [
            'broadcast_id'   => $broadcast->id,
            'phone_number'   => $payload['phone_number'],
            'message_length' => mb_strlen($outgoingMessage),
        ]);

        try {
            $response = Http::timeout(15)
                ->withoutVerifying()
                ->withHeaders([
                    'X-IPROG-API-TOKEN' => $resolvedToken, // Keep header just in case
                    'Accept'            => 'application/json',
                ])
                ->acceptJson()
                ->asJson()
                ->post(rtrim(config('services.iprogsms.base_url'), '/') . '/sms_messages/send_bulk', [
                    'api_token'     => $resolvedToken,
                    'phone_numbers' => $payload['phone_number'],
                    'phone_number'  => $payload['phone_number'],
                    'message'       => $outgoingMessage,
                ]);
        } catch (ConnectionException $e) {
            $broadcast->update(['status' => 4]);

            return [
                'failed'           => true,
                'error_code'       => 'GATEWAY_CONNECTION_FAILED',
                'gateway_message'  => 'Could not reach the IPROGSMS gateway.',
                'gateway_response' => [
                    'message' => 'Invalid api token or no load balance',
                ],
            ];
        }

        $responseBody = $response->json() ?? ['raw' => $response->body()];
        $classified = $this->classifyGatewayResponse($response->status(), $responseBody);

        if ($classified['failed']) {
            $broadcast->update(['status' => 4]);

            return ['failed' => true, 'gateway_response' => $responseBody];
        }

        $broadcast->update(['status' => 2, 'sent_at' => now()]);

        return [
            'broadcast'        => $broadcast->fresh(['gov_op.user', 'location', 'broadcast_status']),
            'gateway_response' => $responseBody,
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
        $query = SMSTemplate::where('optr_id', $govOpId);

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
        $sender = $broadcast->relationLoaded('gov_op')
            ? $broadcast->gov_op
            : $broadcast->load('gov_op.user')->gov_op;

        // 1. Parse the timestamps safely
        $scheduledFor = $broadcast->scheduled_for
            ? Carbon::parse($broadcast->scheduled_for)->timezone('Asia/Manila')->toDateTimeString()
            : null;

        $sentAt = $broadcast->sent_at
            ? Carbon::parse($broadcast->sent_at)->timezone('Asia/Manila')->toDateTimeString()
            : null;

        $updatedAt = $broadcast->updated_at
            ? Carbon::parse($broadcast->updated_at)->timezone('Asia/Manila')->toDateTimeString()
            : null;

        // 2. Generate a dynamic, fallback-safe display date based on status ID
        $displayDate = match ((int) $broadcast->status) {
            1 => $scheduledFor ? "Sending on: " . Carbon::parse($scheduledFor)->format('M j, Y g:i A') : "Scheduled",
            2 => $sentAt ? "Sent on: " . Carbon::parse($sentAt)->format('M j, Y g:i A') : "Sent",
            3 => "Cancelled",
            4 => "Failed to send",
            default => "Unknown state",
        };

        return [
            'id'               => $broadcast->id,
            'message_content'  => $broadcast->message_content,
            'status'           => [
                'id'   => $broadcast->status,
                'name' => $broadcast->broadcast_status?->status_name ?? 'Unknown',
            ],
            'scheduled_for'    => $scheduledFor,
            'sent_at'          => $sentAt,
            'display_date'     => $displayDate,
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

    $broadcast->update(['status' => 3]);

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

    private function buildOutgoingMessage(SMSBroadcast $broadcast): string
    {
        if (!$broadcast->relationLoaded('gov_op')) {
            $broadcast->load('gov_op.user');
        }

        return $this->buildSenderHeader($broadcast->gov_op) . $broadcast->message_content;
    }

    private function classifyGatewayResponse(int $httpStatus, array $body): array
    {
        $bodyStatus  = $body['status']  ?? null;
        $bodyMessage = $body['message'] ?? '';

        // ── Normalize message to lowercase for keyword matching ───────────────
        $lowerMessage = strtolower($bodyMessage);

        // ── Success ───────────────────────────────────────────────────────────
        if ($httpStatus >= 200 && $httpStatus < 300) {
            $messageIds = trim((string) ($body['message_ids'] ?? ''));
            $looksSuccessful = (
                $bodyStatus === 'success'
                || $bodyStatus === true
                || (int) $bodyStatus === 200
                || ($body['success'] ?? false) === true
                || str_contains($lowerMessage, 'successfully')
                || str_contains($lowerMessage, 'added to the queue')
                || str_contains($lowerMessage, 'processed shortly')
            );

            if ($looksSuccessful) {
                return ['failed' => false, 'error_code' => null, 'message' => null];
            }
        }

        // ── Invalid / missing token ───────────────────────────────────────────
        if (
            in_array($httpStatus, [401, 403], true)
            || str_contains($lowerMessage, 'unauthenticated')
            || str_contains($lowerMessage, 'unauthorized')
            || str_contains($lowerMessage, 'invalid token')
            || str_contains($lowerMessage, 'invalid api token')
            || str_contains($lowerMessage, 'token')  && $bodyStatus === 'error'
        ) {
            return [
                'failed'     => true,
                'error_code' => 'INVALID_TOKEN',
                'message'    => 'The iPROG API token is invalid or has insufficient funds. Please re-enter your token or top up your account.',
            ];
        }

        // ── Insufficient balance ──────────────────────────────────────────────
        if (
            str_contains($lowerMessage, 'insufficient balance')
            || str_contains($lowerMessage, 'insufficient credit')
            || str_contains($lowerMessage, 'not enough balance')
            || str_contains($lowerMessage, 'no balance')
            || str_contains($lowerMessage, 'low balance')
        ) {
            return [
                'failed'     => true,
                'error_code' => 'INSUFFICIENT_BALANCE',
                'message'    => 'Your iPROG account has insufficient balance to send this broadcast. Please top up your account.',
            ];
        }

        // ── No valid recipients ───────────────────────────────────────────────
        if (
            str_contains($lowerMessage, 'no recipient')
            || str_contains($lowerMessage, 'invalid phone')
            || str_contains($lowerMessage, 'invalid number')
            || str_contains($lowerMessage, 'no valid')
        ) {
            return [
                'failed'     => true,
                'error_code' => 'INVALID_RECIPIENTS',
                'message'    => 'No valid recipient phone numbers were accepted by the gateway.',
            ];
        }

        // ── Gateway server error ──────────────────────────────────────────────
        if ($httpStatus >= 500) {
            return [
                'failed'     => true,
                'error_code' => 'GATEWAY_ERROR',
                'message'    => 'The iPROG SMS gateway encountered an internal error. Please try again later.',
            ];
        }

        // ── Generic / unknown error ───────────────────────────────────────────
        if ($bodyStatus === 'error' || $bodyStatus === 'failed' || $httpStatus >= 400) {
            return [
                'failed'     => true,
                'error_code' => 'BROADCAST_FAILED',
                'message'    => $bodyMessage ?: 'The SMS broadcast failed. Please check your iPROG account and try again.',
            ];
        }

        // ── Ambiguous 200 with no clear success indicator — treat as failed ───
        return [
            'failed'     => true,
            'error_code' => 'UNKNOWN_RESPONSE',
            'message'    => 'Received an unexpected response from the iPROG gateway. Please try again.',
        ];
    }


}
