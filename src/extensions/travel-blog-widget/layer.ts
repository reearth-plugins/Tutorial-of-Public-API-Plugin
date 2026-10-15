// Builds the map layer for the trips: one GeoJSON layer with a marker per trip
// and an infobox that shows the trip details when a marker is clicked.

import type { NaiveLayer } from "@reearth/core";

import type { Trip } from "./trips";

const MARKER_COLOR = "#E8743B";

/** Convert trips into a GeoJSON FeatureCollection, one Point per trip. */
export function toFeatureCollection(trips: Trip[]) {
  return {
    type: "FeatureCollection" as const,
    features: trips.map((trip) => ({
      type: "Feature" as const,
      id: trip.id,
      properties: {
        city: trip.city,
        country: trip.country,
        food: trip.food,
        date: trip.date,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [trip.lng, trip.lat],
      },
    })),
  };
}

/**
 * Infobox body. The block value is evaluated as a Re:Earth expression, so the
 * markdown must be one single-quoted string; ${...} inside it is replaced with
 * the clicked feature's property. Use real newlines: "\n" escapes are not
 * supported inside expression strings.
 */
const INFOBOX_MARKDOWN = `'${[
  "### ${city}, ${country}",
  "",
  "**Food:** ${food}",
  "",
  "**Visited:** ${date}",
].join("\n")}'`;

/** Layer definition passed to reearth.layers.add. */
export function buildTripLayer(trips: Trip[]): NaiveLayer {
  return {
    type: "simple",
    title: "Travel Blog",
    data: {
      type: "geojson",
      value: toFeatureCollection(trips),
    },
    marker: {
      style: "point",
      pointColor: MARKER_COLOR,
      pointSize: 14,
      pointOutlineColor: "white",
      pointOutlineWidth: 2,
      heightReference: "clamp",
      label: true,
      labelText: { expression: "${city}" },
      labelPosition: "top",
      labelBackground: true,
    },
    infobox: {
      blocks: [
        {
          pluginId: "reearth",
          extensionId: "markdownInfoboxBetaBlock",
          property: {
            default: {
              src: { value: INFOBOX_MARKDOWN },
            },
          },
        },
      ],
    },
  };
}
