<?php

namespace App\Services;

use App\Exceptions\NoRouteFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class RoutingService
{
    private const BBOX_BUFFER = 0.01;  // 1 km of padding to accomodate detours
    private const SIMPLIFY_TOLERANCE = 0.0001;

    // Cost penalties for different flood levels
    private const FLOOD_WEIGHTS = [
        1 => 50,
        2 => 200,
        3 => 600,
        4 => 1500,
        5 => 3000,
        6 => 6000,
        7 => 10000,
    ];

    public function __construct(private readonly string $brouterUrl) {}

    public function getEvacuationRoute(
        float $startLon,
        float $startLat,
        float $endLon,
        float $endLat
    ): array {
        $polylines = $this->buildPolylines($startLon, $startLat, $endLon, $endLat);

        $params = [
            'lonlats'        => "{$startLon},{$startLat}|{$endLon},{$endLat}",
            'profile'        => 'elikas_flood',
            'alternativeidx' => '0',
            'format'         => 'geojson',
        ];

        // Pass the floodpaths as a parameter if they exist
        if (!empty($polylines)) {
            $params['polylines'] = implode('|', $polylines);
        }

        try {
            $response = Http::timeout(15)
                ->get("{$this->brouterUrl}/brouter", $params);
        } catch (RequestException $e) {
            throw new NoRouteFoundException(
                'Could not reach the routing engine: ' . $e->getMessage()
            );
        }

        if (!$response->successful()) {
            throw new NoRouteFoundException(
                'No safe evacuation route could be found. All paths may be blocked by flooding.'
            );
        }

        return $response->json();
    }

    private function buildPolylines(
        float $startLon,
        float $startLat,
        float $endLon,
        float $endLat
    ): array {
        // Create a bounding box around the start and end points with buffer
        $minLon = min($startLon, $endLon) - self::BBOX_BUFFER;
        $minLat = min($startLat, $endLat) - self::BBOX_BUFFER;
        $maxLon = max($startLon, $endLon) + self::BBOX_BUFFER;
        $maxLat = max($startLat, $endLat) + self::BBOX_BUFFER;

        $bboxWkt = sprintf(
            'POLYGON((%f %f,%f %f,%f %f,%f %f,%f %f))',
            $minLon, $minLat,
            $maxLon, $minLat,
            $maxLon, $maxLat,
            $minLon, $maxLat,
            $minLon, $minLat
        );

        $rows = DB::select('
            SELECT
                COALESCE(
                    ST_AsText(ST_Simplify(fp.path, ?)),
                    ST_AsText(fp.path)
                ) AS path_wkt,
                fp.level_id
            FROM FloodPaths fp
            JOIN SocialElements se ON fp.element_id = se.id
            WHERE se.deactivated_at IS NULL
            AND fp.expiry > NOW()
            AND ST_Intersects(fp.path, ST_GeomFromText(?))
        ', [self::SIMPLIFY_TOLERANCE, $bboxWkt]);

        return array_map(fn(object $row) => $this->rowToPolyline($row), $rows);
    }

    private function rowToPolyline(object $row): string
    {
        $weight = self::FLOOD_WEIGHTS[$row->level_id] ?? 10000;
        $points = $this->parseWkt($row->path_wkt);
        return "{$points},{$weight}";
    }

    private function parseWkt(string $wkt): string
    {
        // Input:  "LINESTRING(121.025 14.605, 121.026 14.604)"
        // Output: "121.025,14.605,121.026,14.604"

        $inner = substr($wkt, strlen('LINESTRING('), -1);  // strip "LINESTRING(" and ")"
        $pairs = preg_split('/,\s*/', trim($inner));   // split by comma

        $points = array_map(
            fn(string $pair) => str_replace(' ', ',', trim($pair)),
            $pairs
        );

        return implode(',', $points);
    }
}
