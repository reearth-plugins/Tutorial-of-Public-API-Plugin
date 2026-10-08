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

## Development

```bash
yarn install
yarn dev-build   # serves the built plugin on http://localhost:5005
yarn build       # builds and zips the plugin into package/
```
