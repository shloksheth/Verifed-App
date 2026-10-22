// Search is explicit: typing never sends a network request. Neighborhood and
// catalog ZIP lookups can be resolved locally; other city/ZIP searches use GeoNames.
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const valid = (point) =>
  Number.isFinite(point?.latitude) &&
  Number.isFinite(point?.longitude) &&
  Math.abs(point.latitude) <= 90 &&
  Math.abs(point.longitude) <= 180;
export const ORLANDO_CENTER = {
  latitude: 28.53834,
  longitude: -81.37924,
  label: "Orlando, FL · city center",
  source: "GeoNames / Open-Meteo",
};
const cached = new Map();
const addressCache = new Map();
const censusEndpoint =
  "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
let callbackSequence = 0;

function abortedSearch() {
  const error = new Error("Location search was cancelled.");
  error.name = "AbortError";
  return error;
}

// Census officially supports JSONP for browsers because this endpoint has no
// CORS support. The service URL and callback name are ours, never user code.
function censusJsonp(url, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortedSearch());
    const callback = `verifedCensus${Date.now()}_${++callbackSequence}`;
    const script = document.createElement("script");
    let settled = false;
    let timer;
    function finish(error, body) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      script.remove();
      delete globalThis[callback];
      if (error) reject(error);
      else resolve(body);
    }
    const cancel = () => finish(abortedSearch());
    globalThis[callback] = (body) => finish(null, body);
    script.async = true;
    script.src = `${url}&format=jsonp&callback=${callback}`;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.onerror = () =>
      finish(
        new Error("Address search is unavailable. Try a city or ZIP instead."),
      );
    timer = setTimeout(
      () => finish(new Error("Address search timed out. Try again.")),
      11000,
    );
    signal?.addEventListener("abort", cancel, { once: true });
    document.head.appendChild(script);
  });
}

export function censusAddressMatches(body) {
  const matches = body?.result?.addressMatches;
  if (!Array.isArray(matches)) return [];
  return matches.flatMap((match) => {
    const point = {
      latitude: match?.coordinates?.y,
      longitude: match?.coordinates?.x,
    };
    if (!valid(point) || typeof match.matchedAddress !== "string") return [];
    return [
      {
        ...point,
        label: match.matchedAddress,
        source: "U.S. Census Bureau · address-range estimate",
        precision: "address-range",
      },
    ];
  });
}

export async function searchAddresses(query, { signal, fetcher = fetch } = {}) {
  const address = String(query || "").trim();
  if (
    address.length < 8 ||
    address.length > 180 ||
    !/^\d+\S*\s+.*[a-z]/i.test(address)
  )
    throw new Error(
      "Enter a U.S. street number and street, plus city/state or ZIP.",
    );
  if (signal?.aborted) throw abortedSearch();
  const key = normalize(address);
  if (addressCache.has(key))
    return addressCache.get(key).map((point) => ({ ...point }));
  const url =
    censusEndpoint +
    "?" +
    new URLSearchParams({
      address,
      benchmark: "Public_AR_Current",
    });
  let body;
  if (typeof document !== "undefined" && fetcher === fetch) {
    body = await censusJsonp(url, signal);
  } else {
    const response = await fetcher(`${url}&format=json`, { signal });
    if (!response.ok)
      throw new Error(
        "Address search is unavailable. Try a city or ZIP instead.",
      );
    body = await response.json();
  }
  if (signal?.aborted) throw abortedSearch();
  const choices = censusAddressMatches(body);
  if (!choices.length)
    throw new Error(
      "No matching street address found. Include city/state or ZIP, or try an area search.",
    );
  if (addressCache.size >= 20)
    addressCache.delete(addressCache.keys().next().value);
  addressCache.set(key, choices);
  return choices.map((point) => ({ ...point }));
}

export function localPlaceMatches(query, restaurants = []) {
  const input = normalize(query);
  if (!input) return [];
  const exact = restaurants.filter(
    (restaurant) =>
      valid(restaurant.coordinates) &&
      [restaurant.name, restaurant.address].some(
        (value) => normalize(value) === input,
      ),
  );
  if (exact.length)
    return exact.map((restaurant) => ({
      ...restaurant.coordinates,
      label: restaurant.address,
      source: "Published address / source geocode",
    }));
  const area = restaurants.filter((restaurant) => {
    if (!valid(restaurant.coordinates)) return false;
    const zip = restaurant.address?.match(/\bFL\s+(\d{5})\b/i)?.[1];
    const neighborhood = String(restaurant.location || "")
      .split("·")[0]
      .trim();
    return input === zip || input === normalize(neighborhood);
  });
  if (area.length && input !== "orlando")
    return [
      {
        latitude:
          area.reduce((sum, r) => sum + r.coordinates.latitude, 0) /
          area.length,
        longitude:
          area.reduce((sum, r) => sum + r.coordinates.longitude, 0) /
          area.length,
        label: `Near catalog restaurants · ${query.trim()}`,
        source:
          "Center of catalog address points; approximate area, not a ZIP boundary",
      },
    ];
  if (["orlando", "orlando fl", "orlando florida"].includes(input))
    return [{ ...ORLANDO_CENTER }];
  return [];
}

export async function searchPlaces(
  query,
  restaurants = [],
  { signal, fetcher = fetch, mode = "area" } = {},
) {
  if (mode === "address") return searchAddresses(query, { signal, fetcher });
  const name = String(query || "").trim();
  if (name.length < 2 || name.length > 100)
    throw new Error(
      "Enter a city, ZIP code, or catalog neighborhood (2–100 characters).",
    );
  const local = localPlaceMatches(name, restaurants);
  if (local.length) return local;
  const key = normalize(name);
  if (cached.has(key)) return cached.get(key).map((point) => ({ ...point }));
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?" +
    new URLSearchParams({
      name,
      count: "6",
      language: "en",
      format: "json",
      countryCode: "US",
    });
  const response = await fetcher(url, { signal });
  if (!response.ok)
    throw new Error(
      "Location search is unavailable. Try an Orlando neighborhood or ZIP in the catalog.",
    );
  const body = await response.json();
  const choices = (body.results || []).filter(valid).map((place) => ({
    latitude: place.latitude,
    longitude: place.longitude,
    label: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
    source: "GeoNames / Open-Meteo",
  }));
  if (!choices.length)
    throw new Error(
      "No place found. Try a city or ZIP code, such as Orlando, FL or 32803.",
    );
  if (cached.size >= 50) cached.delete(cached.keys().next().value);
  cached.set(key, choices);
  return choices.map((point) => ({ ...point }));
}
