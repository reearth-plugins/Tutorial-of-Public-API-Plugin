// Data contract for travel blog entries. Every CMS item is normalized into a
// Trip here, so the UI and the extension logic never touch the raw CMS shape.

/** One travel blog entry, flattened and ready for the map and the list. */
export type Trip = {
  id: string;
  /** "YYYY-MM", taken from the CMS date string as-is (no timezone shift). */
  date: string;
  country: string;
  city: string;
  food: string;
  lng: number;
  lat: number;
};

/** Raw item shape returned by the CMS Public API for the travel model. */
type CmsItem = {
  id?: unknown;
  date?: unknown;
  country?: unknown;
  city?: unknown;
  food?: unknown;
  location?: { type?: unknown; coordinates?: unknown };
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Convert one CMS item into a Trip, or undefined if it has no valid location. */
export function normalizeTrip(item: unknown): Trip | undefined {
  const raw = (item ?? {}) as CmsItem;
  const coordinates = raw.location?.coordinates;
  if (raw.location?.type !== "Point" || !Array.isArray(coordinates)) return;

  // GeoJSON order is [lng, lat].
  const [lng, lat] = coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") return;

  const id = asString(raw.id);
  if (!id) return;

  return {
    id,
    date: asString(raw.date).slice(0, 7),
    country: asString(raw.country),
    city: asString(raw.city),
    food: asString(raw.food),
    lng,
    lat,
  };
}

/** Parse a Public API response body into trips, counting skipped items. */
export function parseTrips(body: unknown): { trips: Trip[]; skipped: number } {
  const results = (body as { results?: unknown })?.results;
  if (!Array.isArray(results)) {
    throw new Error("Unexpected response: missing results array");
  }

  const trips: Trip[] = [];
  for (const item of results) {
    const trip = normalizeTrip(item);
    if (trip) trips.push(trip);
  }
  return { trips, skipped: results.length - trips.length };
}
