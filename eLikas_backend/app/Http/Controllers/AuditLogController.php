<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\AuditLogShowResource;
use App\Services\AuditLogQuery;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        try {
            $filter = new AuditLogQuery();
            $auditLogs = $filter->transform(AuditLog::query(), $request)->paginate();
            $auditLogs -> loadMissing('target_table');
            return AuditLogResource::collection($auditLogs);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch audit logs',
                'details' => $e->getMessage()
            ], 500);
        }
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
