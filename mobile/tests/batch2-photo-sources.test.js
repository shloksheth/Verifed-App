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

// Regression: new sourced images must remain keyed to their matching real dishes,
// never to a generic restaurant hero or a different plate.
test("new Batch 2 sourced item photos have individual credits and proper identity flags", () => {
  const cases = [
  {
    "slug": "lazy-moon-mills",
    "key": "20-cuban-pizza",
    "kind": "official-product"
  },
  {
    "slug": "lazy-moon-mills",
    "key": "20-chili-pizza",
    "kind": "official-product"
  },
  {
    "slug": "lazy-moon-mills",
    "key": "birria-calzone",
    "kind": "official-product"
  },
  {
    "slug": "lazy-moon-mills",
    "key": "slice-the-vegetarian-chili-slice",
    "kind": "official-product"
  },
  {
    "slug": "mamak-colonial",
    "key": "crispy-roast-pork",
    "kind": "editorial-context"
  }
];
  for (const { slug, key, kind } of cases) {
    const entry = verifiedDishPhotos[slug]?.[key];
    assert.ok(entry?.url?.startsWith("https://"), slug + "/" + key);
    assert.ok(entry?.sourceUrl?.startsWith("https://"), slug + "/" + key);
    assert.equal(entry.kind, kind, slug + "/" + key);
    assert.equal(entry.needsPermissionReview, true, slug + "/" + key);
    const dish = localDishes.find(d => d.restaurantId === slug && d.catalogKey === slug + "-" + key);
    const restaurant = localRestaurants.find(r => r.slug === slug);
    assert.ok(dish && restaurant, slug + "/" + key);
    assert.equal(menuPhotoFor(dish, restaurant)?.url, entry.url);
    if (kind === "editorial-context") assert.equal(menuPhotoFor(dish, restaurant)?.exact, false);
  }
});

test("new Lazy Moon soups, pizza and salad photo sources remain item-specific", () => {
  const expected = [
  {
    "slug": "lazy-moon-mills",
    "key": "tomato-bisque-soup",
    "kind": "official-product"
  },
  {
    "slug": "lazy-moon-mills",
    "key": "gluten-free-pizza-contains-egg-dairy",
    "kind": "official-product"
  },
  {
    "slug": "lazy-moon-mills",
    "key": "large-caesar-salad",
    "kind": "editorial-context"
  }
];
  for (const item of expected) {
    const image = verifiedDishPhotos[item.slug]?.[item.key];
    assert.ok(image?.url && image?.sourceUrl, item.key);
    assert.equal(image.kind, item.kind);
    assert.equal(image.needsPermissionReview, true);
    const dish = localDishes.find(x => x.catalogKey === item.slug + "-" + item.key);
    assert.ok(dish, item.key);
    const restaurant = localRestaurants.find(x => x.slug === item.slug);
    assert.equal(menuPhotoFor(dish, restaurant)?.url, image.url);
    if (item.kind === "editorial-context") assert.equal(menuPhotoFor(dish, restaurant)?.exact, false);
  }
});

test("Pigzza editorial photos remain correctly contextual", () => {
  for (const key of ["pepperoni","spicy-sausage-rigatoni"]) {
    const entry = verifiedDishPhotos["pig-floyds-mills"]?.[key];
    assert.equal(entry?.kind, "editorial-context", key);
    assert.ok(entry?.sourceUrl?.startsWith("https://"));
    assert.equal(entry.needsPermissionReview, true);
    const dish = localDishes.find(d => d.catalogKey === "pig-floyds-mills-" + key);
    assert.ok(dish);
    assert.equal(menuPhotoFor(dish, localRestaurants.find(r => r.slug === "pig-floyds-mills"))?.exact, false);
  }
});
