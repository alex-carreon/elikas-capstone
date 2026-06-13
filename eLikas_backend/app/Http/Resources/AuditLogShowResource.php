<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogShowResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'logId' => $this->log_id,
            'userType' => $this->user_type,
            'userName' => $this->user?->name
                ? $this->user->name->first_name . ' ' . $this->user->name->last_name
                : 'User ID ' . $this->user_id,
            'activity' => $this->event,
            'table' => $this->target_table?->table_name,
            'targetId' => $this->target_id,
            'oldValues' => $this->old_values,
            'newValues' => $this->new_values,
            'ipAddress' => $this->ip_address,
            'userAgent' => $this->user_agent,
            'actionDate' => $this->created_at
        ];
    }
}
