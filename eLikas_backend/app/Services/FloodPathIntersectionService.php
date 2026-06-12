<?php

// FloodPathIntersectionService.php

namespace App\Services;

use App\Models\FloodPath;
use MatanYadaev\EloquentSpatial\Objects\LineString;

class FloodPathIntersectionService
{
    public function overlapsExisting(LineString $candidate, ?int $excludeId = null): bool
    {
        return FloodPath::notExpired()
            ->notDeactivated()
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->whereRaw("ST_Distance(path, ST_GeomFromText(?)) < 0.00005", [$candidate->toWkt()])
            ->exists();
    }
}

