import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localDishes, localRestaurants, mergeLocalCatalog } from "../src/local-catalog.js";
import { menuPhotoFor, representativeMenuPhotos } from "../src/menu-photos.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";

test("only individually verified images appear on menu item cards", () => {
  assert.equal(localRestaurants.length, 25);
  for (const restaurant of localRestaurants) {
    const dishes = localDishes.filter((item) => item.restaurantId === restaurant.id);
    assert.ok(dishes.length > 0, restaurant.name);
    for (const dish of dishes) {
      const photo = menuPhotoFor(dish, restaurant);
      if (photo) {
        assert.equal(photo.exact, true);
        assert.ok(photo.alt && photo.credit && /^https?:\/\//.test(photo.url));
      } else {
        assert.equal(dish.imageUrl, null, `Missing item ${dish.name} erroneously has an image`);
      }
    }
  }
  assert.ok(representativeMenuPhotos["hawkers-orlando"], "Restaurant photo remains available for menu hero");
  assert.equal(menuPhotoFor({}, { id: "tako-cheena-mills" }), null);
});

test("Taco Bell official product photos remain separate for each product", () => {
  const keys = ["taco-bell-south-orange", "taco-bell-east-colonial", "taco-bell-orlando-west"];
  for (const key of keys) {
    const restaurant = localRestaurants.find((item) => item.slug === key);
    const dishes = localDishes.filter((dish) => dish.restaurantId === restaurant.id);
    const items = dishes.filter((dish) => dish.imageUrl);
    assert.equal(items.length, 54);
    for (const dish of items) {
      const photo = menuPhotoFor(dish, restaurant);
      assert.equal(photo.exact, true);
      assert.match(photo.url, /tacobell\.com\/images\//);
    }
    const bowl = dishes.find((dish) => dish.name === "Cantina Chicken Bowl");
    assert.match(menuPhotoFor(bowl, restaurant).url, /29199_cantina_bowl/);
    const missing = dishes.find((dish) => dish.name === "Breakfast Salsa");
    assert.equal(menuPhotoFor(missing, restaurant), null);
  }
});

test("Loving Hut exact matches from the official restaurant menu are individually keyed", () => {
  const restaurant = localRestaurants.find((entry) => entry.slug === "loving-hut-orlando");
  assert.equal(Object.keys(verifiedDishPhotos["loving-hut-orlando"]).length, 53);
  const dishes = localDishes.filter((dish) => dish.restaurantId === restaurant.id);
  assert.equal(dishes.filter((dish) => menuPhotoFor(dish, restaurant)).length, 53);
  const spring = dishes.find((dish) => dish.name.startsWith("Spring Rolls (4 Rolls)"));
  assert.match(menuPhotoFor(spring, restaurant).url, /Spring-2\.jpg$/);
  assert.equal(menuPhotoFor(dishes.find((dish) => dish.name === "White Rice"), restaurant), null);
});

test("Chipotle guacamole is exact but black beans cannot use a general bowl image", () => {
  const restaurant = localRestaurants.find((item) => item.slug === "chipotle-south-orange");
  const guac = localDishes.find((dish) => dish.restaurantId === restaurant.id && dish.name === "Guacamole");
  const beans = localDishes.find((dish) => dish.restaurantId === restaurant.id && dish.name === "Black Beans");
  assert.equal(menuPhotoFor(guac, restaurant).exact, true);
  assert.match(menuPhotoFor(guac, restaurant).url, /chipotle\.com/);
  assert.equal(menuPhotoFor(beans, restaurant), null);
});

test("cloud merging rejects generic dish photos but retains independently verified product photos", () => {
  const restaurant = localRestaurants.find((entry) => entry.slug === "taco-bell-south-orange");
  const verified = localDishes.find((entry) => entry.restaurantId === restaurant.id && entry.imageUrl);
  const missing = localDishes.find((entry) => entry.restaurantId === restaurant.id && !entry.imageUrl);
  const cloud = [
    { id: "cloud-exact", catalogKey: verified.catalogKey, restaurantId: "cloud-restaurant", imageUrl: "https://example.com/stock.jpg" },
    { id: "cloud-missing", catalogKey: missing.catalogKey, restaurantId: "cloud-restaurant", imageUrl: "https://example.com/stock.jpg" }
  ];
  const merged = mergeLocalCatalog([{ slug: restaurant.slug, id: "cloud-restaurant", imageUrl: "https://example.com/stock.jpg" }], cloud);
  assert.equal(merged.dishes.find((dish) => dish.id === "cloud-exact").imageUrl, verified.imageUrl);
  assert.equal(merged.dishes.find((dish) => dish.id === "cloud-missing").imageUrl, null);
  assert.equal(merged.restaurants.find((item) => item.id === "cloud-restaurant").imageUrl, restaurant.imageUrl);
});

test("separate Taco Bell menu component includes search, filtering and safe customization drafts", () => {
  const ui = readFileSync(new URL("../components/TacoBellMenu.js", import.meta.url), "utf8");
  const dining = readFileSync(new URL("../components/Dining.js", import.meta.url), "utf8");
  assert.match(ui, /EXPLORE CATEGORIES/);
  assert.match(ui, /Search Taco Bell menu/);
  assert.match(ui, /FOR MY DIET/);
  assert.match(ui, /Share request for staff/);
  assert.match(ui, /No order was placed/);
  assert.match(dining, /isTacoBell\(restaurant\)/);
  assert.match(dining, /<TacoBellMenu/);
});
