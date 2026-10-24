import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localRestaurants, localDishes } from "../src/local-catalog.js";
import { menuPhotoFor } from "../src/menu-photos.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";

const additional = {
  "seito-baldwin-park": ["hand-made-dumplings"],
  "sparrow-orlando": ["say-cheese"],
  "reyes-mezcaleria": ["guacamole"],
  "winter-park-biscuit": ["wpbc-box"],
  "mamak-colonial": ["nasi-goreng-indonesia", "pad-thai"],
  "lazy-moon-mills": ["slice-garden-grazer-pizza"],
};

test("new per-dish photos use unique, specific catalog keys and cited sources", () => {
  let newCount = 0;
  const urls = new Set();
  for (const [slug, keys] of Object.entries(additional)) {
    const restaurant = localRestaurants.find((r) => r.slug === slug);
    assert.ok(restaurant, slug);
    for (const key of keys) {
      newCount++;
      const dish = localDishes.find((d) => d.catalogKey === `${slug}-${key}`);
      assert.ok(dish, `${slug}/${key}`);
      const record = verifiedDishPhotos[slug]?.[key];
      assert.ok(record);
      assert.match(record.url, /^https:\/\//);
      assert.match(record.sourceUrl, /^https:\/\//);
      assert.ok(record.credit && record.alt && record.alt.length > 20);
      assert.equal(urls.has(record.url), false, `Photo reused for unrelated item: ${slug}/${key}`);
      urls.add(record.url);
      const photo = menuPhotoFor(dish, restaurant);
      assert.equal(photo?.url, record.url);
      assert.equal(photo?.exact, true);
    }
  }
  assert.equal(newCount, 7);
});

test("every restaurant has at least one uniquely matched menu image; incomplete entries are not misrepresented", () => {
  assert.equal(localRestaurants.length, 25);
  let reviewed = 0;
  for (const restaurant of localRestaurants) {
    const dishes = localDishes.filter((d) => d.restaurantId === restaurant.id || d.catalogKey?.startsWith(restaurant.slug + "-"));
    assert.ok(dishes.length > 0, restaurant.slug);
    const photographed = dishes.filter((dish) => menuPhotoFor(dish, restaurant));
    assert.ok(photographed.length > 0, `No item photos at ${restaurant.slug}`);
    reviewed += photographed.length;
  }
  assert.equal(localDishes.length, 1630);
  assert.ok(reviewed >= 314 && reviewed < localDishes.length, `Unsupported photo coverage claim: ${reviewed}`);
  const chipotle = localRestaurants.find((r) => r.slug === "chipotle-south-orange");
  const blackBeans = localDishes.find((d) => d.catalogKey === "chipotle-south-orange-black-beans");
  assert.equal(menuPhotoFor(blackBeans, chipotle), null);
});

test("native and chain menu displays preserve the entire photo without cropping", () => {
  const dining = readFileSync(new URL("../components/Dining.js", import.meta.url), "utf8");
  const taco = readFileSync(new URL("../components/TacoBellMenu.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.js", import.meta.url), "utf8");
  assert.match(dining, /resizeMode="contain"/);
  assert.match(taco, /resizeMode="contain"/);
  assert.match(styles, /menuDishPhotoLarge:[\s\S]*?height: 250/);
  assert.match(taco, /photoWide: \{ height: 250/);
  assert.doesNotMatch(dining, /resizeMode=\{photo\.exact \? "contain" : "cover"\}/);
});
