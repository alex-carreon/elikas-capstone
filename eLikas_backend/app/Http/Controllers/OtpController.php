<?php

namespace App\Http\Controllers;

use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OtpController extends Controller
{
    public function __construct(private readonly OtpService $otpService) {}

    public function send(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'phone_number'       => 'required|string',
                'message'            => 'nullable|string|max:600',
                'expires_in_minutes' => 'nullable|integer|min:1|max:60',
            ]);

            $apiToken = $request->header('X-iPROG-API-Token') ?: null;

            $result = $this->otpService->sendOtp(
                $validated['phone_number'],
                $validated['message'] ?? null,
                $validated['expires_in_minutes'] ?? 10,
                $apiToken,
            );

            if (!$result['success']) {
                return response()->json([
                    'message' => $result['message'],
                    'debug'   => $result,
                ], 502);
            }

            return response()->json([
                'message' => $result['message'],
                'data'    => $result['data'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('OtpController@send', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to send OTP.', 'details' => $e->getMessage()], 500);
        }
    }

    public function verify(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'phone_number' => 'required|string',
                'otp'          => 'required|string',
            ]);

            // Accept a per-request token from the header
            $apiToken = $request->header('X-iPROG-API-Token') ?: null;

            $result = $this->otpService->verifyOtp(
                $validated['phone_number'],
                $validated['otp'],
                $apiToken,
            );

            if (!$result['success']) {
                return response()->json([
                    'message' => $result['message'],
                ], 422);
            }

            return response()->json([
                'message'     => $result['message'],
                'is_verified' => true,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('OtpController@verify', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to verify OTP.', 'details' => $e->getMessage()], 500);
        }
    }
}
