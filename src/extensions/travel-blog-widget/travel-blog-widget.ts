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
  }
}

// Guard startup so a failure here never takes down the map or other plugins.
try {
  reearth.extension.on("message", handleUIMessage);
  // Bootstrap the first render via the __init__ channel (see index.html).
  reearth.ui.postMessage({ action: INIT_ACTION, payload: readSettings() });
} catch (error) {
  console.error("Travel blog plugin failed to start:", error);
}
