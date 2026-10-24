import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { menuPhotoFor, restaurantFoodPhoto } from "../src/menu-photos.js";

test("every active restaurant has a sourced food image for its cover", () => {
  assert.equal(localRestaurants.length, 25);
  for (const restaurant of localRestaurants) {
    const cover = restaurantFoodPhoto(restaurant);
    assert.ok(cover, `No food photograph for ${restaurant.slug}`);
    assert.match(cover.url, /^https:\/\//);
    assert.ok(cover.alt?.length > 12, `Missing image description for ${restaurant.slug}`);
    assert.ok(cover.credit?.length > 4, `Missing image credit for ${restaurant.slug}`);
    assert.ok(cover.sourceUrl?.startsWith("http"), `Missing source page for ${restaurant.slug}`);
  }
});

test("restaurant cover images do not leak onto unrelated menu item cards", () => {
  const seito = localRestaurants.find((r) => r.slug === "seito-baldwin-park");
  const sparrow = localRestaurants.find((r) => r.slug === "sparrow-orlando");
  const cover1 = restaurantFoodPhoto(seito);
  const cover2 = restaurantFoodPhoto(sparrow);
  assert.match(cover1.url, /\.(jpg|jpeg|png|webp)(\?|$)/i);
  assert.match(cover2.url, /\.(jpg|jpeg|png|webp)(\?|$)/i);
  for (const restaurant of [seito, sparrow]) {
    const cover = restaurantFoodPhoto(restaurant);
    for (const dish of localDishes.filter((d) => d.restaurantId === restaurant.id)) {
      const photo = menuPhotoFor(dish, restaurant);
      if (photo) {
        assert.equal(photo.exact, true, `Unverified image for ${dish.name}`);
        assert.notEqual(photo.url, cover.url, `Restaurant-wide cover reused for ${dish.name}`);
        assert.match(photo.sourceUrl, /^https?:\/\//);
        assert.ok(photo.credit);
      } else assert.equal(dish.imageUrl, null);
    }
  }
});

test("Osteria Ester photographed spaghetti vongole is an individually keyed item", () => {
  const ester = localRestaurants.find((r) => r.slug === "osteria-ester");
  const dish = localDishes.find((d) => d.restaurantId === ester.id && d.catalogKey === "osteria-ester-spaghetti-alle-vongole");
  assert.ok(dish);
  const photo = menuPhotoFor(dish, ester);
  assert.equal(photo.exact, true);
  assert.match(photo.url, /guide\.michelin\.com/);
  assert.match(photo.credit, /MICHELIN/);
  const different = localDishes.find((d) => d.restaurantId === ester.id && d.catalogKey === "osteria-ester-focaccia");
  assert.equal(menuPhotoFor(different, ester), null);
});

test("cover screen uses remote food photos with original restaurant photo fallback", () => {
  const screen = readFileSync(new URL("../components/Dining.js", import.meta.url), "utf8");
  assert.match(screen, /restaurantFoodPhoto\(restaurant\)/);
  assert.match(screen, /hasBackup/);
  assert.match(screen, /setUsingOriginal\(true\)/);
  assert.match(screen, /restaurant=\{restaurant\} style=\{s\.menuHeroPhoto\}/);
});
