import test from "node:test";
import assert from "node:assert/strict";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { featuredRestaurants, featuredMenuCoverKeys } from "../src/featured-menus.js";
import { localFoodPhotoMetadata } from "../src/local-food-photo-metadata.js";
import { localPhotoKeyFor, sharedChainPhotoKeys } from "../src/local-photo-key.js";
import { dietaryMenuStatus } from "../src/menu-filter.js";

test("all five featured menus have local images for their entire imported food inventory", () => {
  const featured = featuredRestaurants(localRestaurants);
  assert.equal(featured.length, 5);
  const expectedCounts = [116, 61, 49, 35, 26];
  featured.forEach((restaurant, index) => {
    assert.ok(localFoodPhotoMetadata[featuredMenuCoverKeys[restaurant.slug]], `Local banner: ${restaurant.slug}`);
    const menu = localDishes.filter((dish) => dish.restaurantId === restaurant.id);
    assert.equal(menu.length, expectedCounts[index]);
    for (const dish of menu) {
      const photo = localFoodPhotoMetadata[localPhotoKeyFor(dish)];
      assert.ok(photo?.path.startsWith("assets/food/"), dish.catalogKey);
      // Complete photos must not turn incomplete ingredient evidence into a
      // blanket claim that the dish is safe for every allergy.
      assert.equal(dish.informationComplete, false);
    }
  });
});

test("Taco Bell locations share only the same reviewed product, with no extra image files", () => {
  assert.equal(Object.keys(sharedChainPhotoKeys).length, 232);
  for (const [branchKey, sourceKey] of Object.entries(sharedChainPhotoKeys)) {
    const dish = localDishes.find((row) => row.catalogKey === branchKey);
    const source = localDishes.find((row) => row.catalogKey === sourceKey);
    assert.equal(dish.name, source.name);
    assert.deepEqual(dish.ingredients, source.ingredients);
    assert.equal(localPhotoKeyFor(dish), sourceKey);
    assert.ok(localFoodPhotoMetadata[sourceKey], branchKey);
  }
  const dish = localDishes.find((row) => row.restaurantId === "taco-bell-east-colonial");
  assert.equal(localPhotoKeyFor({ ...dish, ingredients: ["changed recipe"] }), dish.catalogKey);
  assert.equal(localPhotoKeyFor({ ...dish, name: "Different product" }), dish.catalogKey);
});

test("featured menus retain their order when database UUIDs replace bundled IDs", () => {
  const live = localRestaurants.map((restaurant, index) => ({ ...restaurant, id: `live-${index}` })).reverse();
  assert.deepEqual(featuredRestaurants(live).map((restaurant) => restaurant.slug),
    ["taco-bell-south-orange", "loving-hut-orlando", "hawkers-orlando", "fresh-kitchen-waterford", "chipotle-south-orange"]);
});

test("new sourced ingredient details remain traceable without inventing allergen absence", () => {
  const cream = localDishes.find((dish) => dish.catalogKey === "chipotle-south-orange-sour-cream");
  const greens = localDishes.find((dish) => dish.catalogKey === "chipotle-south-orange-supergreens");
  assert.ok(cream.ingredients.length && greens.ingredients.length);
  assert.match(cream.provenance.ingredientUrl, /^https:\/\/www\.chipotle\.com\//);
  assert.match(greens.provenance.ingredientUrl, /^https:\/\/newsroom\.chipotle\.com\//);
  assert.equal(dietaryMenuStatus(cream, { allergies: ["Milk"] }).level, "conflict");
  assert.equal(dietaryMenuStatus(greens, { allergies: ["Milk"] }).level, "unknown");
  assert.equal(dietaryMenuStatus(greens, { restrictions: ["Vegan"] }).level, "match");
});
