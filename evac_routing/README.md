# eLikas BRouter Flood Routing — Developer Guide

BRouter is a routing engine that reads OpenStreetMap road data and finds the cheapest path between two points. "Cheap" is defined by a **profile file** (`.brf`) that assigns a cost number to every path. The lower the cost, the more the router prefers it.

```
User requests a route
       │
       ▼
Laravel backend receives the request
       │
       ▼
Backend queries active FloodPaths from the database
       │
       ▼
Backend sends an HTTP GET to BRouter with:
  - start and end coordinates
  - the flood linestrings as penalty zones
  - the profile name
       │
       ▼
BRouter calculates the safest (aka "cheapest") route and returns GeoJSON
       │
       ▼
Backend returns the route to the frontend
```


## eLikas Routing Profile

The profile file `elikas_flood.brf` lives on the BRouter server inside its `profiles2/` directory. It defines two things:

1. **Road preferences** — it tells the router that wide urban roads (primary, secondary, residential) are cheap to use, while footpaths, tracks, and steps are expensive. This makes evacuation routes favor roads that emergency services can also access.

2. **Mode** — it identifies this as a foot routing profile (not bike, not car), which affects how BRouter generates turn instructions.

BRouter does not connect to any database and does not store any flood data on its own. **The Laravel backend is responsible for fetching active flood paths and injecting them during request time.** This is by design since flood conditions change in real time.


## Cost Penalites & Tolerance 

BRouter accepts a `polylines` parameter in the HTTP request. A polyline is a list of coordinates that draws a line on the map. Any OSM road segment that physically crosses that line gets a cost penalty added to it.

The penalty is controlled by a `weight` value that is appended to the end of each polyline parameter. The higher the weight, the more BRouter will avoid routes that involve passing through them.

In the API layer's `Routing Service`, the cost penalties for the flood levels are defined as follows: 

```php
class RoutingService
{
    private const BBOX_BUFFER = 0.03;  // 3 km of padding to accomodate detours

    private const FLOOD_WEIGHTS = [
        1 => 50,      // Gutter-Deep
        2 => 200,     // Half Knee-Deep
        3 => 600,     // Half Tire-Deep
        4 => 1500,    // Knee-Deep
        5 => 3000,    // Tire-Deep
        6 => 6000,    // Waist-Deep
        7 => 10000,   // Chest-Deep
    ];

    // ...
}
```

The base cost of any normal road in the profile is between 1.0 and 3.5, so a weight of 600 already makes a flooded road roughly 600× more expensive than a dry one. The weight threshold for "impassable" in BRouter is anything **≥ 10000**. 

In effect, floods that are **chest-deep will be competely avoided** and the app will try to find a safer path within a set bounding box. The app's routing logic will allow **detours within 3 km** of the most direct pedestrian route from the start coordinates to the end coordinates.

If no routes are found in the case that routes have dangerous flooding, do not have any pedestrian-friendly pathways, or detours are too far, the app will throw a `422 NoRouteFoundException`. 


## `GET` request format to BRouter

```
GET http://brouter:17777/brouter
    ?lonlats=<lon,lat>|<lon,lat>
    &profile=elikas_flood
    &alternativeidx=0
    &format=geojson
    &polylines=<lon,lat,lon,lat,...,weight>|<lon,lat,lon,lat,...,weight>
```

| Parameter | Required | Description |
|---|---|---|
| `lonlats` | Yes | Start and end coordinates, pipe-separated. Format: `lon,lat\|lon,lat` |
| `profile` | Yes | The profile filename without `.brf`. Must be `elikas_flood` |
| `alternativeidx` | Yes | Which route to return. `0` = primary route. Use `1` or `2` for alternates |
| `format` | Yes | Response format. Use `geojson` |
| `polylines` | No | The flood paths as weighted penalty lines. Omit if no floods are active |


Each polyline is a flat sequence of coordinate pairs followed by a weight, all comma-separated:

```
lon1,lat1,lon2,lat2,lon3,lat3,...,weight
```

Multiple polylines are separated by a pipe `|`:

```
polylines=lon1,lat1,lon2,lat2,weight_A|lon1,lat1,lon2,lat2,weight_B
```


## Example

Assume a user at `121.0244, 14.6042` wants to reach an evacuation center at `121.0312, 14.6088`. There are two active flood paths in the database:

