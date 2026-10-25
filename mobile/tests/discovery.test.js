import test from "node:test";
import assert from "node:assert/strict";
import { ALLERGENS } from "../src/data.js";
import {
  discoverRestaurants,
  distanceMilesBetween,
  validCoordinates,
} from "../src/discovery.js";

const place = (id, extra = {}) => ({
  id,
  slug: id,
  name: id,
  fictional: false,
  cuisine: "Indian",
  coordinates: { latitude: 28.54, longitude: -81.38 },
  ...extra,
});
const food = (restaurantId, extra = {}) => ({
  id: `${restaurantId}-dish`,
  restaurantId,
  name: "Vegetable bowl",
  tags: [],
  allergens: [],
  provenance: { freeFromAllergens: [] },
  ...extra,
});
const milkProfile = { allergies: ["Milk"], restrictions: [] };

test("ingredient search finds published ingredients even when absent from names and descriptions", () => {
  const restaurants = [place("noodles"), place("other")];
  const dishes = [
    food("noodles", {
      name: "Sweet Potato Noodles",
      ingredients: ["Cilantro", "Sweet potato"],
    }),
    food("other"),
  ];
  const results = discoverRestaurants({
    restaurants,
    dishes,
    query: "CILANTRO",
    center: null,
  });
  assert.deepEqual(
    results.map((result) => result.restaurant.id),
    ["noodles"],
  );
  assert.deepEqual(
    discoverRestaurants({
      restaurants,
      dishes,
      query: "not-on-any-menu",
      center: null,
    }),
    [],
  );
});

test("haversine distance is bounded, handles zero and rejects invalid coordinates", () => {
  assert.equal(
    distanceMilesBetween(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0 },
    ),
    0,
  );
  assert.ok(
    Math.abs(
      distanceMilesBetween(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ) - 69.093,
    ) < 0.01,
  );
  assert.ok(
    Number.isFinite(
      distanceMilesBetween(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 180 },
      ),
    ),
  );
  assert.equal(validCoordinates({ latitude: 91, longitude: 0 }), false);
  assert.equal(validCoordinates({ latitude: null, longitude: 0 }), false);
  assert.equal(validCoordinates({ latitude: "", longitude: 0 }), false);
  assert.equal(distanceMilesBetween({}, {}), null);
});

test("radius filtering uses actual coordinates and never treats an unknown position as nearby", () => {
  const restaurants = [
    place("near"),
    place("far", { coordinates: { latitude: 29.54, longitude: -81.38 } }),
    place("unknown", { coordinates: null }),
  ];
  const rows = discoverRestaurants({
    restaurants,
    center: restaurants[0].coordinates,
    radiusMiles: 5,
  });
  assert.deepEqual(
    rows.map((row) => row.restaurant.id),
    ["near"],
  );
  assert.equal(rows[0].distanceMiles, 0);
  const noCenter = discoverRestaurants({ restaurants });
  assert.equal(noCenter.length, 3);
  assert.ok(noCenter.every((row) => row.distanceMiles === null));
});

test("supported dietary options outrank a highly rated all-conflict venue", () => {
  const restaurants = [
    place("old favorite"),
    place("possible"),
    place("supported"),
  ];
  const dishes = [
    food("old favorite", { allergens: ["Milk"] }),
    food("possible"),
    food("supported", { provenance: { freeFromAllergens: ["Milk"] } }),
  ];
  const rows = discoverRestaurants({
    restaurants,
    dishes,
    profile: milkProfile,
    meals: [{ restaurantId: "old favorite", rating: 5, tags: [] }],
  });
  assert.deepEqual(
    rows.map((row) => row.restaurant.id),
    ["supported", "possible", "old favorite"],
  );
  assert.equal(rows[0].supportedCount, 1);
  assert.equal(rows[1].possibleCount, 1);
  assert.equal(rows[2].conflictCount, 1);
  assert.ok(
    !rows[2].reasons.some((reason) =>
      /Your meals|highly rated|rated .*highly/.test(reason),
    ),
  );
});

test("dietary modes separate possible information, reported support and selected-allergen absence", () => {
  const restaurants = [place("possible"), place("reported"), place("conflict")];
  const dishes = [
    food("possible"),
    food("reported", { provenance: { freeFromAllergens: ["Milk"] } }),
    food("conflict", { ingredientHints: { possibleAllergens: ["Milk"] } }),
  ];
  const args = { restaurants, dishes, profile: milkProfile };
  assert.deepEqual(
    discoverRestaurants({ ...args, dietMode: "options" }).map(
      (row) => row.restaurant.id,
    ),
    ["reported", "possible"],
  );
  assert.deepEqual(
    discoverRestaurants({ ...args, dietMode: "reported" }).map(
      (row) => row.restaurant.id,
    ),
    ["reported"],
  );
  assert.deepEqual(
    discoverRestaurants({ ...args, dietMode: "selected-free" }).map(
      (row) => row.restaurant.id,
    ),
    ["reported"],
  );
  assert.deepEqual(
    discoverRestaurants({ restaurants, dishes, dietMode: "options" }),
    [],
  );
  assert.deepEqual(
    discoverRestaurants({
      restaurants,
      dishes,
      profile: { restrictions: ["Vegan"] },
      dietMode: "selected-free",
    }),
    [],
  );
});

