<?php

namespace App\Http\Controllers;

use App\Models\PhoneNumber;
use App\Models\SMSBroadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SMSController extends Controller
{
    public function recipients(Request $request)
    {
        $user = $request->get('firebase_user');
        $govOp = $user?->govOp;

        if (!$govOp) {
            return response()->json([
                'message' => 'No GovOp profile found for this account'
            ], 403);
        }

        $recipients = $this->getRecipientsForLocation($govOp->location_id);

        return response()->json([
            'location_id' => $govOp->location_id,
            'total_recipients' => $recipients->count(),
            'recipients' => $recipients->map(function ($phoneNumber) {
                return [
                    'user_id' => $phoneNumber->user_id,
                    'username' => $phoneNumber->user?->username,
                    'first_name' => $phoneNumber->user?->name?->first_name,
                    'last_name' => $phoneNumber->user?->name?->last_name,
                    'phone_no' => $phoneNumber->phone_no,
                    'location_id' => $phoneNumber->user?->indivAcc?->location_id,
                    'location_name' => $phoneNumber->user?->indivAcc?->location?->name,
                ];
            })->values(),
        ]);
    }

    public function sendBroadcast(Request $request)
    {
        $request->validate([
            'message_content' => 'required|string|max:600',
        ]);

        $user = $request->get('firebase_user');
        $govOp = $user?->govOp;

        if (!$govOp) {
            return response()->json([
                'message' => 'No GovOp profile found for this account'
            ], 403);
        }

        $targetLocationId = $govOp->location_id;

        $phoneNumbers = $this->getRecipientsForLocation($targetLocationId)
            ->pluck('phone_no')
            ->filter()
            ->unique()
            ->values();

        if ($phoneNumbers->isEmpty()) {
            return response()->json([
                'message' => 'No user phone numbers found for this GovOp location.'
            ], 422);
        }

        $broadcast = SMSBroadcast::create([
            'sender_id' => $govOp->id,
            'location_id' => $targetLocationId,
            'message_content' => $request->message_content,
            'status' => (int) config('services.iprogsms.default_status', 1),
            'scheduled_for' => now(),
            'total_recipients' => $phoneNumbers->count(),
        ]);

        $payload = [
            'api_token' => config('services.iprogsms.api_token'),
            'phone_number' => $phoneNumbers->implode(','),
            'message' => $request->message_content,
        ];

        $payload['sms_provider'] = (int) config('services.iprogsms.sms_provider', 0);

        if (config('services.iprogsms.mock', true)) {
            Log::info('IPROGSMS mock SMS broadcast', [
                'broadcast_id' => $broadcast->id,
                'phone_number' => $payload['phone_number'],
                'message' => $payload['message'],
            ]);

            return response()->json([
                'message' => 'SMS broadcast logged in mock mode.',
                'broadcast_id' => $broadcast->id,
                'total_recipients' => $broadcast->total_recipients,
            ], 202);
        }

        if (empty($payload['api_token'])) {
            return response()->json([
                'message' => 'IPROGSMS_API_TOKEN is not configured.'
            ], 500);
        }

        $response = Http::timeout(15)
            ->asForm()
            ->post(rtrim(config('services.iprogsms.base_url'), '/') . '/sms_messages/send_bulk', $payload);

        if (!$response->successful()) {
            Log::error('IPROGSMS send failed', [
                'broadcast_id' => $broadcast->id,
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);

            return response()->json([
                'message' => 'SMS broadcast failed to send.',
                'broadcast_id' => $broadcast->id,
                'iprogsms_status' => $response->status(),
                'iprogsms_response' => $response->json(),
            ], 502);
        }

        $broadcast->update(['sent_at' => now()]);

        return response()->json([
            'message' => 'SMS broadcast queued through iProgSMS.',
            'broadcast_id' => $broadcast->id,
            'total_recipients' => $broadcast->total_recipients,
            'iprogsms_response' => $response->json(),
        ], 200);
    }

    private function getRecipientsForLocation(int $locationId)
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
}
