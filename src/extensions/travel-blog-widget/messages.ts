// Typed message contract between the extension logic (QuickJS sandbox) and the
// UI iframe (React). Both sides import these types so the postMessage protocol
// stays in sync.

import type { Trip } from "./trips";

/** Widget settings read from the Visualizer inspector (see reearth.yml). */
export type WidgetSettings = {
  cmsUrl?: string;
};

/**
 * Action used for the initial-render bootstrap message. The UI may not have
 * attached its message listener on first paint, so index.html stashes this
 * payload on window for the React app to read once.
 */
export const INIT_ACTION = "__init__";

/** Messages sent from the extension logic → UI. */
export type LogicToUIMessage =
  | { action: typeof INIT_ACTION; payload: WidgetSettings }
  | { action: "settings"; payload: WidgetSettings };

/** Messages sent from the UI → extension logic. */
export type UIToLogicMessage =
  | { action: "trips"; payload: { trips: Trip[] } }
  | { action: "getSettings" };
