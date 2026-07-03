<?php

namespace App\Services;

use App\Models\FloodPath;
use Illuminate\Support\Facades\DB;
use MatanYadaev\EloquentSpatial\Objects\LineString;

class FloodPathIntersectionService
{
    /**
     * Reject if >=5 of the candidate points lie on an existing path.
     */
    public function overlapsExisting(LineString $candidate, ?int $excludeId = null): bool
    {
        $nearby = FloodPath::notExpired()
            ->notDeactivated()
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->whereRaw(
                "ST_Distance(path, ST_GeomFromText(?)) < 0.0002",
                [$candidate->toWkt()]
            )
            ->get();

        if ($nearby->isEmpty()) {
            return false;
        }

        $points = $candidate->getGeometries()->values();

        if ($points->count() == 0) {
            return false;
        }

        foreach ($nearby as $path) {

            $sharedPoints = 0;

            foreach ($points as $point) {

                $distance = DB::table('FloodPaths')
                    ->where('id', $path->id)
                    ->selectRaw(
                        "ST_Distance(
                            path,
                            ST_GeomFromText(?)
                        ) AS d",
                        [
                            sprintf(
                                "POINT(%F %F)",
                                $point->longitude,
                                $point->latitude
                            )
                        ]
                    )
                    ->value('d');

                // Approximately 1 meter.
                if ($distance !== null && $distance <= 0.00001) {
                    $sharedPoints++;
                }
            }

            $ratio = $sharedPoints / $points->count();

            if ($ratio >= 0.05) {
                return true;
            }
        }

        return false;
    }
}