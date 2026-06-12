<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\AuditLogShowResource;

class AuditLogController extends Controller
{
    public function index()
    {
        $auditLogs = AuditLog::all()->loadMissing('target_table');
        return AuditLogResource::collection($auditLogs);
    }

    public function show(AuditLog $auditLog)
    {
        try {
            $auditLog->loadMissing('target_table');
            return new AuditLogShowResource($auditLog);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch audit log details',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
