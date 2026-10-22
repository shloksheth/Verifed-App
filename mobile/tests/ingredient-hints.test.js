import test from "node:test";
import assert from "node:assert/strict";
import { ingredientHints } from "../src/ingredient-hints.js";
import { dietaryMenuStatus } from "../src/menu-filter.js";

test("named ingredients flag recognizable allergens, without inventing absence claims", () => {
  const hints = ingredientHints({
    name: "Shrimp toast",
    description: "Shrimp, sesame, cheddar, egg and peanuts",
  });
  for (const allergen of ["Shellfish", "Sesame", "Milk", "Egg", "Peanuts"])
    assert.ok(hints.allergens.includes(allergen));
  assert.deepEqual(
    ingredientHints({
      name: "Rice bowl",
      description: "Rice, cucumber, tomato",
    }).allergens,
    [],
  );
  assert.equal(
    dietaryMenuStatus(
      { allergens: [], tags: [], ingredientHints: hints },
      { allergies: ["Milk"] },
    ).level,
    "conflict",
  );
});

test("common recipe clues stay possible, and do not become restaurant absence claims", () => {
  const hints = ingredientHints({
    name: "Chicken sandwich",
    description: "Brioche, aioli and pesto",
  });
  assert.ok(hints.possibleAllergens.includes("Wheat"));
  assert.ok(hints.possibleAllergens.includes("Egg"));
  assert.ok(hints.restrictionConflicts.includes("Vegetarian"));
  assert.equal(
    dietaryMenuStatus(
      { allergens: [], tags: [], ingredientHints: hints },
      { allergies: ["Wheat"] },
    ).level,
    "conflict",
  );
});

test("plant substitutes and look-alike ingredient names do not inherit animal or wheat flags", () => {
  const hints = ingredientHints({
    name: "Vegan chicken biscuit",
    description:
      "Vegan mayo, coconut cream, butter beans, eggplant and buckwheat",
    tags: ["Vegan", "Gluten-free"],
  });
  for (const allergen of ["Milk", "Egg", "Wheat", "Fish", "Shellfish"])
    assert.ok(
      !hints.allergens.includes(allergen) &&
        !hints.possibleAllergens.includes(allergen),
    );
  assert.deepEqual(hints.restrictionConflicts, []);
});

test("meat or dairy clues filter vegetarian and vegan options without treating labels as allergy guarantees", () => {
  const hints = ingredientHints({
    name: "Beef taco",
    description: "Cotija, beef and corn tortilla",
  });
  assert.equal(
    dietaryMenuStatus(
      { allergens: [], tags: [], ingredientHints: hints },
      { restrictions: ["Vegan"] },
    ).level,
    "conflict",
  );
  const vegan = {
    name: "Plant bowl",
    description: "Tofu and rice",
    tags: ["Vegan"],
  };
  assert.equal(
    dietaryMenuStatus(
      { ...vegan, allergens: [], ingredientHints: ingredientHints(vegan) },
      { allergies: ["Milk"] },
    ).level,
    "unknown",
  );
});

test("optional additions do not turn a base vegetarian salad into a meat conflict", () => {
  const hints = ingredientHints({
    name: "Green salad",
    description: "Lettuce, tomato. Add chicken or shrimp +8.",
  });
  assert.deepEqual(hints.restrictionConflicts, []);
});

test("common dairy and flour dishes are flagged for vegan and gluten-free browsing", () => {
  const dish = { name: "Macaroni and cheese", allergens: [], tags: [] };
  dish.ingredientHints = ingredientHints(dish);
  assert.equal(
    dietaryMenuStatus(dish, { restrictions: ["Vegan"] }).level,
    "conflict",
  );
  assert.equal(
    dietaryMenuStatus(dish, { restrictions: ["Gluten-free"] }).level,
    "conflict",
  );
});

test("generic named fish is excluded from vegetarian candidates", () => {
  const dish = { name: "Crispy Fish", allergens: [], tags: [] };
  dish.ingredientHints = ingredientHints(dish);
  assert.ok(dish.ingredientHints.allergens.includes("Fish"));
  assert.equal(
    dietaryMenuStatus(dish, { restrictions: ["Vegan"] }).level,
    "conflict",
  );
});

test("oyster mushrooms and declared vegan seafood alternatives do not create shellfish flags", () => {
  for (const item of [
    { name: "King oyster mushrooms" },
    { name: "Vegan clam pasta", tags: ["Vegan"] },
  ]) {
    const hints = ingredientHints(item);
    assert.ok(
      !hints.allergens.includes("Shellfish") &&
        !hints.possibleAllergens.includes("Shellfish"),
    );
    assert.ok(!hints.restrictionConflicts.includes("Vegan"));
  }
});

test("Indian dairy, soy and bread terms stay visible as ingredient clues", () => {
  for (const word of ["paneer", "ghee", "curd", "khoya", "yoghurt"])
    assert.ok(ingredientHints({ name: word }).allergens.includes("Milk"));
  assert.ok(
    ingredientHints({
      name: "Hakka noodles",
      ingredients: ["soya sauce"],
    }).allergens.includes("Soy"),
  );
  for (const word of ["breadcrumbs", "chapati", "roti", "paratha"])
    assert.ok(
      ingredientHints({ name: word }).possibleAllergens.includes("Wheat"),
    );
  assert.ok(
    !ingredientHints({ name: "Fish's Gold sauce" }).allergens.includes("Fish"),
  );
});
