import test from "node:test";
import assert from "node:assert/strict";
import {
  localPlaceMatches,
  searchPlaces,
  searchAddresses,
  censusAddressMatches,
} from "../src/location-search.js";
const restaurants = [
  {
    name: "Sample cafe",
    address: "123 Main St, Orlando, FL 32803",
    location: "Mills 50 · Orlando",
    coordinates: { latitude: 28.55, longitude: -81.36 },
  },
];
test("known ZIPs and neighborhoods resolve only to described catalog areas without network calls", async () => {
  const result = await searchPlaces("32803", restaurants, {
    fetcher: () => {
      throw Error("Unexpected network");
    },
  });
  assert.equal(result[0].latitude, 28.55);
  assert.match(result[0].source, /approximate area/);
  assert.equal(localPlaceMatches("Mills 50", restaurants).length, 1);
});
test("city search validates public provider results and caches repeated searches", async () => {
  let calls = 0;
  const fetcher = async (url) => {
    calls++;
    assert.match(url, /countryCode=US/);
    return {
      ok: true,
      json: async () => ({
        results: [
          {
            name: "Test City",
            admin1: "Florida",
            country: "United States",
            latitude: 28.5,
            longitude: -81.4,
          },
          { name: "Bad point", latitude: 999, longitude: 0 },
        ],
      }),
    };
  };
  const first = await searchPlaces("Example test city", [], { fetcher });
  first[0].label = "changed";
  const second = await searchPlaces("Example test city", [], { fetcher });
  assert.equal(second[0].label, "Test City, Florida, United States");
  assert.equal(calls, 1);
});
test("empty results and invalid input do not substitute an invented location", async () => {
  await assert.rejects(searchPlaces("x"), /Enter a city/);
  await assert.rejects(
    searchPlaces("No such place", [], {
      fetcher: async () => ({ ok: true, json: async () => ({ results: [] }) }),
    }),
    /No place found/,
  );
});

const censusReply = (label = "400 SOUTH ORANGE AVE, ORLANDO, FL, 32801") => ({
  result: {
    addressMatches: [
      { matchedAddress: label, coordinates: { x: -81.379, y: 28.536 } },
    ],
  },
});

test("address mode uses Census street matches, not an area centroid, and caches only in memory", async () => {
  let calls = 0;
  const fetcher = async (url, { signal }) => {
    calls++;
    const parsed = new URL(url);
    assert.equal(parsed.hostname, "geocoding.geo.census.gov");
    assert.equal(
      parsed.searchParams.get("address"),
      "400 South Orange Ave, Orlando, FL 32801",
    );
    assert.equal(parsed.searchParams.get("benchmark"), "Public_AR_Current");
    assert.equal(parsed.searchParams.get("format"), "json");
    assert.equal(signal, undefined);
    return { ok: true, json: async () => censusReply() };
  };
  const first = await searchPlaces(
    "400 South Orange Ave, Orlando, FL 32801",
    restaurants,
    { mode: "address", fetcher },
  );
  assert.equal(first[0].latitude, 28.536);
  assert.equal(first[0].precision, "address-range");
  assert.match(first[0].source, /Census.*estimate/);
  first[0].label = "changed";
  const second = await searchAddresses(
    "400 South Orange Ave, Orlando, FL 32801",
    { fetcher },
  );
  assert.equal(second[0].label, "400 SOUTH ORANGE AVE, ORLANDO, FL, 32801");
  assert.equal(calls, 1);
});

test("address parsing rejects invalid/missing points and never falls back to a city", () => {
  assert.deepEqual(
    censusAddressMatches({
      result: {
        addressMatches: [
          { matchedAddress: "bad", coordinates: { x: null, y: 28 } },
          { matchedAddress: "bad", coordinates: { x: -81, y: 200 } },
          { coordinates: { x: -81, y: 28 } },
        ],
      },
    }),
    [],
  );
  assert.deepEqual(censusAddressMatches({}), []);
});

test("address search rejects unsupported input, service errors and unmatched addresses", async () => {
  await assert.rejects(searchAddresses("Orlando"), /street number/);
  await assert.rejects(
    searchAddresses("PO Box 123, Orlando FL"),
    /street number/,
  );
  await assert.rejects(
    searchAddresses("111 Service Failure Ave, Orlando FL", {
      fetcher: async () => ({ ok: false }),
    }),
    /unavailable/,
  );
  await assert.rejects(
    searchAddresses("222 No Match St, Orlando FL", {
      fetcher: async () => ({
        ok: true,
        json: async () => ({ result: { addressMatches: [] } }),
      }),
    }),
    /No matching street/,
  );
});

test("aborted native address searches do not cache late results", async () => {
  const controller = new AbortController();
  await assert.rejects(
    searchAddresses("333 Cancelled St, Orlando FL", {
      signal: controller.signal,
      fetcher: async () => {
        controller.abort();
        return { ok: true, json: async () => censusReply() };
      },
    }),
    { name: "AbortError" },
  );
  let called = false;
  await assert.rejects(
    searchAddresses("444 Already Cancelled St, Orlando FL", {
      signal: controller.signal,
      fetcher: async () => {
        called = true;
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(called, false);
});

test("browser Census JSONP uses a generated callback and cleans up script and callback", async () => {
  const previous = globalThis.document;
  let removed = false,
    callback;
  globalThis.document = {
    createElement: () => ({
      remove() {
        removed = true;
      },
    }),
    head: {
      appendChild(script) {
        const url = new URL(script.src);
        assert.equal(url.searchParams.get("format"), "jsonp");
        callback = url.searchParams.get("callback");
        assert.match(callback, /^verifedCensus\d+_\d+$/);
        queueMicrotask(() => globalThis[callback](censusReply()));
      },
    },
  };
  try {
    const result = await searchAddresses("555 JSONP Test St, Orlando FL");
    assert.equal(result[0].longitude, -81.379);
    assert.equal(removed, true);
    assert.equal(globalThis[callback], undefined);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test("browser JSONP abort removes its callback and script", async () => {
  const previous = globalThis.document;
  let removed = false,
    callback;
  globalThis.document = {
    createElement: () => ({
      remove() {
        removed = true;
      },
    }),
    head: {
      appendChild(script) {
        callback = new URL(script.src).searchParams.get("callback");
      },
    },
  };
  try {
    const controller = new AbortController();
    const pending = searchAddresses("666 JSONP Cancelled St, Orlando FL", {
      signal: controller.signal,
    });
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(removed, true);
    assert.equal(globalThis[callback], undefined);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});
