<?php

namespace App\Services;

use App\Models\PhoneNumber;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpService
{

private const SMART_PREFIXES = [
        '811', '813',
        '907', '908', '909', '910',
        '912', '913', '914',
        '918', '919', '920', '921',
        '928', '929', '930',
        '938', '939', '940',
        '946', '947', '948', '949', '950', '951',
        '961', '963',
        '968', '969', '970',
        '981', '989',
        '992',
        '998', '999',
    ];

    public function isSmartNumber(string $value): bool
    {
        $normalized = self::normalizePhone($value);

        if ($normalized === null) {
            return false;
        }

        $prefix = substr($normalized, 1, 3);

        return in_array($prefix, self::SMART_PREFIXES, true);
    }

    private static function normalizePhone(string $value): ?string
    {
        $digits = preg_replace('/\D+/', '', $value) ?? '';

        if (str_starts_with($digits, '63') && strlen($digits) === 12) {
            $digits = '0' . substr($digits, 2);
        } elseif (strlen($digits) === 10 && str_starts_with($digits, '9')) {
            $digits = '0' . $digits;
        }

        return preg_match('/^09\d{9}$/', $digits) === 1 ? $digits : null;
    }

    /**
     * Send an OTP to a phone number.
     *
     * @param string      $phoneNumber
     * @param string|null $message           Optional custom SMS message body.
     * @param int         $expiresInMinutes
     * @param string|null $apiToken          Caller-supplied token (overrides env).
     *                                       Required when mock=false and env token is absent.
     */
    public function sendOtp(
        string  $phoneNumber,
        ?string $message = null,
        int     $expiresInMinutes = 10,
        ?string $apiToken = null
    ): array {
        // ── Mock mode: return a fixed OTP without hitting the gateway ──────
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

        // ── Resolve token: caller-supplied → env fallback ──────────────────
        $resolvedToken = $apiToken ?? config('services.iprogsms.api_token');

        if (empty($resolvedToken)) {
            return [
                'success' => false,
                'mock'    => false,
                'message' => 'An iPROG API token is required to send OTPs. Please configure one in your profile.',
                'data'    => null,
            ];
        }

        // ── Live gateway call ──────────────────────────────────────────────
        $payload = [
            'api_token'          => $resolvedToken,
            'phone_number'       => $phoneNumber,
            'expires_in_minutes' => $expiresInMinutes,
        ];

        if ($message) {
            $payload['message'] = $message;
        }

        try {
            $response = Http::timeout(15)
                ->asJson()
                ->post(rtrim(config('services.iprogsms.otp_base_url'), '/') . '/otp/send_otp', $payload);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('IPROGSMS send_otp connection failed', ['phone_number' => $phoneNumber, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'mock'    => false,
                'message' => 'Could not reach the iPROG SMS gateway. Please try again.',
                'data'    => null,
            ];
        }

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

    /**
     * Verify an OTP submitted by the user.
     *
     * @param string      $phoneNumber
     * @param string      $otp
     * @param string|null $apiToken     Caller-supplied token (overrides env).
     */
    public function verifyOtp(
        string  $phoneNumber,
        string  $otp,
        ?string $apiToken = null
    ): array {
        // ── Mock mode: accept any OTP, mark phone verified ─────────────────
        if (config('services.iprogsms.mock', true)) {
            Log::info('IPROGSMS OTP mock verify', ['phone_number' => $phoneNumber, 'otp' => $otp]);
            $this->markPhoneVerified($phoneNumber);

            return [
                'success' => true,
                'mock'    => true,
                'message' => 'OTP verified successfully (mock)',
            ];
        }

        // ── Resolve token ──────────────────────────────────────────────────
        $resolvedToken = $apiToken ?? config('services.iprogsms.api_token');

        if (empty($resolvedToken)) {
            return [
                'success' => false,
                'mock'    => false,
                'message' => 'An iPROG API token is required to verify OTPs. Please configure one in your profile.',
            ];
        }

        // ── Live gateway call ──────────────────────────────────────────────
        $payload = [
            'api_token'    => $resolvedToken,
            'phone_number' => $phoneNumber,
            'otp'          => $otp,
        ];

        try {
            $response = Http::timeout(15)
                ->asJson()
                ->post(rtrim(config('services.iprogsms.otp_base_url'), '/') . '/otp/verify_otp', $payload);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('IPROGSMS verify_otp connection failed', ['phone_number' => $phoneNumber, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'mock'    => false,
                'message' => 'Could not reach the iPROG SMS gateway. Please try again.',
            ];
        }

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
