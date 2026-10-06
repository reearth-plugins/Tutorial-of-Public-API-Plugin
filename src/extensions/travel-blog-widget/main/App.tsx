import { MapPin } from "lucide-react";

import useTravelBlog, { type LoadState } from "./hooks";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

function StatusText({ loadState }: { loadState: LoadState }) {
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
        <div className="flex flex-col gap-1">
          <p>
            Loaded {trips.length} {trips.length === 1 ? "trip" : "trips"}
          </p>
          {skipped > 0 && (
            <p className="text-muted-foreground">
              Skipped {skipped} without a valid location
            </p>
          )}
        </div>
      );
    }
  }
}

function App() {
  const { loadState } = useTravelBlog();

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="size-4" />
          Travel Blog
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm">
        <StatusText loadState={loadState} />
      </CardContent>
    </Card>
  );
}

export default App;
