import { useEffect, useState } from "react";

import type { WidgetSettings } from "@/shared/messages";
import { parseTrips, type Trip } from "@/shared/trips";
import { postMsg } from "@/shared/utils";

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

export default function useTravelBlog() {
  const [cmsUrl, setCmsUrl] = useState(() => readInitialSettings().cmsUrl);
  const [loadState, setLoadState] = useState<LoadState>({ status: "no-url" });

  // Pick up inspector changes sent by the extension.
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.action === "settings") {
        setCmsUrl((e.data.payload as WidgetSettings | undefined)?.cmsUrl);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Fetch trips from the CMS Public API whenever the URL changes.
  useEffect(() => {
    if (!cmsUrl) {
      setLoadState({ status: "no-url" });
      return;
    }

    const controller = new AbortController();
    setLoadState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(cmsUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const { trips, skipped } = parseTrips(await res.json());
        console.log("Travel blog: trips", trips);
        postMsg("trips", { trips });
        setLoadState({ status: "ready", trips, skipped });
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    })();

    return () => controller.abort();
  }, [cmsUrl]);

  return { loadState };
}
