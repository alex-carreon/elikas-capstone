<?php

namespace App\Services;

use App\Exceptions\NoRouteFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class RoutingService
{
    private const BBOX_BUFFER = 0.02;  // 2 km of padding to accomodate detours

    // Cost penalties for different flood levels
    private const FLOOD_WEIGHTS = [
        'Gutter-Deep' => 5,
        'Half Knee-Deep' => 20,
        'Half Tire-Deep' => 60,
        'Knee-Deep' => 150,
        'Tire-Deep' => 300,
        'Waist-Deep' => 600,
        'Chest-Deep' => -1,  // Impassable
    ];

    // Inject base URL of the BRouter instance
    public function __construct(private readonly string $brouterUrl) {}


    // Calculates the safest route avoiding flood barriers from a start point to an end point
    public function getEvacuationRoute(
        float $startLon,
        float $startLat,
        float $endLon,
        float $endLat
    ): array {
        // Get all active flood paths intersecting the bounding box of the start and end points
        $polylines = $this->buildPolylines($startLon, $startLat, $endLon, $endLat);

        // Prepare the parameters for the BRouter request
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
            // Handle network or request errors
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


    // Builds an array of polylines representing flood paths that intersect the bounding box of the start and end points
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

        // Format a WKT polygon for the bounding box
        $bboxWkt = sprintf(
            'POLYGON((%f %f,%f %f,%f %f,%f %f,%f %f))',
            $minLon, $minLat,
            $maxLon, $minLat,
            $maxLon, $maxLat,
            $minLon, $maxLat,
            $minLon, $minLat
        );

        // Query the database for flood paths that intersect the bounding box
        $rows = DB::select('
            SELECT
                ST_AsText(fp.path) AS path_wkt,
                fl.level_name
            FROM FloodPaths fp
            JOIN SocialElements se ON fp.element_id = se.id
            JOIN FloodLevels fl ON fp.level_id = fl.id
            WHERE se.deactivated_at IS NULL
            AND fp.expiry > NOW()
            AND ST_Intersects(fp.path, ST_GeomFromText(?))
        ', [$bboxWkt]);

        return array_map(fn(object $row) => $this->rowToPolyline($row), $rows);
    }


    // Converts a flood path database row into a polyline string with weight for BRouter
    private function rowToPolyline(object $row): string
    {
        // Default to impassable if unknown
        $weight = self::FLOOD_WEIGHTS[$row->level_name] ?? -1;

        // Build an array of comma-separated coordinates
        $points = $this->parseWkt($row->path_wkt);

        // Return the polyline in the format expected by BRouter
        return "{$points},{$weight}";
    }

    // Converts a WKT LINESTRING into a comma-separated string of coordinates for BRouter
    private function parseWkt(string $wkt): string
    {
        // Input:  "LINESTRING(121.025 14.605, 121.026 14.604)"
        // Output: "121.025,14.605,121.026,14.604"

        // Strip the spatial prefix envelope "LINESTRING(" and the trailing closure bracket ")"
        $inner = substr($wkt, strlen('LINESTRING('), -1);  // strip "LINESTRING(" and ")"

        // Explode coordinates into pairs by matching commas
        $pairs = preg_split('/,\s*/', trim($inner));   // split by comma

        // Loop through pairs and switch the space into a comma
        $points = array_map(
            fn(string $pair) => str_replace(' ', ',', trim($pair)),
            $pairs
        );

        // Flatten the array into a comma-separated line parameter
        return implode(',', $points);
    }
}
