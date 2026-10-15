import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

import type { Trip } from "../trips";

import useTravelBlog, { type LoadState } from "./hooks";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

type TripListProps = {
  trips: Trip[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
};

function TripList({ trips, selectedId, onSelect }: TripListProps) {
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  // Keep the highlighted row visible, e.g. after a marker click on the map.
  useEffect(() => {
    if (!selectedId) return;
    rowRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <ul className="-mx-2 flex max-h-[300px] flex-col gap-0.5 overflow-y-auto">
      {trips.map((trip) => {
        const selected = trip.id === selectedId;
        return (
          <li key={trip.id}>
            <button
              type="button"
              ref={(el) => {
                if (el) rowRefs.current.set(trip.id, el);
                else rowRefs.current.delete(trip.id);
              }}
              onClick={() => onSelect(trip.id)}
              aria-pressed={selected}
              className={cn(
                "w-full rounded-md px-2 py-1.5 text-left hover:bg-accent",
                selected && "bg-orange-500/10 ring-1 ring-inset ring-orange-500/40"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {[trip.date, trip.country].filter(Boolean).join(" · ")}
              </div>
              <div>{[trip.city, trip.food].filter(Boolean).join(" — ")}</div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type StatusTextProps = {
  loadState: LoadState;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
};

function StatusText({ loadState, selectedId, onSelect }: StatusTextProps) {
  switch (loadState.status) {
    case "no-url":
      return (
        <p className="text-muted-foreground">
          Set the CMS Public API URL in the widget settings.
        </p>
      );
    case "loading":
      return <p className="text-muted-foreground">Loading trips…</p>;
    case "error":
      return (
        <p className="text-destructive">
          Could not load trips: {loadState.message}
        </p>
      );
    case "ready": {
      const { trips, skipped } = loadState;
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              Loaded {trips.length} {trips.length === 1 ? "trip" : "trips"}
            </p>
            {skipped > 0 && (
              <p className="text-muted-foreground">
                Skipped {skipped} without a valid location
              </p>
            )}
          </div>
          {trips.length > 0 && (
            <TripList
              trips={trips}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </div>
      );
    }
  }
}

function App() {
  const { loadState, selectedId, flyTo } = useTravelBlog();

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="size-4" />
          Travel Blog
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm">
        <StatusText
          loadState={loadState}
          selectedId={selectedId}
          onSelect={flyTo}
        />
      </CardContent>
    </Card>
  );
}

export default App;
