<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    // ---------------------------------------------------------------
    // POST /feedback
    // ---------------------------------------------------------------
    public function store(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $validated = $request->validate([
                'rating'  => 'required|numeric|min:1|max:5',
                'message' => 'nullable|string|max:1000',
            ]);

            $feedback = Feedback::create([
                'user_id' => $user->id,
                'sent_at' => now(),
                'rating'  => $validated['rating'],
                'message' => $validated['message'] ?? null,
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
    // Query params: id, message, rating, date_from, date_to
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        try {
            $query = Feedback::with('user.role')
                ->orderByDesc('sent_at');


            // Only apply id filter when a positive numeric id is provided
            if ($request->filled('id') && is_numeric($request->query('id')) && (int) $request->query('id') > 0) {
                $query->where('id', (int) $request->query('id'));
            }

            // Apply message filter only when non-empty after trimming
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

            // Apply rating filter only when numeric and within valid range (1-5)
            if ($request->has('rating') && is_numeric($request->query('rating'))) {
                $r = (float) $request->query('rating');
                if ($r >= 1 && $r <= 5) {
                    $query->where('rating', $r);
                }
            }

            if ($request->filled('date_from')) {
                $query->whereDate('sent_at', '>=', $request->query('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('sent_at', '<=', $request->query('date_to'));
            }

            $feedbackList = $query->get()->map(fn($fb) => $this->formatFeedback($fb));

            return response()->json([
                'count'    => $feedbackList->count(),
                'feedback' => $feedbackList,
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
            $query = Feedback::with(['user.name', 'user.role'])->where('id', $id);

            if ($request->filled('message')) {
                $term = '%' . $this->escapeLike((string) $request->query('message')) . '%';
                $query->where('message', 'LIKE', $term);
            }

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
