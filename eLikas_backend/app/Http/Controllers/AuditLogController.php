<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Http\Resources\AuditLogResource;

class AuditLogController extends Controller
{
    public function index()
    {
        $auditLogs = AuditLog::all()->loadMissing('target_table');
        return AuditLogResource::collection($auditLogs);
    }
}
