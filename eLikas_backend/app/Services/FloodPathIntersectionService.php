<?php

namespace App\Services;

use App\Models\FloodPath;
use MatanYadaev\EloquentSpatial\Objects\LineString;

class FloodPathIntersectionService
{
    /**
     * Two vertices are considered "the same point" if within this many meters.
     */
    private const POINT_TOLERANCE_METERS = 5.0;

    /**
     * Reject the candidate if the overlapping length is at least this
     * fraction of the candidate's total length.
     */
    private const OVERLAP_LENGTH_RATIO = 0.15;

    /**
     * Coarse bounding-box buffer (meters) used only for the DB prefilter.
     */
    private const PREFILTER_BUFFER_METERS = 50.0;

    /**
     * Determine whether the candidate route overlaps an existing active
     * flood path by at least OVERLAP_LENGTH_RATIO of its own length.
     */
    public function overlapsExisting(LineString $candidate, ?int $excludeId = null): bool
    {
        $points = $candidate->getGeometries()->values();

        if ($points->count() < 2) {
            return false;
        }

        $nearby = $this->fetchNearbyPaths($candidate, $excludeId);

        if ($nearby->isEmpty()) {
            return false;
        }

        $totalLength = $this->routeLengthMeters($points);

        if ($totalLength <= 0) {
            return false;
        }

        foreach ($nearby as $path) {
            $otherPoints = $path->path->getGeometries()->values();

            if ($otherPoints->count() === 0) {
                continue;
            }

            $overlapLength = $this->overlapLengthMeters($points, $otherPoints);
            $ratio = $overlapLength / $totalLength;

            if ($ratio >= self::OVERLAP_LENGTH_RATIO) {
                return true;
            }
        }

        return false;
    }

    /**
     * Coarse DB-side prefilter using a buffered bounding box.
     */
    private function fetchNearbyPaths(LineString $candidate, ?int $excludeId)
    {
        [$minLat, $minLon, $maxLat, $maxLon] = $this->boundingBox(
            $candidate->getGeometries()->values(),
            self::PREFILTER_BUFFER_METERS
        );

        $envelopeWkt = sprintf(
            'POLYGON((%F %F, %F %F, %F %F, %F %F, %F %F))',
            $minLon, $minLat,
            $maxLon, $minLat,
            $maxLon, $maxLat,
            $minLon, $maxLat,
            $minLon, $minLat
        );

        return FloodPath::notExpired()
            ->notDeactivated()
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->whereRaw(
                'MBRIntersects(path, ST_GeomFromText(?, 4326))',
                [$envelopeWkt]
            )
            ->get();
    }

    /**
     * Sum of segment lengths (in meters) whose BOTH endpoints lie within
     * tolerance of some vertex on the other path. This approximates the
     * physically-overlapping length rather than counting vertices, so a
     * route that merely crosses another (touching it at one junction)
     * doesn't get flagged the way a vertex-count ratio would.
     */
    private function overlapLengthMeters($points, $otherPoints): float
    {
        $overlapLength = 0.0;

        for ($i = 0; $i < $points->count() - 1; $i++) {
            $segStart = $points[$i];
            $segEnd = $points[$i + 1];

            $startClose = $this->nearAnyPoint($segStart, $otherPoints);
            $endClose = $this->nearAnyPoint($segEnd, $otherPoints);

            if ($startClose && $endClose) {
                $overlapLength += $this->haversine(
                    $segStart->latitude, $segStart->longitude,
                    $segEnd->latitude, $segEnd->longitude
                );
            }
        }

        return $overlapLength;
    }

    private function nearAnyPoint($point, $otherPoints): bool
    {
        foreach ($otherPoints as $other) {
            $d = $this->haversine(
                $point->latitude, $point->longitude,
                $other->latitude, $other->longitude
            );

            if ($d <= self::POINT_TOLERANCE_METERS) {
                return true;
            }
        }

        return false;
    }

    private function routeLengthMeters($points): float
    {
        $total = 0.0;

        for ($i = 0; $i < $points->count() - 1; $i++) {
            $total += $this->haversine(
                $points[$i]->latitude, $points[$i]->longitude,
                $points[$i + 1]->latitude, $points[$i + 1]->longitude
            );
        }

        return $total;
    }

    private function haversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * Bounding box (lat/lon degrees) around the given points, expanded
     * by bufferMeters on every side.
     *
     * @return array{0: float, 1: float, 2: float, 3: float} [minLat, minLon, maxLat, maxLon]
     */
    private function boundingBox($points, float $bufferMeters): array
    {
        $lats = $points->map(fn ($p) => $p->latitude);
        $lons = $points->map(fn ($p) => $p->longitude);

        $minLat = $lats->min();
        $maxLat = $lats->max();
        $minLon = $lons->min();
        $maxLon = $lons->max();

        $latBuffer = $bufferMeters / 111320;
        $lonBuffer = $bufferMeters / (111320 * cos(deg2rad(($minLat + $maxLat) / 2)));

        return [
            $minLat - $latBuffer,
            $minLon - $lonBuffer,
            $maxLat + $latBuffer,
            $maxLon + $lonBuffer,
        ];
    }
}