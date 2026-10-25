import test from "node:test";
import assert from "node:assert/strict";
import {
  homeCuisine,
  homeNeeds,
  homeRestaurants,
} from "../src/home-content.js";
import { localRestaurants } from "../src/local-catalog.js";

test("Home opens real Hawkers/Chipotle records even when cloud IDs change", () => {
  const live = localRestaurants.map((place, index) => ({
    ...place,
    id: `cloud-${index}`,
  }));
  const selected = homeRestaurants(live.reverse());
  assert.deepEqual(
    selected.map((place) => place.slug),
    ["hawkers-orlando", "chipotle-south-orange"],
  );
  assert.ok(selected.every((place) => place.id.startsWith("cloud-")));
  assert.deepEqual(
    homeRestaurants(selected.map((place) => ({ ...place, fictional: true }))),
    [],
  );
  assert.deepEqual(homeRestaurants([]), []);
});

test("Home shows only actual selected needs and distinguishes allergies from restrictions", () => {
  assert.deepEqual(homeNeeds(), []);
  const profile = {
    restrictions: ["Vegetarian (no eggs)", "Vegetarian (no eggs)"],
    allergies: ["Peanuts", "Honey"],
  };
  const original = structuredClone(profile);
  assert.deepEqual(
    homeNeeds(profile).map((need) => need.label),
    ["Vegetarian (no eggs)", "Peanut allergy", "Honey allergy"],
  );
  assert.deepEqual(profile, original);
});

test("Home cuisine links resolve only to cuisines that exist in the live catalog", () => {
  const cuisines = [...new Set(localRestaurants.map((place) => place.cuisine))];
  for (const label of ["Indian", "Mexican", "Vegan"])
    assert.equal(homeCuisine(cuisines, label.toLowerCase()), label);
  assert.equal(homeCuisine(cuisines, "Unavailable cuisine"), null);
  assert.equal(homeCuisine(cuisines, null), null);
});