test("all-nine requires explicit absence of all nine and rejects ingredient contradictions", () => {
  const restaurants = [
    place("complete claims"),
    place("coverage only"),
    place("vegan only"),
    place("contradictory"),
  ];
  const dishes = [
    food("complete claims", { provenance: { freeFromAllergens: ALLERGENS } }),
    food("coverage only", { provenance: { coverage: ALLERGENS } }),
    food("vegan only", { tags: ["Vegan"] }),
    food("contradictory", {
      provenance: { freeFromAllergens: ALLERGENS },
      ingredientHints: { allergens: ["Egg"] },
    }),
  ];
  const rows = discoverRestaurants({
    restaurants,
    dishes,
    dietMode: "all-nine",
  });
  assert.deepEqual(
    rows.map((row) => row.restaurant.id),
    ["complete claims"],
  );
  assert.equal(rows[0].allNineCount, 1);
});

test("source-supported allergy claims must also meet selected dietary restrictions", () => {
  const restaurants = [place("milk free"), place("vegan milk free")];
  const dishes = [
    food("milk free", { provenance: { freeFromAllergens: ["Milk"] } }),
    food("vegan milk free", {
      tags: ["Vegan"],
      provenance: { freeFromAllergens: ["Milk"] },
    }),
  ];
  const rows = discoverRestaurants({
    restaurants,
    dishes,
    profile: { allergies: ["Milk"], restrictions: ["Vegan"] },
    dietMode: "selected-free",
  });
  assert.deepEqual(
    rows.map((row) => row.restaurant.id),
    ["vegan milk free"],
  );
});

test("real positive meal history can recommend the same venue and related cuisines", () => {
  const restaurants = [
    place("Woodlands"),
    place("Bombay"),
    place("Other", { cuisine: "Tacos" }),
  ];
  const dishes = restaurants.map((restaurant) => food(restaurant.id));
  const rows = discoverRestaurants({
    restaurants,
    dishes,
    meals: [
      { restaurantName: "woodlands", rating: 4, tags: [] },
      { restaurantId: "Woodlands", rating: 5, tags: [] },
    ],
  });
  assert.deepEqual(
    rows.map((row) => row.restaurant.id),
    ["Woodlands", "Bombay", "Other"],
  );
  assert.ok(rows[0].reasons.includes("Your meals here average 4.5/5"));
  assert.ok(rows[1].reasons.includes("You rated Indian meals highly"));
  assert.ok(
    !rows[2].reasons.some((reason) => /Your meals|rated .*highly/.test(reason)),
  );
});

test("empty or low-rated history never manufactures a personalized recommendation", () => {
  const restaurants = [place("A")],
    dishes = [food("A")];
  const initial = discoverRestaurants({ restaurants, dishes });
  assert.deepEqual(initial[0].reasons, ["Explore this published local menu"]);
  const lower = discoverRestaurants({
    restaurants,
    dishes,
    meals: [
      { restaurantId: "A", rating: 5, tags: ["Vegan"] },
      { restaurantId: "A", rating: 1, tags: ["Vegan"] },
      { restaurantId: "A", rating: "invalid", tags: [] },
    ],
  });
  assert.ok(
    !lower[0].reasons.some((reason) =>
      /Your meals|rated .*highly/.test(reason),
    ),
  );
});

test("cuisine and food search are case-insensitive and source records remain unchanged", () => {
  const restaurants = [place("A"), place("B", { cuisine: "Mexican" })];
  const dishes = [
    food("A", { name: "Masala Dosa" }),
    food("B", { name: "Taco" }),
  ];
  const snapshot = JSON.stringify({ restaurants, dishes });
  const rows = discoverRestaurants({
    restaurants,
    dishes,
    cuisine: "indian",
    query: "DOSA",
  });
  assert.deepEqual(
    rows.map((row) => row.restaurant.id),
    ["A"],
  );
  assert.equal(JSON.stringify({ restaurants, dishes }), snapshot);
});

test("nearest and name sorts use their advertised order without made-up distances", () => {
  const restaurants = [
    place("Z", { coordinates: { latitude: 0, longitude: 0 } }),
    place("A", { coordinates: { latitude: 0, longitude: 0.1 } }),
  ];
  const args = {
    restaurants,
    center: { latitude: 0, longitude: 0 },
    radiusMiles: 25,
  };
  assert.deepEqual(
    discoverRestaurants({ ...args, sort: "nearest" }).map(
      (row) => row.restaurant.id,
    ),
    ["Z", "A"],
  );
  assert.deepEqual(
    discoverRestaurants({ ...args, sort: "name" }).map(
      (row) => row.restaurant.id,
    ),
    ["A", "Z"],
  );
});

test("branches stay separate and fictional sample venues never enter public discovery", () => {
  const restaurants = [
    place("taco-one", { chainId: "taco-bell" }),
    place("taco-two", { chainId: "taco-bell" }),
    place("sample", { fictional: true }),
  ];
  const rows = discoverRestaurants({
    restaurants,
    dishes: restaurants.map((restaurant) => food(restaurant.id)),
  });
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].restaurant.id, rows[1].restaurant.id);
});

test("an ambiguous typed chain name does not invent a visit to one branch", () => {
  const restaurants = [
    place("branch-one", { name: "Taco Bell", cuisine: "Mexican" }),
    place("branch-two", { name: "Taco Bell", cuisine: "Mexican" }),
  ];
  const rows = discoverRestaurants({
    restaurants,
    dishes: restaurants.map((restaurant) => food(restaurant.id)),
    meals: [{ restaurantName: "Taco Bell", rating: 5 }],
  });
  assert.ok(
    rows.every(
      (row) =>
        !row.reasons.some((reason) => /Your meals|You rated/.test(reason)),
    ),
  );
});
