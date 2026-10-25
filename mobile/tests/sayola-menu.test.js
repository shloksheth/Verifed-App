import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fixedSpanishMenu, menuAfterPhoto } from "../src/fixed-spanish-menu.js";
import { scannedItems, updateScannedItem } from "../src/menu-scan.js";
import {
  hasOriginalPage,
  menuCategories,
  visibleScanItems,
} from "../src/scan-view.js";

const transcript = JSON.parse(
  readFileSync(
    new URL(
      "../../research/menu-sources/sayola-transcript.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

test("Sayola preserves all 23 transcribed prices, descriptions and printed symbols", () => {
  const menu = fixedSpanishMenu();
  assert.equal(menu.id, "sayola-dinner-fixed");
  assert.equal(menu.currency, "USD");
  assert.deepEqual(menu.items, transcript);
  assert.equal(menu.items.length, 23);
  assert.equal(new Set(menu.items.map((item) => item.id)).size, 23);
  assert.equal(
    menu.items.filter((item) => item.categoryEn === "Hot tapas").length,
    19,
  );
  assert.equal(
    menu.items.filter((item) => item.categoryEn === "Cold tapas").length,
    4,
  );
  assert.ok(menu.items.every((item) => item.price === `$${item.printedPrice}`));
  assert.ok(menu.items.every((item) => item.tags.length === 0));
  assert.equal(menu.items[16].nameEs, "Tortilla Española");
  assert.deepEqual(menu.items[16].sourceLabels, ["GF", "V"]);
});

test("Sayola fixed response keeps the actual photo and makes independent transcript copies", () => {
  const photo = { uri: "file:///captured.jpg", width: 640, height: 1042 };
  const first = menuAfterPhoto(photo);
  const other = menuAfterPhoto({ uri: "file:///other.jpg" });
  assert.equal(first.photo, photo);
  assert.deepEqual(first.menu, other.menu);
  first.menu.items[0].sourceLabels.push("Edited");
  first.menu.items[0].nameEn = "Changed";
  assert.equal(other.menu.items[0].sourceLabels.length, 1);
  assert.notEqual(other.menu.items[0].nameEn, "Changed");
});

test("Category selection survives language changes and search/diet views", () => {
  const menu = fixedSpanishMenu();
  const english = scannedItems(menu, { language: "en" });
  const original = scannedItems(menu, { language: "es" });
  assert.deepEqual(menuCategories(menu, "es"), [
    { value: "Hot tapas", label: "Tapas Calientes" },
    { value: "Cold tapas", label: "Tapas Frías" },
  ]);
  assert.equal(visibleScanItems(english, "Cold tapas").length, 4);
  assert.equal(visibleScanItems(original, "Cold tapas").length, 4);
  assert.equal(visibleScanItems(english, "all").length, 23);
  assert.equal(
    scannedItems(menu, { query: "ajillo" })[0].name,
    "Garlic shrimp",
  );
  assert.equal(
    visibleScanItems(scannedItems(menu, { query: "ham" }), "Cold tapas").length,
    2,
  );
  assert.equal(hasOriginalPage(null), false);
  assert.equal(hasOriginalPage(menu), true);
  assert.equal(hasOriginalPage({ id: "2cero7-spanish-fixed" }), true);
  assert.equal(hasOriginalPage({ id: "spanish-example" }), false);
});

test("Printed GF and V labels do not erase named eggs, milk, shellfish or garlic", () => {
  const menu = fixedSpanishMenu();
  const forAllergy = (allergy) =>
    scannedItems(menu, {
      forDiet: true,
      profile: { allergies: [allergy], restrictions: [] },
    });
  assert.ok(!forAllergy("Shellfish").some((item) => item.id === "sayola-3"));
  assert.ok(!forAllergy("Egg").some((item) => item.id === "sayola-17"));
  assert.ok(!forAllergy("Milk").some((item) => item.id === "sayola-22"));
  assert.ok(
    !forAllergy("Wheat").some(
      (item) => item.id === "sayola-7" || item.id === "sayola-12",
    ),
  );
  const noAromatics = scannedItems(menu, {
    forDiet: true,
    profile: { restrictions: ["No garlic or onion"], allergies: [] },
  });
  assert.ok(
    !noAromatics.some(
      (item) => item.id === "sayola-3" || item.id === "sayola-17",
    ),
  );
  const corrected = updateScannedItem(menu, "sayola-17", {
    ...menu.items[16],
    price: "$15",
  });
  assert.equal(corrected.edited, true);
  assert.equal(
    scannedItems(corrected, { language: "es" }).find(
      (item) => item.id === "sayola-17",
    ).price,
    "$15",
  );
});

test("Every illustrated dish is a distinct local WebP with generated-image provenance", () => {
  const provenance = JSON.parse(
    readFileSync(
      new URL(
        "../../research/sayola-illustration-provenance.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(provenance.images.length, 4);
  const hashes = new Set();
  for (const record of provenance.images) {
    const bytes = readFileSync(
      new URL(`../../${record.asset}`, import.meta.url),
    );
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.equal(hash, record.sha256);
    hashes.add(hash);
    assert.ok(
      fixedSpanishMenu().items.some((item) => item.id === record.itemId),
    );
    assert.equal(record.generated, true);
    assert.equal(record.actualRestaurantPhoto, false);
    assert.ok(record.prompt && record.visualReview);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  }
  assert.equal(hashes.size, 4);
});
