import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";
import { menuPhotoFor } from "../src/menu-photos.js";

const restaurants = {"pizza-bruno-curry": 68, "winter-park-biscuit": 41};

test("Batch 1 remainder menu registry uses individually keyed sources and describes identity", () => {
  let sourced = 0;
  const seen = new Map();
  for (const [slug, expected] of Object.entries(restaurants)) {
    const venue = localRestaurants.find(r => r.slug === slug);
    const items = localDishes.filter(d => d.restaurantId === slug);
    assert.equal(items.length, expected, `Unexpected menu size at ${slug}`);
    for (const dish of items) {
      const key = dish.catalogKey.slice(slug.length + 1);
      const photo = verifiedDishPhotos[slug]?.[key];
      const view = menuPhotoFor(dish, venue);
      if (!photo) {
        assert.equal(view, null, `Generic photo inserted for ${slug}/${key}`);
        continue;
      }
      sourced++;
      assert.match(photo.url, /^https:\/\//, key);
      assert.match(photo.sourceUrl, /^https:\/\//, key);
      assert.ok(photo.alt.length >= 18, key);
      assert.ok(photo.credit.length >= 10, key);
      assert.equal(view.url, photo.url, key);
      assert.ok(!seen.has(photo.url), `Photo reused for ${slug}/${key} and ${seen.get(photo.url)}`);
      seen.set(photo.url, `${slug}/${key}`);
      if (/^(representative|menu-context|editorial-context)/.test(photo.kind || "")) {
        assert.equal(view.exact, false, key);
        assert.match(photo.alt, /representative|not|may differ|not verified|not distinguishable|unknown|not visible/i, key);
      }
    }
  }
  assert.ok(sourced >= 27, "Previously reviewed Batch 1 photos were lost");
});

test("The editor retains full image and neutral handling of unavailable photos", () => {
  const dining = readFileSync(new URL("../components/Dining.js", import.meta.url), "utf8");
  assert.match(dining, /resizeMode="contain"/);
  assert.match(dining, /failedUrl === photo\.url/);
  assert.match(dining, /photo\.exact \? "Dish photo" : "Representative food photo"/);
});
