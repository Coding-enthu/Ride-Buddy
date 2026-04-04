# RideBuddy Backend API Reference

This backend exposes APIs for:

- health check
- hazards CRUD-like reads and create
- nearby hazard lookup
- duplicate hazard check
- hazard-aware route selection

Base URL (local): `http://localhost:5000`

## API Summary

| Method | Path                | Purpose                                    |
| ------ | ------------------- | ------------------------------------------ |
| GET    | /                   | Health check                               |
| POST   | /api/hazards        | Create hazard report                       |
| GET    | /api/hazards        | Get hazards (all or by bounding box)       |
| GET    | /api/hazards/nearby | Get hazards near a point                   |
| GET    | /api/hazards/check  | Check whether hazard already exists nearby |
| GET    | /api/route          | Get hazard-aware best route                |

## 1) Health Check

### GET /

Use this to verify the backend is up.

Success response:

```json
"API is running 🚀"
```

## 2) Create Hazard

### POST /api/hazards

Creates a hazard row in database.

Request body format:

```json
{
	"type": "pothole",
	"lat": 22.5726,
	"lng": 88.3639,
	"severity": 2
}
```

Field format:

- `type`: string (required)
- `lat`: number (required)
- `lng`: number (required)
- `severity`: number (optional, defaults to `1`)

Success response (`201`):

```json
{
	"id": 10,
	"type": "pothole",
	"lat": 22.5726,
	"lng": 88.3639,
	"severity": 2,
	"created_at": "2026-04-04T10:30:12.000Z"
}
```

Error response (`500`):

```json
{
	"error": "Hazard already reported nearby"
}
```

## 3) Get Hazards

### GET /api/hazards

Returns hazard rows.

Mode A (all hazards):

```http
GET /api/hazards
```

Mode B (bounding box filter):

```http
GET /api/hazards?minLat=22.50&maxLat=22.70&minLng=88.20&maxLng=88.50
```

Query format:

- `minLat`, `maxLat`, `minLng`, `maxLng`: numbers (optional as a set)
- If `minLat` is not provided, API returns all hazards

Success response (`200`):

```json
[
	{
		"id": 10,
		"type": "pothole",
		"lat": 22.5726,
		"lng": 88.3639,
		"severity": 2,
		"created_at": "2026-04-04T10:30:12.000Z"
	}
]
```

Error response (`500`):

```json
{
	"error": "Internal server error message"
}
```

## 4) Get Nearby Hazards

### GET /api/hazards/nearby

Returns hazards near a given point within a radius (meters).

Query format:

- `lat`: number (required)
- `lng`: number (required)
- `radius`: number (optional, default `500`)

Example:

```http
GET /api/hazards/nearby?lat=22.57&lng=88.36&radius=500
```

Success response (`200`):

```json
[
	{
		"id": 10,
		"type": "pothole",
		"lat": 22.5726,
		"lng": 88.3639,
		"severity": 2,
		"distance_meters": 128.44
	}
]
```

Validation error (`400`):

```json
{
	"error": "lat and lng are required"
}
```

## 5) Check Hazard Existence

### GET /api/hazards/check

Checks whether a hazard has already been reported near a point.

Query format:

- `lat`: number (required)
- `lng`: number (required)

Example:

```http
GET /api/hazards/check?lat=22.5726&lng=88.3639
```

Success response (`200`):

```json
{
	"exists": true,
	"debug": "CHECK_API"
}
```

Validation error (`400`):

```json
{
	"error": "lat and lng required"
}
```

## 6) Get Hazard-Aware Route

### GET /api/route

Fetches route alternatives from OSRM, scores each route with hazard penalties, and returns the best route.

Query format:

- `from`: `lng,lat` string (required)
- `to`: `lng,lat` string (required)

Example:

```http
GET /api/route?from=88.3639,22.5726&to=88.4339,22.6026
```

Success response (`200`):

```json
{
	"bestRoute": {
		"distance": 12345,
		"duration": 1200,
		"geometry": {
			"type": "LineString",
			"coordinates": [
				[88.36, 22.57],
				[88.37, 22.58]
			]
		}
	},
	"allRoutes": [
		{
			"distance": 12345,
			"duration": 1200,
			"geometry": {
				"type": "LineString",
				"coordinates": [
					[88.36, 22.57],
					[88.37, 22.58]
				]
			}
		}
	],
	"analysis": {
		"score": 1500,
		"hazardCount": 3,
		"penalty": 300,
		"typeBreakdown": {
			"pothole": 2,
			"waterlogging": 1
		}
	},
	"hazardsOnRoute": [
		{
			"id": 10,
			"type": "pothole",
			"lat": 22.5726,
			"lng": 88.3639,
			"severity": 2
		}
	]
}
```

Validation error (`400`):

```json
{
	"error": "from and to required"
}
```

Error response (`500`):

```json
{
	"error": "Internal server error message"
}
```

## Local Setup

Create `.env` in backend folder:

```env
DATABASE_URL=your_postgres_connection_string
PORT=5000
```

Install and run:

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000` (unless `PORT` is changed).
