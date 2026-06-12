<?php

namespace App\Models;

use OwenIt\Auditing\Models\Audit as OwenItAudit;

class AuditLog extends OwenItAudit
{
    const UPDATED_AT = null;

	public function target_table()
	{
		return $this->belongsTo(TargetTable::class, 'target_table_id');
	}

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
