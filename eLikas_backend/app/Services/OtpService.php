<?php

namespace App\Services;

use App\Models\PhoneNumber;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpService
{
    public function sendOtp(string $phoneNumber, ?string $message = null, int $expiresInMinutes = 10): array
    {
        if (config('services.iprogsms.mock', true)) {
            Log::info('IPROGSMS OTP mock send', ['phone_number' => $phoneNumber]);

            return [
                'success' => true,
                'mock'    => true,
                'message' => 'OTP sent successfully (mock)',
                'data'    => [
                    'otp_code'            => '000000',
                    'otp_code_expires_at' => now()->addMinutes($expiresInMinutes)->toIso8601String(),
                    'otp_code_confirmed'  => false,
                    'phone_number'        => $phoneNumber,
                    'message'             => 'Mock OTP: 000000',
                ],
            ];
        }

        if (empty(config('services.iprogsms.api_token'))) {
            abort(500, 'IPROGSMS_API_TOKEN is not configured.');
        }

        $payload = [
            'api_token'          => config('services.iprogsms.api_token'),
            'phone_number'       => $phoneNumber,
            'expires_in_minutes' => $expiresInMinutes,
        ];

        if ($message) {
            $payload['message'] = $message;
        }

        $response = Http::timeout(15)
            ->asJson()
            ->post(rtrim(config('services.iprogsms.otp_base_url'), '/') . '/otp/send_otp', $payload);

        $body = $response->json();

        if (!$response->successful() || ($body['status'] ?? null) !== 'success') {
            Log::error('IPROGSMS send_otp failed', [
                'phone_number' => $phoneNumber,
                'http_status'  => $response->status(),
                'body'         => $body ?? $response->body(),
            ]);

            return [
                'success' => false,
                'mock'    => false,
                'message' => $body['message'] ?? 'Failed to send OTP.',
                'data'    => null,
                'status'  => $response->status(),
            ];
        }

        return [
            'success' => true,
            'mock'    => false,
            'message' => $body['message'] ?? 'OTP sent successfully',
            'data'    => $body['data'] ?? null,
        ];
    }

    public function verifyOtp(string $phoneNumber, string $otp): array
    {
        if (config('services.iprogsms.mock', true)) {
            Log::info('IPROGSMS OTP mock verify', ['phone_number' => $phoneNumber, 'otp' => $otp]);

            $this->markPhoneVerified($phoneNumber);

            return [
                'success' => true,
                'mock'    => true,
                'message' => 'OTP verified successfully (mock)',
            ];
        }

        if (empty(config('services.iprogsms.api_token'))) {
            abort(500, 'IPROGSMS_API_TOKEN is not configured.');
        }

        $payload = [
            'api_token'    => config('services.iprogsms.api_token'),
            'phone_number' => $phoneNumber,
            'otp'          => $otp,
        ];

        $response = Http::timeout(15)
            ->asJson()
            ->post(rtrim(config('services.iprogsms.otp_base_url'), '/') . '/otp/verify_otp', $payload);

        $body = $response->json();

        if (!$response->successful() || ($body['status'] ?? null) !== 'success') {
            Log::warning('IPROGSMS verify_otp failed', [
                'phone_number' => $phoneNumber,
                'http_status'  => $response->status(),
                'body'         => $body ?? $response->body(),
            ]);

            return [
                'success' => false,
                'mock'    => false,
                'message' => $body['message'] ?? 'OTP verification failed.',
                'status'  => $response->status(),
            ];
        }

        $this->markPhoneVerified($phoneNumber);

        return [
            'success' => true,
            'mock'    => false,
            'message' => $body['message'] ?? 'OTP verified successfully',
        ];
    }

    private function markPhoneVerified(string $phoneNumber): void
    {
        $updated = PhoneNumber::where('phone_no', $phoneNumber)
        ->update(['is_verified' => true]);

        Log::info('markPhoneVerified', [
        'phone_number' => $phoneNumber,
        'rows_updated' => $updated,
        ]);
    }
}
