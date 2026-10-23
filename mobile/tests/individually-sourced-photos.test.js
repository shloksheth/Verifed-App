import test from "node:test";
import assert from "node:assert/strict";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { menuPhotoFor } from "../src/menu-photos.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";

// These additions each have a named source page, an individual catalog key,
// and a photograph of the named product, not a restaurant hero photograph.
const newPhotoKeys = {
  "hawkers-orlando": ["twice-fried-wings", "pad-thai"],
  "chipotle-south-orange": ["tortilla-chips"],
  "black-rooster-mills": ["guacamole-made-to-order", "achiote-pork"],
  "pizza-bruno-curry": ["take-out-garlic-knots-sauce", "meatballs-lemon-ricotta", "margherita-v"],
  "mamak-colonial": ["roti-canai"],
  "yellow-dog-eats-gotha": ["florida-cracker"],
};

test("new dish photos are keyed to individual published menu records with attribution", () => {
  for (const [slug, keys] of Object.entries(newPhotoKeys)) {
    const restaurant = localRestaurants.find((r) => r.slug === slug);
    assert.ok(restaurant, slug);
    for (const key of keys) {
      const record = verifiedDishPhotos[slug]?.[key];
      const dish = localDishes.find((d) => d.catalogKey === `${slug}-${key}`);
      assert.ok(dish, `Missing dish ${slug}/${key}`);
      assert.ok(record, `Missing photo ${slug}/${key}`);
      assert.match(record.url, /^https:\/\//);
      assert.match(record.sourceUrl, /^https:\/\//);
      assert.ok(record.alt.length >= 16, `Missing alt ${slug}/${key}`);
      assert.ok(record.credit.length >= 8, `Missing credit ${slug}/${key}`);
      const resolved = menuPhotoFor(dish, restaurant);
      assert.equal(resolved.url, record.url);
      assert.equal(resolved.exact, true);
    }
  }
});

test("different named menu items are not assigned the same photo", () => {
  const seen = new Map();
  for (const [slug, keys] of Object.entries(newPhotoKeys)) {
    for (const key of keys) {
      const record = verifiedDishPhotos[slug][key];
      assert.equal(seen.has(record.url), false, `${slug}/${key} reused photo from ${seen.get(record.url)}`);
      seen.set(record.url, `${slug}/${key}`);
    }
  }
  assert.equal(seen.size, 10);
});

test("photo enrichment must not fill unmatched items with a default restaurant picture", () => {
  for (const restaurant of localRestaurants) {
    const dishes = localDishes.filter((d) => d.restaurantId === restaurant.id);
    for (const dish of dishes) {
      const source = menuPhotoFor(dish, restaurant);
      if (source) assert.equal(source.exact, true);
    }
  }
  const chipotle = localRestaurants.find((r) => r.slug === "chipotle-south-orange");
  const beans = localDishes.find((d) => d.restaurantId === chipotle.id && d.name === "Black Beans");
  assert.equal(menuPhotoFor(beans, chipotle), null);
});

test("image update leaves allergens and dietary data independent of pictures", () => {
  for (const dish of localDishes) {
    assert.ok(Array.isArray(dish.allergens));
    assert.ok(Array.isArray(dish.tags));
    assert.ok(dish.provenance);
  }
});

test("Hawkers photos map to named items on its official dining menu", () => {
  const restaurant = localRestaurants.find((r) => r.slug === "hawkers-orlando");
  const photoMap = verifiedDishPhotos["hawkers-orlando"];
  const entries = Object.entries(photoMap);
  assert.equal(entries.length, 43);
  const urls = new Set();
  for (const [key, meta] of entries) {
    const item = localDishes.find((d) => d.catalogKey === `hawkers-orlando-${key}`);
    assert.ok(item, `Missing Hawkers dish ${key}`);
    assert.equal(meta.sourceUrl, "https://eathawkers.com/menus/dining/");
    assert.equal(meta.credit, "Hawkers · official dining menu");
    assert.match(meta.alt, new RegExp(item.name.replace(/[.*+?^\$\{\}()|[\]\\]/g, "\\$&").slice(0, 12), "i"));
    assert.equal(urls.has(meta.url), false, `Duplicate Hawkers image for ${key}`);
    urls.add(meta.url);
    const rendered = menuPhotoFor(item, restaurant);
    assert.equal(rendered.url, meta.url);
  }
});
