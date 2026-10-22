import { useCallback, useEffect, useState } from "react";

import { INIT_ACTION, type WidgetSettings } from "../messages";
import { fetchAllItems, parseTrips, type Trip } from "../trips";

import { postMsg } from "@/shared/utils";

/** How often to ask the extension for the current settings (ms). */
const SETTINGS_POLL_INTERVAL = 2000;

export type LoadState =
  | { status: "no-url" }
  | { status: "loading" }
  | { status: "ready"; trips: Trip[]; skipped: number }
  | { status: "error"; message: string };

/** Read the bootstrap settings that index.html stashed from the __init__ message. */
function readInitialSettings(): WidgetSettings {
  return (
    (
      window as Window & {
        _reearth_plugin_extension_init_data_?: WidgetSettings;
      }
    )._reearth_plugin_extension_init_data_ ?? {}
  );
}

/** Newest first. Dates are "YYYY-MM", so string order is date order. */
function sortByDateDesc(trips: Trip[]): Trip[] {
  return [...trips].sort((a, b) => b.date.localeCompare(a.date));
}

export default function useTravelBlog() {
  const [cmsUrl, setCmsUrl] = useState(() => readInitialSettings().cmsUrl);
  const [loadState, setLoadState] = useState<LoadState>({ status: "no-url" });
  /** Id of the highlighted trip, from a row click or a marker click. */
  const [selectedId, setSelectedId] = useState<string>();

  const flyTo = useCallback((id: string) => {
    setSelectedId(id);
    postMsg("flyTo", { id });
  }, []);

  // Pick up settings from the extension. The __init__ message may arrive
  // before or after this listener is attached, so handle it here and also
  // re-read the stashed value once the listener is in place.
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const action = e.data?.action;
      if (action === INIT_ACTION || action === "settings") {
        setCmsUrl((e.data.payload as WidgetSettings | undefined)?.cmsUrl);
      } else if (action === "selected") {
        // A marker (or something else on the map) was clicked.
        setSelectedId((e.data.payload as { id?: string } | undefined)?.id);
      }
    };
    window.addEventListener("message", handleMessage);

    const stashed = readInitialSettings().cmsUrl;
    if (stashed) setCmsUrl(stashed);

    // Inspector changes send no message to the widget, so ask the extension
    // for the current settings now and periodically. setCmsUrl ignores an
    // unchanged string, so this only refetches when the URL changes.
    postMsg("getSettings");
    const timer = setInterval(
      () => postMsg("getSettings"),
      SETTINGS_POLL_INTERVAL
    );

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(timer);
    };
  }, []);

  // Fetch trips from the CMS Public API whenever the URL changes.
  useEffect(() => {
    if (!cmsUrl) {
      // Clear any markers from a previous URL so the map matches the widget.
      postMsg("trips", { trips: [] });
      setLoadState({ status: "no-url" });
      return;
    }

    const controller = new AbortController();
    setLoadState({ status: "loading" });
    setSelectedId(undefined);

    (async () => {
      try {
        const items = await fetchAllItems(cmsUrl, controller.signal);
        const parsed = parseTrips(items);
        const trips = sortByDateDesc(parsed.trips);
        const { skipped } = parsed;
        console.log("Travel blog: trips", trips);
        postMsg("trips", { trips });
        setLoadState({ status: "ready", trips, skipped });
      } catch (error) {
        if (controller.signal.aborted) return;
        postMsg("trips", { trips: [] });
        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    })();

    return () => controller.abort();
  }, [cmsUrl]);

  return { loadState, selectedId, flyTo };
}
