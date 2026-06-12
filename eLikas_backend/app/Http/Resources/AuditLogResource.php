<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
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
            'userType' => $this->user_type,
            'userName' => $this->user ? $this->user->name->first_name . ' ' . $this->user->name->last_name : $this->user_id,
            'activity' => $this->event,
            'table' => $this->target_table?->table_name,
            'actionDate' => $this->created_at
        ];
    }
}
