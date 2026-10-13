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

/** Convert raw CMS items into trips, counting the ones that were skipped. */
export function parseTrips(items: unknown[]): {
  trips: Trip[];
  skipped: number;
} {
  const trips: Trip[] = [];
  for (const item of items) {
    const trip = normalizeTrip(item);
    if (trip) trips.push(trip);
  }
  return { trips, skipped: items.length - trips.length };
}

/** Items requested per page, unless the URL already sets perPage. */
const PER_PAGE = 100;
/** Upper bound on pages, so a misbehaving API can't loop forever. */
const MAX_PAGES = 100;

/** One page of a Public API response (page metadata only comes with ?page=). */
type CmsPage = {
  results?: unknown;
  totalCount?: unknown;
  hasMore?: unknown;
};

/**
 * Fetch every page of a CMS Public API model and return all raw items.
 * Without this, items beyond the first page would be silently dropped.
 */
export async function fetchAllItems(
  url: string,
  signal?: AbortSignal
): Promise<unknown[]> {
  const items: unknown[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const pageUrl = new URL(url);
    pageUrl.searchParams.set("page", String(page));
    if (!pageUrl.searchParams.has("perPage")) {
      pageUrl.searchParams.set("perPage", String(PER_PAGE));
    }

    const res = await fetch(pageUrl, { signal });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);

    const body = (await res.json()) as CmsPage;
    if (!Array.isArray(body?.results)) {
      throw new Error("Unexpected response: missing results array");
    }
    items.push(...body.results);

    const done =
      body.results.length === 0 ||
      body.hasMore === false ||
      (typeof body.totalCount === "number" && items.length >= body.totalCount);
    if (done) return items;
  }

  throw new Error(`Too many pages (more than ${MAX_PAGES})`);
}
