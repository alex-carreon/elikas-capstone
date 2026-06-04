# Sensor API Documentation

## Authentication

All endpoints require a valid Firebase ID token passed as a Bearer token.

A single get all route with minimal sensor data is available for map view functions to the public.

Routes are protected by `firebase.auth` and `role` middleware — only admins (role 1) and GovOp accounts (role 2) can access these endpoints.

Only `govOp` is capable of creating and editing sensor records, and all other sensor-related endpoints. Index and show methods are available to `admins`.

---

## Endpoints

### `GET /api/public/sensors`

Returns a complete list of sensors with minimal data. Currently no available queries.

#### Response Format

```json
{
    [
        {
            "id": 8,
            "name": "De Jesus Bridge Sensor",
            "location": [
                14.603730122015,
                121.03860592147
            ],
            "water_level": null,
            "last_online": null,
            "current_status": "normal"
        },
        {
            "id": 9,
            "name": "Ibanez Street Sensor",
            "location": [
                14.600140911055,
                121.04148573512
            ],
            "water_level": null,
            "last_online": null,
            "current_status": "normal"
        }
    ]
}
```

---

### `GET /api/sensors`

Returns a paginated list of sensors. All query parameters are optional — omitting one skips that filter entirely.

#### Query Parameters

**Search / String Match**

| Parameter | Type | Behavior | Example |
|---|---|---|---|
| `name` | string | Partial match anywhere in field | `?name=bridge` |
| `sensor_code` | string | Partial match anywhere in field | `?sensor_code=SN-01` |
| `address` | string | Partial match anywhere in field | `?address=Wilson` |

Special characters `%` and `_` are escaped — they will be treated as literals, not SQL wildcards.

**Status Filter**

| Parameter | Type | Behavior | Example |
|---|---|---|---|
| `current_status[]` | string (multi) | Matches any of the provided values | `?current_status[]=yellow&current_status[]=red` |

Valid values: `normal`, `yellow`, `red`

Supports multiple values as an array — useful for checkbox UI where multiple statuses can be selected at once.

**Location Filter**

| Parameter | Type | Behavior | Example |
|---|---|---|---|
| `location_id` | integer | Matches sensors at this location **and all its descendants** | `?location_id=36` |

> Passing a city-level ID returns all sensors in every barangay under that city. Passing a region ID returns everything under it.

**Active / Deactivated Filter**

| Parameter | Type | Behavior | Example |
|---|---|---|---|
| `is_active` | `0` or `1` | Filters by `deactivated_at` on the parent `SocialElement` | `?is_active=1` |

- `1` → sensors whose social element has no `deactivated_at` (active)
- `0` → sensors whose social element has a `deactivated_at` (deactivated)
- Omitted → returns all sensors regardless of status
- Any value other than `"0"` or `"1"` is ignored entirely

**Date Range Filters**

| Parameter | Type | Behavior | Example |
|---|---|---|---|
| `last_online_before` | `YYYY-MM-DD` | Sensors last seen on or before this date | `?last_online_before=2025-01-01` |
| `last_online_after` | `YYYY-MM-DD` | Sensors last seen on or after this date | `?last_online_after=2024-06-01` |

Both can be combined to express a range. Invalid date strings are silently ignored.

**Sorting**

| Parameter | Type | Default | Example |
|---|---|---|---|
| `sort_by` | string | `name` | `?sort_by=last_online` |
| `sort_order` | `asc` or `desc` | `asc` | `?sort_order=desc` |

Valid `sort_by` values:

| Value | Behavior |
|---|---|
| `name` | Sensor name alphabetically |
| `sensor_code` | Sensor code alphabetically |
| `current_status` | Water level status |
| `last_online` | Last seen timestamp |
| `barangay` | Barangay name |
| `posted_at` | Date sensor was registered (from `SocialElement`) |
| `last_online_null` | Active sensors first/last, with never-online sensors pushed to the boundary |

`last_online_null` with `sort_order=asc` → active sensors oldest-first, never-online pushed to bottom.
`last_online_null` with `sort_order=desc` → never-online sensors first, then active newest-first.

Any unrecognized `sort_by` value falls back to `name asc`.

**Pagination**

| Parameter | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `per_page` | `15` | Results per page (Laravel default) |

Only parameters in the explicit allowlist are processed. Any unknown query parameters are stripped before reaching the filter layer.

---

#### Response Format

```json
{
    "data": [
        "id": 8,
            "sensorCode": "SR-159745",
            "name": "De Jesus Bridge Sensor",
            "waterLevel": null,
            "lastOnline": null,
            "mountHeight": 3,
            "location": [
                14.603730122015,
                121.03860592147
            ],
            "address": "General S. De Jesus (Bridge)",
            "yellowLevel": 1.5,
            "redLevel": 2.5,
            "currentStatus": null,
            "mountLocation": "Barangay Batis",
            "deactivatedAt": null,
            "registeredBy": "Barangay Batis"
        }
  ],
  "links": { "...": "..." },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 42
  }
}
```

**Field notes:**
- `waterLevel` — always `null` currently; reserved for last `SensorLog` reading
- `location` — `[latitude, longitude]` array
- `barangay` — resolved from `SocialElement → User → GovOp → Location.name`; `null` if any link in the chain is missing
- `deactivated_at` — ISO 8601 string if deactivated, `null` if active; only populated when `social_element` is loaded

---

#### Example Requests

