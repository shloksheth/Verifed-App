import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";
import { menuPhotoFor } from "../src/menu-photos.js";

test("photo audit covers every published dish with stable identifiers", () => {
  assert.equal(localRestaurants.length, 25);
  assert.equal(localDishes.length, 1630);
  const missing = [];
  for (const dish of localDishes) {
    const restaurant = localRestaurants.find((r) => r.slug === dish.restaurantId);
    assert.ok(restaurant, dish.id);
    const photo = menuPhotoFor(dish, restaurant);
    if (!photo) missing.push(dish);
    else {
      assert.equal(photo.exact, true);
      assert.ok(photo.sourceUrl);
      assert.ok(photo.url.startsWith("https://"));
    }
  }
  assert.ok(missing.length > 0, "Do not claim 100% coverage without evidence");
});

test("menu image UI preserves full dish framing", () => {
  const source = readFileSync(new URL("../components/Dining.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.js", import.meta.url), "utf8");
  assert.match(source, /resizeMode="contain"/);
  assert.match(source, /menuDishPhotoLargeCanvas/);
  assert.match(source, /menuDishPhotoCanvas/);
  assert.match(styles, /menuDishPhotoLargeCanvas/);
  assert.match(styles, /menuDishPhotoCanvas/);
  assert.doesNotMatch(source.slice(source.indexOf("function DishPhoto"),source.indexOf("export function FoodArt")), /resizeMode="cover"/);
});

test("each sourced photo retains image-specific provenance", () => {
  for (const [slug, entries] of Object.entries(verifiedDishPhotos)) {
    for (const [key, photo] of Object.entries(entries)) {
      assert.ok(photo.url?.startsWith("https://"), slug + "/" + key);
      assert.ok(photo.alt && photo.credit && photo.sourceUrl, slug + "/" + key);
    }
  }
});
