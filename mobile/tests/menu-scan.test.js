import test from "node:test";
import assert from "node:assert/strict";
import {
  assessScannedItem,
  scannedItems,
  scanOwner,
  spanishSample,
  updateScannedItem,
} from "../src/menu-scan.js";
import { createScanLibrary } from "../src/scan-library.js";

test("Spanish-only corrections suspend dietary comparison until English is reviewed", () => {
  const menu = spanishSample();
  const revised = updateScannedItem(menu, "example-0", {
    ...menu.items[0],
    descriptionEs: "Aguacate con leche",
  });
  assert.equal(revised.items[0].needsTranslationReview, true);
  assert.equal(
    assessScannedItem(revised.items[0], { allergies: ["Milk"] }).level,
    "unknown",
  );
  assert.ok(
    !scannedItems(revised, {
      forDiet: true,
      profile: { allergies: ["Milk"] },
    }).some((item) => item.id === "example-0"),
  );
  const checked = updateScannedItem(revised, "example-0", {
    ...revised.items[0],
    descriptionEn: "Avocado with milk",
  });
  assert.ok(
    assessScannedItem(checked.items[0], {
      allergies: ["Milk"],
    }).conflicts.includes("Milk"),
  );
});

test("Spanish example is explicitly authored, preserves original accents/prices and is independent each time", () => {
  const menu = spanishSample();
  assert.equal(menu.sample, true);
  assert.match(menu.sourceLabel, /not a live AI scan/);
  assert.equal(menu.items.length, 8);
  assert.equal(
    menu.items.find((item) => item.nameEn === "Cheese quesadilla").price,
    "8,50 €",
  );
  menu.items[0].nameEs = "Changed";
  assert.equal(spanishSample().items[0].nameEs, "Guacamole casero");
});

test("Scanned menu diet comparison flags printed honey/wheat, eggs/milk, garlic and meat", () => {
  const items = spanishSample().items;
  assert.ok(
    assessScannedItem(items[7], {
      allergies: ["Honey", "Wheat"],
    }).conflicts.includes("Honey"),
  );
  assert.ok(
    assessScannedItem(items[6], {
      allergies: ["Egg", "Milk"],
    }).conflicts.includes("Egg"),
  );
  assert.ok(
    assessScannedItem(items[4], {
      restrictions: ["No garlic or onion"],
    }).conflicts.includes("No garlic or onion"),
  );
  assert.ok(
    assessScannedItem(items[2], {
      restrictions: ["Vegetarian (no eggs)"],
    }).conflicts.includes("Vegetarian (no eggs)"),
  );
  assert.equal(
    assessScannedItem(items[1], { allergies: ["Peanuts"] }).level,
    "unknown",
  );
  assert.ok(
    !assessScannedItem(items[7], { allergies: ["Egg"] }).conflicts.includes(
      "Egg",
    ),
  );
});

test("Bilingual search/filtering changes display text without converting prices or mutating source", () => {
  const menu = spanishSample();
  const original = structuredClone(menu);
  const spanish = scannedItems(menu, { language: "es", query: "camarones" });
  assert.equal(spanish[0].name, "Camarones al ajillo");
  assert.equal(spanish[0].price, "14,50 €");
  const diet = scannedItems(menu, {
    forDiet: true,
    profile: { allergies: ["Honey"] },
  });
  assert.equal(diet.length, 7);
  assert.ok(diet.every((item) => !item.assessment.conflicts.includes("Honey")));
  assert.deepEqual(menu, original);
});

test("Corrections remove stale dietary tags and retain the separately entered original text", () => {
  const menu = spanishSample();
  const edited = updateScannedItem(menu, "example-0", {
    ...menu.items[0],
    descriptionEn: "Milk and eggs",
  });
  assert.equal(edited.edited, true);
  assert.deepEqual(edited.items[0].tags, []);
  assert.equal(edited.items[0].descriptionEs, menu.items[0].descriptionEs);
  assert.ok(
    assessScannedItem(edited.items[0], {
      allergies: ["Milk"],
    }).conflicts.includes("Milk"),
  );
  assert.throws(() => updateScannedItem(menu, "example-0", {}), /dish name/);
});

test("Saved menus are private to the account/device namespace and temporary photo URIs are not persisted", async () => {
  const values = new Map();
  const library = createScanLibrary({
    getItem: async (key) => values.get(key),
    setItem: async (key, text) => values.set(key, text),
  });
  const owner = scanOwner({ user: { id: "account-a" } });
  await library.save(owner, {
    ...spanishSample(),
    photo: { uri: "blob:temporary" },
  });
  assert.equal((await library.read(owner)).length, 1);
  assert.equal((await library.read(owner))[0].photo, undefined);
  assert.deepEqual(
    await library.read(scanOwner({ user: { id: "account-b" } })),
    [],
  );
  assert.deepEqual(await library.read(scanOwner({ mode: "guest" })), []);
  assert.deepEqual(await library.remove(owner, "spanish-example"), []);
});

test("Saved-menu writes serialize, surface failure and recover without losing another save", async () => {
  let value = null;
  let fail = true;
  const library = createScanLibrary({
    getItem: async () => value,
    setItem: async (_, text) => {
      if (fail) {
        fail = false;
        throw new Error("Storage full");
      }
      value = text;
    },
  });
  await assert.rejects(library.save("guest", spanishSample()), /Storage full/);
  await Promise.all([
    library.save("guest", spanishSample()),
    library.save("guest", { ...spanishSample(), id: "second" }),
  ]);
  assert.equal((await library.read("guest")).length, 2);
});

test("clearing scans waits for pending saves and can recover damaged storage", async () => {
  const values = new Map();
  let release;
  const delay = new Promise((resolve) => {
    release = resolve;
  });
  const library = createScanLibrary({
    getItem: async (key) => values.get(key),
    setItem: async (key, text) => {
      await delay;
      values.set(key, text);
    },
    removeItem: async (key) => values.delete(key),
  });
  const saving = library.save("guest", spanishSample());
  const clearing = library.clear("guest");
  release();
  await Promise.all([saving, clearing]);
  assert.deepEqual(await library.read("guest"), []);
  values.set("verifed-menu-scans-v1:guest", "damaged JSON");
  await library.clear("guest");
  assert.deepEqual(await library.read("guest"), []);
});
