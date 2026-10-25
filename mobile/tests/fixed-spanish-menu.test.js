import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fixedSpanishMenu, menuAfterPhoto } from "../src/legacy-spanish-menu.js";
import { scannedItems, updateScannedItem } from "../src/menu-scan.js";

test("Fixed Spanish transcript matches all 15 dishes on the actual source page", () => {
  const source = readFileSync(new URL("../../research/menu-sources/2cero7-spanish-page.txt", import.meta.url), "utf8");
  const compact = (text) => text.replace(/\s+/g, " ").trim();
  const menu = fixedSpanishMenu();
  assert.equal(menu.items.length, 15);
  for (const item of menu.items) {
    assert.ok(compact(source).includes(compact(item.nameEs)), item.nameEs);
    assert.ok(item.nameEn.trim());
  }
  assert.deepEqual(menu.items.reduce((counts, item) => {
    counts[item.categoryEn] = (counts[item.categoryEn] || 0) + 1;
    return counts;
  }, {}), { Starters: 5, "Main dishes": 5, Desserts: 5 });
  assert.equal(menu.source.page, 1);
  assert.equal(menu.source.mode, "fixed-menu-demo");
});

test("Any successful photo opens the same fresh fixed transcript and keeps its real photo", () => {
  const firstPhoto = { uri: "file:///printed-menu.jpg", width: 1000, height: 1400 };
  const otherPhoto = { uri: "file:///different.jpg", width: 500, height: 500 };
  const first = menuAfterPhoto(firstPhoto);
  const other = menuAfterPhoto(otherPhoto);
  assert.equal(first.photo, firstPhoto);
  assert.equal(other.photo, otherPhoto);
  assert.deepEqual(first.menu, other.menu);
  first.menu.items[0].nameEn = "Edited";
  first.menu.source.page = 9;
  assert.notEqual(other.menu.items[0].nameEn, "Edited");
  assert.equal(fixedSpanishMenu().source.page, 1);
});

test("Prices keep the set-menu offer separate from individual dishes and translate only the supplement label", () => {
  const menu = fixedSpanishMenu();
  assert.match(menu.priceSummaryEn, /25€ → 20€.*18€/);
  for (const value of Object.values(menu.offer))
    assert.ok(readFileSync(new URL("../../research/menu-sources/2cero7-spanish-page.txt", import.meta.url), "utf8").includes(value));
  assert.equal(menu.items.filter((item) => item.price).length, 1);
  const english = scannedItems(menu, { language: "en" });
  const spanish = scannedItems(menu, { language: "es" });
  assert.equal(english[9].price, "+5 € supplement");
  assert.equal(spanish[9].price, "*suplemento 5€");
  const corrected = updateScannedItem(menu, "2cero7-10", { ...menu.items[9], price: "6€" });
  assert.equal(scannedItems(corrected, { language: "en" })[9].price, "6€");
  assert.equal(scannedItems(corrected, { language: "es" })[9].price, "6€");
  const nameOnly = updateScannedItem(menu, "2cero7-10", { ...menu.items[9], nameEn: "Beef steak with sweet potato" });
  assert.equal(scannedItems(nameOnly)[9].price, "+5 € supplement");
});

test("The printed general allergen key is never used as a dish allergen declaration", () => {
  const menu = fixedSpanishMenu();
  assert.match(menu.legendEn, /Peanuts/);
  const fruit = scannedItems(menu, { query: "fruit", profile: { allergies: ["Peanuts"] } })[0];
  assert.deepEqual(fruit.assessment.conflicts, []);
  assert.equal(fruit.assessment.level, "unknown");
  const fish = scannedItems(menu, { forDiet: true, profile: { allergies: ["Fish"] } });
  assert.ok(!fish.some((item) => item.id === "2cero7-1" || item.id === "2cero7-6"));
});

test("Cannelloni and béchamel are possible recipe clues, not confirmed allergen declarations", () => {
  const menu = fixedSpanishMenu();
  for (const allergy of ["Milk", "Wheat"]) {
    const dish = scannedItems(menu, { profile: { allergies: [allergy] } })[3];
    assert.equal(dish.assessment.level, "conflict");
    assert.ok(dish.assessment.clues.some((clue) => clue.startsWith(`Possible ${allergy}:`)));
    assert.ok(!scannedItems(menu, { forDiet: true, profile: { allergies: [allergy] } }).some((item) => item.id === dish.id));
  }
  const milkMenu = scannedItems(menu, { forDiet: true, profile: { allergies: ["Milk"] } });
  assert.ok(!milkMenu.some((item) => ["2cero7-2", "2cero7-14"].includes(item.id)));
  assert.ok(milkMenu.some((item) => item.id === "2cero7-5"), "Creamy rice texture alone must not invent a milk ingredient");
  const shellfishMenu = scannedItems(menu, { forDiet: true, profile: { allergies: ["Shellfish"] } });
  assert.ok(!shellfishMenu.some((item) => item.id === "2cero7-7"));
});
