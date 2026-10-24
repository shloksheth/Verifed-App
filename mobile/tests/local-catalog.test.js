import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  localRestaurants,
  localDishes,
  mergeLocalCatalog,
} from "../src/local-catalog.js";
import { assessDish, rankDishes } from "../src/domain.js";

test("district labels match saved Census geography rather than an assumed district", async () => {
  for (const restaurant of localRestaurants) {
    const evidence = JSON.parse(
      await readFile(
        new URL(
          `../../research/district-evidence/${restaurant.slug}.json`,
          import.meta.url,
        ),
      ),
    );
    const district =
      evidence.response.result.addressMatches[0]?.geographies?.[
        "119th Congressional Districts"
      ]?.[0];
    if (district) {
      assert.equal(restaurant.district.number, district.BASENAME);
      assert.equal(restaurant.district.congress, Number(district.CDSESSN));
      assert.equal(restaurant.district.sourceUrl, evidence.sourceUrl);
    } else assert.equal(restaurant.district, null);
    assert.equal(restaurant.confirmed, false);
  }
});

test("live UUID records replace bundled copies without breaking dish associations", () => {
  const restaurant = localRestaurants[0];
  const dish = localDishes[0];
  const { id, slug, name, confirmed, fictional, ...details } = restaurant;
  const merged = mergeLocalCatalog(
    [{ id: "server-restaurant", slug, name, confirmed, fictional, details }],
    [{ ...dish, id: "server-dish", restaurantId: "server-restaurant" }],
  );
  assert.equal(merged.restaurants.length, localRestaurants.length);
  assert.equal(merged.dishes.length, localDishes.length);
  assert.equal(merged.restaurants[0].address, restaurant.address);
  assert.equal(merged.restaurants[0].id, "server-restaurant");
  assert.equal(merged.dishes[0].id, "server-dish");
  for (const entry of merged.dishes.filter((entry) =>
    entry.catalogKey.startsWith(restaurant.slug),
  ))
    assert.equal(entry.restaurantId, "server-restaurant");
});

test("published empty allergen cells never become an allergen-free recommendation", () => {
  const rice = localDishes.find((dish) =>
    dish.catalogKey.endsWith("brown-rice"),
  );
  const result = assessDish(
    { ...rice, informationComplete: true },
    { allergies: ["Milk"], restrictions: [] },
  );
  assert.equal(result.level, "unknown");
  assert.match(result.reasons.join(" "), /not your complete order/);
  assert.equal(rice.price, null);
});

test("empty cloud ingredient lists do not hide reviewed facts or overwrite nonempty updates", () => {
  const local = localDishes.find((dish) => dish.catalogKey === "chipotle-south-orange-sour-cream");
  const stale = { ...local, id: "cloud-cream", ingredients: [], description: "One component; review the complete order.",
    provenance: { ...local.provenance, ingredientUrl: null, evidenceNote: "Older menu row" } };
  const merged = mergeLocalCatalog([], [stale]).dishes.find((dish) => dish.id === "cloud-cream");
  assert.deepEqual(merged.ingredients, ["Cultured cream"]);
  assert.equal(merged.provenance.ingredientUrl, local.provenance.ingredientUrl);
  assert.equal(merged.description, local.description);
  assert.equal(merged.cloudBacked, true);
  assert.equal(assessDish(merged, { allergies: ["Milk"] }).level, "conflict");

  const updated = { ...stale, ingredients: ["Restaurant-supplied updated ingredient"], description: "Updated restaurant detail" };
  const kept = mergeLocalCatalog([], [updated]).dishes.find((dish) => dish.id === "cloud-cream");
  assert.deepEqual(kept.ingredients, updated.ingredients);
  assert.equal(kept.description, updated.description);
  assert.equal(kept.provenance.ingredientUrl, null);
});

test("Hawkers missing wheat coverage stays unknown; positive milk evidence conflicts", () => {
  const bao = localDishes.find((dish) =>
    dish.catalogKey.endsWith("seoul-chicken-bao"),
  );
  const wheat = assessDish(bao, { allergies: ["Wheat"], restrictions: [] });
  assert.equal(wheat.level, "unknown");
  assert.match(wheat.reasons.join(" "), /Source does not cover: Wheat/);
  const milk = assessDish(bao, { allergies: ["Milk"], restrictions: [] });
  assert.equal(milk.level, "conflict");
  assert.deepEqual(milk.conflicts, ["Milk"]);
});

test("ingredient evidence catches egg in almond chicken and sorting never rewards a conflict", () => {
  const chicken = localDishes.find((dish) =>
    dish.catalogKey.endsWith("almond-chicken"),
  );
  const rice = localDishes.find((dish) =>
    dish.catalogKey.endsWith("brown-rice"),
  );
  assert.equal(assessDish(chicken, { allergies: ["Egg"] }).level, "conflict");
  assert.equal(
    rankDishes([chicken, rice], { allergies: ["Egg"], likes: [] })[0].id,
    rice.id,
  );
  const noodles = localDishes.find((dish) =>
    dish.catalogKey.endsWith("sweet-potato-noodles"),
  );
  assert.equal(
    assessDish(noodles, { allergies: ["Sesame"] }).level,
    "conflict",
  );
  assert.ok(
    noodles.ingredients.some(
      (item) => item.toLowerCase() === "toasted white sesame seeds",
    ),
  );
});

test("opening a saved demo refreshes old allergen facts without losing stable IDs", () => {
  const dish = { ...localDishes[0], id: "saved-id", allergens: ["Soy"] };
  const merged = mergeLocalCatalog(localRestaurants, [dish], {
    preferBundled: true,
  });
  assert.equal(merged.dishes[0].id, "saved-id");
  assert.deepEqual(merged.dishes[0].allergens, localDishes[0].allergens);
  assert.equal(merged.dishes[0].cloudBacked, false);
});

test("the active CAC catalog has twenty-five real locations with traceable, clean food records", () => {
  assert.equal(localRestaurants.length, 25);
  assert.equal(
    new Set(localDishes.map((dish) => dish.catalogKey)).size,
    localDishes.length,
  );
  assert.ok(localDishes.length > 1000);
  for (const restaurant of localRestaurants) {
    assert.equal(restaurant.fictional, false);
    assert.equal(restaurant.confirmed, false);
    assert.match(restaurant.menuUrl, /^https?:\/\//);
    assert.ok(restaurant.menuCoverage);
    assert.ok(restaurant.coordinates);
    assert.ok(localDishes.some((dish) => dish.restaurantId === restaurant.id));
  }
  for (const dish of localDishes) {
    assert.doesNotMatch(dish.name, /Image: item|OUT OF STOCK|\uE200/);
    assert.doesNotMatch(dish.category, /From The Bar|Happy Hour · Cans/);
    assert.ok(dish.provenance.evidenceNote);
    assert.equal(dish.informationComplete, false);
  }
});

test("retired Tako Cheena stays out of browsing when old cloud records arrive", () => {
  const merged = mergeLocalCatalog([{ id: "retired-server-id", slug: "tako-cheena-mills", name: "Tako Cheena" }], [{ id: "old-dish", restaurantId: "retired-server-id", catalogKey: "tako-cheena-mills-test" }]);
  assert.ok(!merged.restaurants.some((row) => row.slug === "tako-cheena-mills"));
  assert.ok(!merged.dishes.some((row) => row.id === "old-dish"));
  for (const slug of ["hawkers-orlando", "chipotle-south-orange", "pizza-bruno-curry"])
    assert.ok(merged.restaurants.some((row) => row.slug === slug));
});
