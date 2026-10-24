import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { menuPhotoFor } from "../src/menu-photos.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";

const restaurants = {
  "tin-taco-downtown": 119,
  "mamak-colonial": 70,
  "stubborn-mule": 84,
  "pig-floyds-mills": 43,
  "lazy-moon-mills": 97,
};

test("all 413 Batch 2 menu records exist and are audited independently", () => {
  const audit = JSON.parse(readFileSync(new URL("../../research/batch2-photo-audit.json", import.meta.url), "utf8"));
  assert.equal(audit.entries.length, 413);
  assert.deepEqual(Object.keys(restaurants), audit.scope);
  for (const [slug, expected] of Object.entries(restaurants)) {
    const r = localRestaurants.find(x => x.slug === slug);
    assert.ok(r, slug);
    const dishes = localDishes.filter(d => d.restaurantId === slug);
    assert.equal(dishes.length, expected, slug);
    const photos = verifiedDishPhotos[slug] || {};
    const imageUrls = new Set();
    for (const dish of dishes) {
      const key = dish.catalogKey.slice(slug.length + 1);
      const entry = photos[key] || null;
      const row = audit.entries.find(x => x.catalogKey === slug + "/" + key);
      assert.ok(row, dish.catalogKey);
      assert.equal(row.itemName, dish.name);
      assert.ok(row.imageCandidateQueries.length >= 4);
      assert.match(row.reviewStatus, /needs-manual-visual-approval/);
      if (entry) {
        assert.ok(entry.url.startsWith("https://"), dish.name);
        assert.ok(entry.sourceUrl?.startsWith("https://"), dish.name);
        assert.ok(entry.alt?.length > 12 && entry.credit?.length > 7, dish.name);
        assert.ok(!imageUrls.has(entry.url), `Repeated photo within ${slug} for ${key}`);
        imageUrls.add(entry.url);
        assert.equal(menuPhotoFor(dish, r)?.url, entry.url);
      } else {
        assert.equal(menuPhotoFor(dish, r), null, `Incorrect fallback on ${dish.name}`);
      }
    }
  }
});
test("photo audits do not mislabel contextual pictures as exact menu products", () => {
  for (const [slug] of Object.entries(restaurants)) {
    const rest = localRestaurants.find(r => r.slug === slug);
    for (const dish of localDishes.filter(d => d.restaurantId === slug)) {
      const kind = dish.imageKind || "published";
      if (/^(representative|menu-context|editorial-context)/.test(kind)) {
        assert.equal(menuPhotoFor(dish, rest)?.exact, false, dish.name);
      }
    }
  }
});
