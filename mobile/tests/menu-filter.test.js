import test from "node:test";
import assert from "node:assert/strict";
import { dietaryMenuStatus, groupMenu } from "../src/menu-filter.js";

const rice = {
  allergens: [],
  tags: ["Vegan", "Gluten-free"],
  provenance: { freeFromAllergens: ["Milk", "Soy"] },
};
test("diet menu requires every selected need to have explicit support", () => {
  assert.equal(
    dietaryMenuStatus(rice, {
      allergies: ["Milk", "Soy"],
      restrictions: ["Vegan"],
    }).level,
    "match",
  );
  const mixed = dietaryMenuStatus(rice, { allergies: ["Milk", "Sesame"] });
  assert.equal(mixed.level, "unknown");
  assert.deepEqual(mixed.missing, ["Sesame"]);
});
test("positive declarations override a contradictory free-from claim", () => {
  const result = dietaryMenuStatus(
    { ...rice, allergens: ["Soy"] },
    { allergies: ["Soy"] },
  );
  assert.equal(result.level, "conflict");
  assert.deepEqual(result.conflicts, ["Soy"]);
});
test("empty declarations, coverage and vegan labels never substitute for allergy evidence", () => {
  assert.equal(
    dietaryMenuStatus(
      { allergens: [], tags: ["Vegan"], provenance: { coverage: ["Milk"] } },
      { allergies: ["Milk"] },
    ).level,
    "unknown",
  );
  assert.equal(
    dietaryMenuStatus(rice, { restrictions: ["Vegetarian"] }).level,
    "match",
  );
});
test("no requirements prompts profile selection rather than claiming all foods match", () => {
  assert.equal(dietaryMenuStatus(rice, {}).level, "unset");
});
test("menu sections preserve the restaurant order without mutating input", () => {
  const a = { id: "a", category: "Bases" },
    b = { id: "b", category: "Sauces" },
    c = { id: "c", category: "Bases" };
  assert.deepEqual(groupMenu([a, b, c]), [
    { category: "Bases", dishes: [a, c] },
    { category: "Sauces", dishes: [b] },
  ]);
});
