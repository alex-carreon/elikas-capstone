<?php

namespace App\AuditResolvers;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Contracts\Resolver;
use App\Models\TargetTable;

class TargetTableResolver implements Resolver
{
    public static function resolve(Auditable $auditable)
    {
        if ($auditable instanceof Model) {
            $tableName = $auditable->getTable();
            $targetTableId = TargetTable::where('table_name', $tableName)->value('id');
            return $targetTableId ? (int) $targetTableId : null;
        }

        return null;
    }
}