```
# All active sensors, oldest heartbeat first (ghost sensor hunt)
GET /api/sensors?is_active=1&sort_by=last_online&sort_order=asc

# Active sensors silent for over 7 days
GET /api/sensors?is_active=1&last_online_before=2025-05-20&sort_by=last_online&sort_order=asc

# Never-online sensors pushed to bottom, active ones newest first
GET /api/sensors?sort_by=last_online_null&sort_order=asc

# All sensors at or under a city location
GET /api/sensors?location_id=36

# Yellow and red alert sensors in a location
GET /api/sensors?location_id=36&current_status[]=yellow&current_status[]=red

# Search by name, page 2
GET /api/sensors?name=ibanez&page=2
```

---

### `GET /api/sensors/{id}`

Returns a single sensor by ID.

**Route model binding** — 404 is returned automatically if the ID does not exist.

#### Response

Same shape as a single item in the `data` array above.

---

### `POST /api/sensors`

Creates a new sensor. The `sensor_code` and `element_id` are set automatically — do not pass them.

#### Request Body

```json
{
    "data": {
        "id": 19,
        "sensorCode": "SR-120910",
        "name": "Ibanez Street Sensor",
        "waterLevel": null,
        "lastOnline": null,
        "mountHeight": 3.5,
        "location": [
            14.600140911055,
            121.04148573512
        ],
        "address": "V. Ibanez Street",
        "yellowLevel": 1.5,
        "orangeLevel": 2,
        "redLevel": 2.5,
        "currentStatus": null,
        "mountLocation": "Barangay Salapan",
        "deactivatedAt": null
    }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 50 characters |
| `mountHeight` | number | Yes | Must be > 0 |
| `location` | array | Yes | `[latitude, longitude]` |
| `location[0]` | number | Yes | Latitude, between -90 and 90|
| `location[1]` | number | Yes | Longitude, between -180 and 180|
| `address` | string | Yes | Max 255 characters |
| `yellowLevel` | number | Yes | Must be > 0 |
| `orangeLevel` | number | Yes | Must be > 0; must be > `yellowLevel` & < `redLevel` |
| `redLevel` | number | Yes | Must be > 0; must be > `orangeLevel` & < `mountHeight` |
| `locationId` | number | Yes | ID be in `locations` table |

**camelCase input is accepted** in accordance with json convention — `mountHeight`, `yellowLevel`, `redLevel` are automatically mapped to their snake_case DB equivalents before validation.

#### Automatic fields (do not pass)

| Field | Set by |
|---|---|
| `sensor_code` | Generated as `SR-XXXXXX` e.g. `SR-62BCC7` |
| `element_id` | Created automatically via a new `SocialElement` record |
| `current_status` | Defaults to `null` |
| `last_online` | Defaults to `null` |

The `SocialElement` parent record is created in the same database transaction as the sensor. If either insert fails, both are rolled back.

#### Response

Returns the created sensor in the same shape as `GET /api/sensors/{id}`, with HTTP `200`.

---

### `PATCH /api/sensors/{id}`

Updates an existing sensor. All fields are optional — only include what needs to change. There is no requirement to send the full resource on `PATCH`.

#### Request Body

```json
{
    "name": "Ibanez Street Sensor",
    "address": "V. Ibanez Street"
}
```

**Only the following** fields can be updated. In the case of location-related changes (e.g. sensor unit is moved to a different street or another barangay), it is **strongly encouraged** that the existing sensor is deactivated and registered as a new sensor when moved to preserve historical data. 

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | No | Max 50 characters |
| `mountHeight` | number | No | Must be > 0 |
| `address` | string | No | Max 255 characters |
| `yellowLevel` | number | No | Must be > 0 |
| `orangeLevel` | number | No | Must be > 0; must be > `yellowLevel` & < `redLevel` | 
| `redLevel` | number | No | Must be > 0; must be > `orangeLevel` & < `mountHeight` |

**camelCase input is accepted** — same mapping as `POST`. Only fields that are actually present in the request body are validated and updated. Omitted fields are left unchanged.


#### Response

Returns the updated sensor in the same shape as `GET /api/sensors/{id}`, with HTTP `200`.

---

### `PATCH /api/sensors/{id}/deactivate`

Deactivates a sensor by setting `deactivated_at` on its parent `SocialElement`.

No request body required.

#### Response

```json
{
  "message": "Sensor deactivated successfully"
}
```

Note: this does not delete the sensor or its logs. The sensor will appear in `?is_active=0` queries and be excluded from `?is_active=1` queries after deactivation.

---

## Error Responses

All endpoints return errors in this shape:

```json
{
  "error": "Human-readable message",
  "details": "Exception message for debugging"
}
```

| Status | Cause |
|---|---|
| `401` | Missing or invalid Firebase token |
| `403` | Account deactivated, or insufficient role |
| `404` | Sensor ID not found |
| `422` | Validation failed — missing required fields or invalid values |
| `500` | Unexpected server error |

---

## Security Notes

- **Parameter stripping** — the `index` endpoint explicitly allows only known query parameter keys. Unknown keys are stripped before reaching the filter layer.
- **Column injection** — `sort_by` is validated against an explicit allowlist. Invalid values are ignored and never passed to `orderBy`.
- **SQL injection** — all values go through Laravel's PDO parameter binding. The one raw SQL query (`resolveLocationIds`) uses named bindings, not string interpolation.
- **LIKE wildcards** — `%` and `_` in search inputs are escaped to literals before being passed to `LIKE` queries.
- **`is_active` type safety** — only the string values `"0"` and `"1"` are accepted; any other value is ignored entirely.
- **Protected fields** — `sensor_code`, `element_id`, `current_status`, and `last_online` are not in `$fillable` and cannot be assigned through `store` or `update`.
