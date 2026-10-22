import html from "@distui/travel-blog-widget/main/index.html?raw";

import { buildTripLayer } from "./layer";
import {
  INIT_ACTION,
  type UIToLogicMessage,
  type WidgetSettings,
} from "./messages";
import type { Trip } from "./trips";

import { GlobalThis } from "@/shared/reearthTypes";

const reearth = (globalThis as unknown as GlobalThis).reearth;

reearth.ui.show(html, { width: 320 });

/** Shape of the inspector configuration this widget reads (see reearth.yml). */
type WidgetProperty = {
  data_source?: { cms_url?: string };
};

/** Trips fetched by the UI. The UI does the fetch; the extension keeps a copy. */
let trips: Trip[] = [];

/** Id of the markers layer currently on the map, if any. */
let tripLayerId: string | undefined;

/** Replace the markers layer so refetches never duplicate markers. */
function showTripsOnMap(): void {
  try {
    if (tripLayerId) {
      reearth.layers.delete?.(tripLayerId);
      tripLayerId = undefined;
    }
    if (trips.length === 0) return;
    tripLayerId = reearth.layers.add(buildTripLayer(trips));
  } catch (error) {
    // A layer failure should not break the widget; the list still works.
    console.error("Travel blog: failed to show trips on the map:", error);
  }
}

/** Camera height (m) and flight time (s) when flying to a trip. */
const FLY_TO_HEIGHT = 50000;
const FLY_TO_DURATION = 2;

/** Fly the camera to a trip and open its infobox by selecting its marker. */
function flyToTrip(id: string): void {
  const trip = trips.find((t) => t.id === id);
  if (!trip) return;
  try {
    reearth.camera.flyTo(
      { lng: trip.lng, lat: trip.lat, height: FLY_TO_HEIGHT },
      { duration: FLY_TO_DURATION }
    );
    // Feature ids are trip ids (see idProperty in layer.ts).
    if (tripLayerId) reearth.layers.selectFeature?.(tripLayerId, id);
  } catch (error) {
    console.error("Travel blog: failed to fly to trip:", error);
  }
}

/** Tell the UI which trip is selected on the map, so it can highlight it. */
function handleLayerSelect(
  layerId: string | undefined,
  featureId: string | undefined
): void {
  const id = layerId && layerId === tripLayerId ? featureId : undefined;
  reearth.ui.postMessage({ action: "selected", payload: { id } });
}

function readSettings(): WidgetSettings {
  const property = reearth.extension.widget?.property as
    | WidgetProperty
    | undefined;
  return { cmsUrl: property?.data_source?.cms_url?.trim() || undefined };
}

function handleUIMessage(message: unknown): void {
  const msg = message as UIToLogicMessage | undefined;
  if (msg?.action === "trips") {
    trips = msg.payload?.trips ?? [];
    console.log(`Travel blog: received ${trips.length} trips`);
    showTripsOnMap();
  } else if (msg?.action === "getSettings") {
    // Inspector changes emit no event, so the UI asks for the current value.
    reearth.ui.postMessage({ action: "settings", payload: readSettings() });
  } else if (msg?.action === "flyTo") {
    const id = msg.payload?.id;
    if (typeof id === "string") flyToTrip(id);
  }
}

// Guard startup so a failure here never takes down the map or other plugins.
try {
  reearth.extension.on("message", handleUIMessage);
  reearth.layers.on("select", handleLayerSelect);
  // Bootstrap the first render via the __init__ channel (see index.html).
  reearth.ui.postMessage({ action: INIT_ACTION, payload: readSettings() });
} catch (error) {
  console.error("Travel blog plugin failed to start:", error);
}
