<?php

namespace App\Http\Controllers;

use App\Models\BroadcastStatus;
use App\Services\SMSBroadcastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SMSController extends Controller
{
    public function __construct(private readonly SMSBroadcastService $smsService) {}

    // ── A — GET /api/sms/statuses ────────────────────────────────────────────

    public function statuses(): JsonResponse
    {
        $statuses = BroadcastStatus::orderBy('id')
            ->get(['id', 'status_name'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->status_name])
            ->values();

        return response()->json(['statuses' => $statuses]);
    }

    // ── B-1 — GET /api/sms/broadcasts ───────────────────────────────────────

    public function history(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'status' => 'nullable|integer|in:1,2,3,4',
                'limit'  => 'nullable|integer|min:1|max:100',
                'state'  => 'nullable|string|in:active,inactive',
            ]);

            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $locationId = (int) $request->query('location_id', $govOp->location_id);
            if ($locationId !== (int) $govOp->location_id) {
                return response()->json(
                    ['message' => 'You may only view broadcasts for your own location.'],
                    403
                );
            }

            $limit   = min(max((int) ($validated['limit'] ?? 15), 1), 100);
            $filters = array_filter([
                'search' => $validated['search'] ?? null,
                'status' => isset($validated['status']) ? (int) $validated['status'] : null,
                'state'  => $validated['state'] ?? null,
            ], fn ($v) => $v !== null);

            $paginated = $this->smsService->getHistory($locationId, $limit, $filters);

            return response()->json([
                'location_id' => $locationId,
                'broadcasts'  => collect($paginated->items())
                    ->map(fn ($b) => $this->smsService->formatBroadcast($b))
                    ->values(),
                'pagination'  => [
                    'current_page' => $paginated->currentPage(),
                    'last_page'    => $paginated->lastPage(),
                    'per_page'     => $paginated->perPage(),
                    'total'        => $paginated->total(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SMSController@history', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to fetch broadcast history.', 'details' => $e->getMessage()], 500);
        }
    }

    // ── B-2 — PATCH /api/sms/broadcasts/{broadcastId}/cancel ────────────────

    public function cancel(Request $request, int $broadcastId): JsonResponse
    {
        try {
            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $result = $this->smsService->cancelBroadcast($broadcastId, $govOp->id);

            return match ($result) {
                'not_found' => response()->json(
                    ['message' => 'Broadcast not found or you do not have permission to cancel it.'],
                    404
                ),
                'not_pending' => response()->json(
                    ['message' => 'Only pending or scheduled broadcasts can be cancelled.'],
                    409
                ),
                'window_passed' => response()->json([
                    'message' => 'Validation failed.',
                    'errors'  => [
                        'scheduled_for' => [
                            'The broadcast execution window has already started. Cancellation is no longer possible.',
                        ],
                    ],
                ], 422),
                default => response()->json([
                    'message'      => 'Broadcast cancelled successfully.',
                    'broadcast_id' => $broadcastId,
                    'status'       => ['id' => 4, 'name' => 'Cancelled'],
                ]),
            };
        } catch (\Exception $e) {
            Log::error('SMSController@cancel', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to cancel broadcast.', 'details' => $e->getMessage()], 500);
        }
    }

    // ── D — POST /api/sms/verify-token ──────────────────────────────────────

    public function verifyToken(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'api_token' => 'required|string|min:8|max:255',
            ]);

            if (config('services.iprogsms.mock', true)) {
                return response()->json([
                    'message' => 'Token is valid (mock).',
                    'gateway' => ['http_status' => 200],
                ]);
            }

            $token   = $validated['api_token'];
            $baseUrl = rtrim(config('services.iprogsms.otp_base_url', 'https://sms.iprogtech.com/api/v1'), '/');

            $response = Http::timeout(10)
                ->withHeaders(['Accept' => 'application/json'])
                ->get("{$baseUrl}/otp", ['api_token' => $token]);

            $httpStatus = $response->status();

            if ($response->status() === 401 || $response->status() === 403) {
                return response()->json([
                    'message' => 'Token verification failed. The gateway rejected the provided token.',
                    'gateway' => ['http_status' => $httpStatus],
                ], 401);
            }

            if (!$response->successful()) {
                return response()->json([
                    'message' => 'Gateway probe failed. The iPROG API returned an unexpected error.',
                    'gateway' => [
                        'http_status' => $httpStatus,
                        'body'        => $response->json() ?? $response->body(),
                    ],
                ], 502);
            }

            return response()->json([
                'message' => 'Token is valid.',
                'gateway' => ['http_status' => $httpStatus],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('SMSController@verifyToken – connection failed', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Gateway probe failed. The iPROG API could not be reached.',
                'details' => $e->getMessage(),
            ], 502);
        } catch (\Exception $e) {
            Log::error('SMSController@verifyToken', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Token verification encountered an internal error.', 'details' => $e->getMessage()], 500);
        }
    }

    // ── Existing methods (copy these in exactly as-is) ───────────────────────

    public function recipients(Request $request): JsonResponse
    {
        $govOp = $this->resolveGovOp($request);
        if ($govOp instanceof JsonResponse) {
            return $govOp;
        }

        $recipients = $this->smsService->getRecipientsForLocation($govOp->location_id);

        return response()->json([
            'location_id'      => $govOp->location_id,
            'total_recipients' => $recipients->count(),
            'recipients'       => $recipients->map(fn ($pn) => [
                'user_id'       => $pn->user_id,
                'username'      => $pn->user?->username,
                'first_name'    => $pn->user?->name?->first_name,
                'last_name'     => $pn->user?->name?->last_name,
                'phone_no'      => $pn->phone_no,
                'is_verified'   => (bool) $pn->is_verified,
                'location_id'   => $pn->user?->indivAcc?->location_id,
                'location_name' => $pn->user?->indivAcc?->location?->name,
            ])->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message_content' => 'required|string|max:600',
                'scheduled_for'   => 'nullable|date|after_or_equal:now',
            ]);

            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $broadcast = $this->smsService->createDraft(
                $govOp->id,
                $govOp->location_id,
                $validated['message_content'],
                $validated['scheduled_for'] ?? null,
            );

            return response()->json([
                'message'   => 'SMS draft created successfully.',
                'broadcast' => $this->smsService->formatBroadcast(
                    $broadcast->load(['gov_op.user', 'location', 'broadcast_status'])
                ),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SMSController@store', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to create SMS draft.', 'details' => $e->getMessage()], 500);
        }
    }

    public function sendImmediate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message_content' => 'required|string|max:600',
            ]);

            if ($token = $request->header('X-iPROG-API-Token')) {
                config(['services.iprogsms.api_token' => $token]);
            }

            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $result = $this->smsService->sendImmediate(
                $govOp->id,
                $govOp->location_id,
                $validated['message_content'],
            );

            $formatted = $this->smsService->formatBroadcast($result['broadcast']);
            if ($result['mock']) {
                return response()->json(['message' => 'SMS dispatched in mock mode.', 'broadcast' => $formatted], 202);
            }

            if ($result['failed']) {
                return response()->json([
                    'message'           => 'SMS dispatch failed.',
                    'broadcast'         => $formatted,
                    'iprogsms_status'   => $result['gateway_status'],
                    'iprogsms_response' => $result['gateway_response'],
                ], 502);
            }

            return response()->json([
                'message'           => 'SMS dispatched successfully.',
                'broadcast'         => $formatted,
                'iprogsms_response' => $result['gateway_response'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SMSController@sendImmediate', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to dispatch SMS.', 'details' => $e->getMessage()], 500);
        }
    }

    public function schedule(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message_content' => 'required|string|max:600',
                'scheduled_for'   => 'required|date|after:now',
            ]);

            if ($token = $request->header('X-iPROG-API-Token')) {
                config(['services.iprogsms.api_token' => $token]);
            }

            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $result = $this->smsService->scheduleBroadcast(
                $govOp->id,
                $govOp->location_id,
                $validated['message_content'],
                $validated['scheduled_for'],
            );

            return response()->json([
                'message'   => 'SMS broadcast scheduled successfully.',
                'status'    => [
                    'name' => $result['broadcast']->broadcast_status?->status_name ?? 'Scheduled',
                ],
                'broadcast' => $this->smsService->formatBroadcast($result['broadcast']),
                'queue'     => [
                    'scheduled_for' => $result['scheduled_for'],
                    'delay_seconds' => $result['delay_seconds'],
                ],
            ], 202);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SMSController@schedule', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to schedule SMS broadcast.', 'details' => $e->getMessage()], 500);
        }
    }

    public function status(Request $request, int $broadcastId): JsonResponse
    {
        try {
            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $broadcast = $this->smsService->getBroadcastForSender($broadcastId, $govOp->id);
            if (!$broadcast) {
                return response()->json(['message' => 'Broadcast not found.'], 404);
            }

            return response()->json([
                'broadcast_id'     => $broadcast->id,
                'status_id'        => $broadcast->status,
                'status_name'      => $broadcast->broadcast_status?->status_name ?? 'Unknown',
                'scheduled_for'    => $broadcast->scheduled_for?->timezone('Asia/Manila')->toDateTimeString(),
                'sent_at'          => $broadcast->sent_at?->timezone('Asia/Manila')->toDateTimeString(),
                'total_recipients' => $broadcast->total_recipients,
                'location'         => [
                    'id'   => $broadcast->location?->id,
                    'name' => $broadcast->location?->name,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SMSController@status', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to fetch broadcast status.', 'details' => $e->getMessage()], 500);
        }
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'template_name'   => 'required|string|max:255',
                'message_content' => 'required|string|max:600',
            ]);

            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $template = $this->smsService->createTemplate(
                $govOp->id,
                $validated['template_name'],
                $validated['message_content'],
            );

            return response()->json([
                'message'  => 'SMS template created successfully.',
                'template' => $this->smsService->formatTemplate($template->load('gov_op.user')),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SMSController@storeTemplate', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to create SMS template.', 'details' => $e->getMessage()], 500);
        }
    }

    public function indexTemplates(Request $request): JsonResponse
    {
        try {
            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $filters   = $request->only(['search', 'name']);
            $templates = $this->smsService->getTemplatesForOperator($govOp->id, $filters)
                ->map(fn ($t) => $this->smsService->formatTemplate($t));

            return response()->json(['templates' => $templates, 'total' => $templates->count()]);
        } catch (\Exception $e) {
            Log::error('SMSController@indexTemplates', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to fetch SMS templates.', 'details' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, int $broadcastId): JsonResponse
    {
        try {
            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $deleted = $this->smsService->deleteBroadcast($broadcastId, $govOp->id);
            if (!$deleted) {
                return response()->json(['message' => 'Broadcast not found or you do not have permission to delete it.'], 404);
            }

            return response()->json(['message' => 'Broadcast deleted successfully.', 'broadcast_id' => $broadcastId]);
        } catch (\Exception $e) {
            Log::error('SMSController@destroy', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to delete broadcast.', 'details' => $e->getMessage()], 500);
        }
    }

    public function destroyTemplate(Request $request, int $templateId): JsonResponse
    {
        try {
            $govOp = $this->resolveGovOp($request);
            if ($govOp instanceof JsonResponse) {
                return $govOp;
            }

            $deleted = $this->smsService->deleteTemplate($templateId, $govOp->id);
            if (!$deleted) {
                return response()->json(['message' => 'Template not found or you do not have permission to delete it.'], 404);
            }

            return response()->json(['message' => 'Template deleted successfully.', 'template_id' => $templateId]);
        } catch (\Exception $e) {
            Log::error('SMSController@destroyTemplate', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to delete template.', 'details' => $e->getMessage()], 500);
        }
    }

    private function resolveGovOp(Request $request): \App\Models\GovOp|JsonResponse
    {
        $govOp = $request->attributes->get('firebase_user')?->govOp;
        if (!$govOp) {
            return response()->json(['message' => 'No GovOp profile found for this account.'], 403);
        }

        return $govOp;
    }
}
