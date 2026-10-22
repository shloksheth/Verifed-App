import test from "node:test";
import assert from "node:assert/strict";
import { ALLERGENS, MAJOR_ALLERGENS, RESTRICTIONS } from "../src/data.js";
import { ingredientHints } from "../src/ingredient-hints.js";
import { dietaryMenuStatus } from "../src/menu-filter.js";
import { assessDish } from "../src/domain.js";
import { discoverRestaurants } from "../src/discovery.js";

const dish = (name, extra = {}) => {
  const item = {
    name,
    ingredients: [],
    allergens: [],
    tags: [],
    informationComplete: false,
    ...extra,
  };
  return { ...item, ingredientHints: ingredientHints(item) };
};

test("extra profile choices do not redefine the nine major allergens", () => {
  assert.equal(MAJOR_ALLERGENS.length, 9);
  assert.ok(!MAJOR_ALLERGENS.includes("Honey"));
  assert.ok(ALLERGENS.includes("Honey"));
  assert.ok(RESTRICTIONS.includes("No garlic or onion"));
  assert.ok(RESTRICTIONS.includes("Vegetarian (no eggs)"));
});

test("named honey conflicts in dietary menus and dish details, including a contradictory vegan label", () => {
  for (const tags of [[], ["Vegan"]]) {
    const item = dish("Hot honey carrots", { tags });
    assert.equal(
      dietaryMenuStatus(item, { allergies: ["Honey"] }).level,
      "conflict",
    );
    assert.equal(assessDish(item, { allergies: ["Honey"] }).level, "conflict");
  }
  for (const name of [
    "Honeydew melon",
    "Honey-free sauce",
    "Vegan honey alternative",
    "Sauce without honey",
  ])
    assert.ok(!dish(name).ingredientHints.allergens.includes("Honey"));
  assert.equal(
    dietaryMenuStatus(dish("Rice"), { allergies: ["Honey"] }).level,
    "unknown",
  );
});

test("garlic and onion avoidance flags published ingredients and respects simple exclusions", () => {
  const profile = { restrictions: ["No garlic or onion"] };
  for (const name of [
    "Garlic naan",
    "Onion powder",
    "Green onions",
    "Scallion rice",
    "Shallot dressing",
  ]) {
    const item = dish(name, { tags: ["Vegetarian"] });
    assert.equal(dietaryMenuStatus(item, profile).level, "conflict");
    assert.equal(assessDish(item, profile).level, "conflict");
  }
  for (const name of [
    "Rice without garlic or onion",
    "No onion rice",
    "Garlic-free rice",
  ])
    assert.equal(dietaryMenuStatus(dish(name), profile).level, "unknown");
  assert.equal(
    dietaryMenuStatus(dish("Rice", { tags: ["Vegan"] }), profile).level,
    "unknown",
  );
  assert.equal(
    dietaryMenuStatus(dish("Rice", { tags: ["No garlic or onion"] }), profile)
      .level,
    "match",
  );
});

test("vegetarian without eggs rejects eggs, recipe clues and meat while allowing dairy", () => {
  const profile = { restrictions: ["Vegetarian (no eggs)"] };
  for (const item of [
    dish("Egg fried rice", { tags: ["Vegetarian"] }),
    dish("Vegetable aioli wrap", { tags: ["Vegetarian"] }),
    dish("Chicken rice"),
    dish("Rice", { tags: ["Vegan"], allergens: ["Egg"] }),
  ]) {
    assert.equal(dietaryMenuStatus(item, profile).level, "conflict");
    assert.equal(assessDish(item, profile).level, "conflict");
  }
  assert.equal(
    dietaryMenuStatus(dish("Paneer rice", { tags: ["Vegetarian"] }), profile)
      .level,
    "unknown",
  );
  assert.equal(
    dietaryMenuStatus(
      dish("Paneer rice", {
        tags: ["Vegetarian"],
        provenance: { freeFromAllergens: ["Egg"] },
      }),
      profile,
    ).level,
    "match",
  );
  assert.equal(
    dietaryMenuStatus(dish("Tofu rice", { tags: ["Vegan"] }), profile).level,
    "match",
  );
  // A vegan dietary label still cannot establish Egg allergy absence.
  assert.equal(
    dietaryMenuStatus(dish("Tofu rice", { tags: ["Vegan"] }), {
      allergies: ["Egg"],
    }).level,
    "unknown",
  );
});

test("all-nine discovery stays nine, but also honors a selected honey allergy", () => {
  const restaurant = { id: "one", name: "One", fictional: false };
  const item = dish("Rice", {
    id: "rice",
    restaurantId: "one",
    provenance: { freeFromAllergens: MAJOR_ALLERGENS },
  });
  const find = (food, profile = {}) =>
    discoverRestaurants({
      restaurants: [restaurant],
      dishes: [food],
      profile,
      dietMode: "all-nine",
    });
  assert.equal(find(item).length, 1);
  assert.equal(find(item, { allergies: ["Honey"] }).length, 0);
  const supported = { ...item, provenance: { freeFromAllergens: ALLERGENS } };
  assert.equal(find(supported, { allergies: ["Honey"] }).length, 1);
  assert.equal(
    find({ ...supported, allergens: ["Honey"] }, { allergies: ["Honey"] })
      .length,
    0,
  );
});
