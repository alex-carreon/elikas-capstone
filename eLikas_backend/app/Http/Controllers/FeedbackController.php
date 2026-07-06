<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Carbon\Carbon;

class FeedbackController extends Controller
{
    // ---------------------------------------------------------------
    // POST /feedback
    // Always creates a new feedback record — no overwrite.
    // ---------------------------------------------------------------
    public function store(Request $request)
    {
        $validated = $request->validate([
                'rating'  => 'required|numeric|min:0.5|max:5',
                'message' => 'nullable|string',
            ]);

        try {
            $user = $request->attributes->get('firebase_user');

            // Round submitted rating to nearest 0.5 before storing
            $cleanRating = $this->roundToHalf((float) $validated['rating']);

            $feedback = Feedback::create([
                'user_id' => $user->id,
                'rating'  => $cleanRating,
                'message' => $validated['message'] ?? null,
                'sent_at' => now(),
            ]);

            return response()->json([
                'message'  => 'Feedback submitted successfully',
                'feedback' => $this->formatFeedback($feedback->load('user')),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to submit feedback',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // GET /admin/feedback
    // Query params: id, message, rating, range, date_from, date_to, role, location_id
    // Also returns: rating_options (clean 0.5-increment distinct list)
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        try {
            $query = Feedback::with('user.role')
                ->orderByDesc('sent_at');

            // --- ID filter ---
            if ($request->filled('id') && is_numeric($request->query('id')) && (int) $request->query('id') > 0) {
                $query->where('id', (int) $request->query('id'));
            }

            // --- Rating filter: match records within ±0.25 of the chosen 0.5 step ---
            if ($request->has('rating') && is_numeric($request->query('rating'))) {
                $r = (float) $request->query('rating');
                if ($r >= 0.5 && $r <= 5) {
                    // Snap the requested value to a clean 0.5 step first
                    $snapped = $this->roundToHalf($r);
                    // Then match any stored rating whose 0.5-rounded value equals that step
                    $query->whereBetween('rating', [
                        max(0.5, $snapped - 0.25),
                        min(5.0, $snapped + 0.249),
                    ]);
                }
            }

            // --- Message keyword filter ---
            if ($request->has('message')) {
                $rawMsg = $request->query('message');
                if (is_string($rawMsg)) {
                    $trimmed = trim($rawMsg);
                    if ($trimmed !== '') {
                        $term = '%' . $this->escapeLike($trimmed) . '%';
                        $query->where('message', 'LIKE', $term);
                    }
                }
            }

            if ($request->filled('range')) {
                switch ($request->query('range')) {
                    case 'today':
                        // Looks back exactly from the start of the current calendar day (12:00 AM) and the week starts on Monday
                        $query->where('sent_at', '>=', Carbon::now()->startOfDay());
                        break;
                    case 'this_week':
                        $query->where('sent_at', '>=', Carbon::now()->startOfWeek());
                        break;
                    case 'past_week':
                        $query->where('sent_at', '>=', Carbon::now()->subDays(7));
                        break;
                    case 'monthly':
                        $query->where('sent_at', '>=', Carbon::now()->subDays(30));
                        break;
                    case 'quarterly':
                        $query->where('sent_at', '>=', Carbon::now()->subDays(180));
                        break;
                }
            } else {
                if ($request->filled('date_from')) {
                    $query->whereDate('sent_at', '>=', $request->query('date_from'));
                }
                if ($request->filled('date_to')) {
                    $query->whereDate('sent_at', '<=', $request->query('date_to'));
                }
            }

            // --- Role filter ---
            if ($request->filled('role')) {
                $roleMap = [
                    'brgy'       => 2,
                    'barangay'   => 2,
                    'brgy_op'    => 2,
                    'govop'      => 2,
                    'indiv'      => 3,
                    'individual' => 3,
                    'user'       => 3,
                ];

                $roleKey = strtolower($request->query('role'));
                $roleId  = $roleMap[$roleKey] ?? null;

                if ($roleId === null) {
                    return response()->json([
                        'error' => 'Invalid role filter. Accepted values: brgy, indiv',
                    ], 422);
                }

                $query->whereHas('user', function ($q) use ($roleId) {
                    $q->where('role_id', $roleId);
                });
            }

            // --- Location filter ---
            if ($request->filled('location_id')) {
                $locationId = (int) $request->query('location_id');

                $query->whereHas('user', function ($q) use ($locationId) {
                    $q->where(function ($q) use ($locationId) {
                        $q->whereHas('govOp', function ($q) use ($locationId) {
                            $q->where('location_id', $locationId);
                        })
                        ->orWhereHas('indivAcc', function ($q) use ($locationId) {
                            $q->where('location_id', $locationId);
                        });
                    });
                });
            }

            $ratingOptions = $this->buildRatingOptions($query);

            // Execute the query to get the final matching feedback dataset
            $feedbackList = $query->get();

            return response()->json([
                'count'          => $feedbackList->count(),
                'rating_options' => $ratingOptions,
                'feedback'       => $feedbackList->map(fn($fb) => $this->formatFeedback($fb)),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch feedback',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // GET /admin/feedback/{id}
    // ---------------------------------------------------------------
    public function show(Request $request, int $id)
    {
        try {
            $query = Feedback::with(['user.role'])->where('id', $id);

            $feedback = $query->first();

            if (!$feedback) {
                return response()->json(['error' => 'Feedback not found'], 404);
            }

            return response()->json([
                'feedback' => $this->formatFeedback($feedback),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch feedback',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // DELETE /admin/feedback/{id}
    // ---------------------------------------------------------------
    public function destroy(int $id)
    {
        try {
            $feedback = Feedback::find($id);

            if (!$feedback) {
                return response()->json(['error' => 'Feedback not found'], 404);
            }

            $feedback->delete();

            return response()->json([
                'message'     => 'Feedback deleted successfully',
                'feedback_id' => $id,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to delete feedback',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // PRIVATE HELPERS
    // ---------------------------------------------------------------

    /**
     * Round a float to the nearest 0.5 increment.
     * e.g. 4.7 → 5.0,  3.2 → 3.0,  3.26 → 3.5
     */
    private function roundToHalf(float $value): float
    {
        return round($value * 2) / 2;
    }

    // ─── ✅ FIXED HERE: Accepts the cloned query builder state
    private function buildRatingOptions($query): array
    {
        // Clone the builder state so we don't accidentally compromise the final ->get() data
        $rawRatings = (clone $query)->pluck('rating');

        $steps = $rawRatings
            ->map(fn($r) => $this->roundToHalf((float) $r))
            ->unique()
            ->sort()
            ->values();

        return $steps->map(fn($step) => [
            'value' => $step,
            'label' => number_format($step, 1),   // e.g. "4.5"
        ])->values()->all();
    }

    private function formatFeedback(Feedback $feedback): array
    {
        $user = $feedback->user;

        return [
            'id'      => $feedback->id,
            'rating'  => $feedback->rating,
            'message' => $feedback->message,
            'sent_at' => $feedback->sent_at
                ? $feedback->sent_at->timezone('Asia/Manila')->format('M d, Y')
                : null,
            'submitted_by' => $user ? [
                'id'       => $user->id,
                'username' => $user->username,
                'role'     => $user->role?->role_name ?? 'Unknown',
            ] : null,
        ];
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