- Flood 1: Gutter-Deep flood from `121.0250, 14.6050` to `121.0255, 14.6048`
- Flood 2: Chest-Deep from `121.0290, 14.6070`, `121.0295, 14.6065`

The request to BRouter would look like this:

```
GET http://brouter:17777/brouter
    ?lonlats=121.0244,14.6042|121.0312,14.6088
    &profile=elikas_flood
    &alternativeidx=0
    &format=geojson
    &polylines=121.0250,14.6050,121.0255,14.6048,50|121.0290,14.6070,121.0295,14.6065,10000
```

Breaking down the `polylines` value:

```
121.0250,14.6050,121.0255,14.6048,50
│                                  │
│   Flood 1 coordinates            │
│                                  └── weight 50 = Gutter-Deep
│
└── coordinate pairs of the linestring

121.0290,14.6070,121.0295,14.6065,10000
│                                   │
│   Flood 2 coordinates             │
│                                   └── weight 10000 = Chest-Deep (impassable)
└── coordinate pairs of the linestring
```


## Routing Logic Flow

### 1. Construct Bounding Box 

Define a permieter around the trip's starting and ending location (with the buffer).

```php
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
```

### 2. Fetch active flood paths

Query the `FloodPaths` table for all non-expired records within the bounding box, joined to `FloodLevels` to get the level.

```sql
SELECT
  ST_AsText(fp.path) AS path_wkt,
  fl.level_name
FROM FloodPaths fp
JOIN SocialElements se ON fp.element_id = se.id
JOIN FloodLevels fl ON fp.level_id = fl.id
WHERE se.deactivated_at IS NULL
AND fp.expiry > NOW()
AND ST_Intersects(fp.path, ST_GeomFromText(?))
```

`fp.path` is a MariaDB `LINESTRING`. Using `ST_AsText(fp.path)` in the SELECT formats into a readable well-known text (WKT) string like `LINESTRING(14.6050 121.0250, 14.6048 121.0255)`.

>WKT is an industry-wide OpenGIS (Geographic Information System) standard designed specifically for formatting GIS data into a meaningful format. In the database, MariaDB stores this information in a binary data format that is not human-readable. 


### 3. Parse the WKT 

Convert the WKT (e.g. `LINESTRING(121.025 14.605, 121.026 14.604)`) into a comma-separated string (e.g. "121.025,14.605,121.026,14.604") for the BRouter request.

```php
private function parseWkt(string $wkt): string
    {
        // Strip the spatial prefix envelope "LINESTRING(" and the trailing closure parenthesis ")"
        $inner = substr($wkt, strlen('LINESTRING('), -1);  
        
        // Explode coordinates into pairs by matching commas
        $pairs = preg_split('/,\s*/', trim($inner));   

        // Loop through pairs and switch the space into a comma
        $points = array_map(
            fn(string $pair) => str_replace(' ', ',', trim($pair)),
            $pairs
        );

        // Flatten the array into a comma-separated line parameter
        return implode(',', $points);
    }
```


### 4. Map Flood Paths from Database into weighted BRouter Polylines

Construct the penalty strings by looking up the severity level against the defined `FLOOD_WEIGHT` configuration. 

```php
private function rowToPolyline(object $row): string
    {
        // Resolve the weight for the flood level, defaulting to a high penalty if unknown
        $weight = self::FLOOD_WEIGHTS[$row->level_name] ?? 10000;

        // Build an array of comma-separated coordinates
        $points = $this->parseWkt($row->path_wkt);

        // Return the polyline in the format expected by BRouter
        return "{$points},{$weight}";
    }
```

### 5. Compile and Dispatch Request to BRouter Engine
Package the start and end coordinates, routing profile requirements, and any compiled dynamic flood polylines together before making the API call.

```php
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
```


## JSON Response

BRouter returns a GeoJSON `FeatureCollection` when `format=geojson` is used. The route geometry is in the `geometry` of the first Feature. The frontend can pass this directly to Leaflet to draw the route line.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [121.0244, 14.6042],
          [121.0251, 14.6049],
          ...
          [121.0312, 14.6088]
        ]
      },
      "properties": {
        "creator": "BRouter-1.x.x",
        "track-length": "850",
        "total-time": "612",
        ...
      }
    }
  ]
}
```

`track-length` is in meters. `total-time` is estimated seconds on foot. These can be surfaced in the UI.