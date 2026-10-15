# Travel Blog Plugin

A Re:Earth Visualizer widget plugin that reads travel blog entries from a
Re:Earth CMS Public API and shows them on the map.

## CMS model

Each item in the model should have these fields:

| Field      | Type     | Notes                         |
| ---------- | -------- | ----------------------------- |
| `date`     | Date     | Shown as `YYYY-MM`            |
| `country`  | Text     |                               |
| `city`     | Text     |                               |
| `food`     | Text     |                               |
| `location` | Geometry | Point, required for the map   |

Enable Public API access for the model.

## Usage

1. Install the plugin and add the **Travel Blog** widget.
2. In the widget settings, set **CMS Public API URL** to the model's Public API
   endpoint.

The widget fetches every page of the model (100 items per request), so no
items are dropped. To use a different page size, add `?perPage=N` to the URL.

Each trip is shown on the map as a marker labelled with its city. Click a
marker to see the city, country, food and date in the infobox.

The widget lists every trip, newest first. Click a trip to fly the camera to
its city and open its infobox; clicking a marker highlights its row in the
list.

## Development

```bash
yarn install
yarn dev-build   # serves the built plugin on http://localhost:5005
yarn build       # builds and zips the plugin into package/
```
