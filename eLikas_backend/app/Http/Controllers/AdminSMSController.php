<?php

namespace App\Http\Controllers;

use App\Services\SMSBroadcastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminSMSController extends Controller
{
    public function __construct(private readonly SMSBroadcastService $smsService) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'search'      => 'nullable|string|max:255',
                'status'      => 'nullable|integer|min:1',
                'location_id' => 'nullable|integer|min:1',
                'limit'       => 'nullable|integer|min:1|max:100',
            ]);

            $limit   = min(max((int) ($validated['limit'] ?? 20), 1), 100);
            $filters = array_filter([
                'search'      => $validated['search'] ?? null,
                'status'      => isset($validated['status'])      ? (int) $validated['status']      : null,
                'location_id' => isset($validated['location_id']) ? (int) $validated['location_id'] : null,
            ], fn ($v) => $v !== null);

            $paginated = $this->smsService->getAllBroadcasts($limit, $filters);

            return response()->json([
                'broadcasts' => collect($paginated->items())
                    ->map(fn ($b) => $this->smsService->formatBroadcast($b))
                    ->values(),
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page'    => $paginated->lastPage(),
                    'per_page'     => $paginated->perPage(),
                    'total'        => $paginated->total(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('AdminSMSController@index', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to fetch broadcasts.', 'details' => $e->getMessage()], 500);
        }
    }
}
