import html from "@distui/travel-blog-widget/main/index.html?raw";

import {
  INIT_ACTION,
  type UIToLogicMessage,
  type WidgetSettings,
} from "@/shared/messages";
import { GlobalThis } from "@/shared/reearthTypes";
import type { Trip } from "@/shared/trips";

const reearth = (globalThis as unknown as GlobalThis).reearth;

reearth.ui.show(html, { width: 320 });

/** Shape of the inspector configuration this widget reads (see reearth.yml). */
type WidgetProperty = {
  data_source?: { cms_url?: string };
};

/** Trips fetched by the UI. The UI does the fetch; the extension keeps a copy. */
let trips: Trip[] = [];

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
