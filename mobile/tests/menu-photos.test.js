import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localDishes, localRestaurants, mergeLocalCatalog } from "../src/local-catalog.js";
import { menuPhotoFor, representativeMenuPhotos } from "../src/menu-photos.js";

test("every active Orlando restaurant has a food photo without depicting fictional dishes", () => {
  assert.equal(localRestaurants.length, 25);
  for (const restaurant of localRestaurants) {
    assert.equal(restaurant.fictional, false);
    const dish = localDishes.find((item) => item.restaurantId === restaurant.id);
    assert.ok(dish, `No menu for ${restaurant.name}`);
    const photo = menuPhotoFor(dish, restaurant);
    assert.ok(photo && /^https?:\/\//.test(photo.url), `Missing food image for ${restaurant.name}`);
    assert.ok(photo.alt && photo.credit && photo.sourceUrl, `Image source missing for ${restaurant.name}`);
  }
  assert.equal(menuPhotoFor({}, { id: "tako-cheena-mills" }), null);
});

test("exact Taco Bell product images outrank representative photography", () => {
  const taco = localRestaurants.find((restaurant) => restaurant.slug === "taco-bell-south-orange");
  const items = localDishes.filter((dish) => dish.restaurantId === taco.id && dish.imageUrl);
  assert.equal(items.length, 53);
  for (const dish of items) {
    const photo = menuPhotoFor(dish, taco);
    assert.equal(photo.exact, true);
    assert.equal(photo.url, dish.imageUrl);
    assert.match(photo.url, /tacobell\.com\/images\//);
  }
});

test("Chipotle offers an official exact guacamole image and labels other component images representative", () => {
  const restaurant = localRestaurants.find((item) => item.slug === "chipotle-south-orange");
  const guac = localDishes.find((dish) => dish.restaurantId === restaurant.id && dish.name === "Guacamole");
  const blackBeans = localDishes.find((dish) => dish.restaurantId === restaurant.id && dish.name === "Black Beans");
  assert.equal(menuPhotoFor(guac, restaurant).exact, true);
  assert.match(menuPhotoFor(guac, restaurant).url, /chipotle\.com\/content/);
  assert.equal(menuPhotoFor(blackBeans, restaurant).exact, false);
  assert.ok(menuPhotoFor(blackBeans, restaurant).credit);
  assert.ok(representativeMenuPhotos["hawkers-orlando"]);
});

test("cloud catalog merging retains reviewed product and restaurant image evidence", () => {
  const restaurant = localRestaurants.find((entry) => entry.slug === "taco-bell-south-orange");
  const dish = localDishes.find((entry) => entry.restaurantId === restaurant.id && entry.imageUrl);
  const merged = mergeLocalCatalog(
    [{ slug: restaurant.slug, id: "cloud-restaurant", imageUrl: "https://example.com/stale.jpg" }],
    [{ id: "cloud-dish", catalogKey: dish.catalogKey, restaurantId: "cloud-restaurant", imageUrl: null, name: dish.name }]
  );
  const combined = merged.dishes.find((entry) => entry.id === "cloud-dish");
  assert.equal(combined.imageUrl, dish.imageUrl);
  const venue = merged.restaurants.find((entry) => entry.id === "cloud-restaurant");
  assert.equal(venue.imageUrl, restaurant.imageUrl);
});

test("menu presentation distinguishes restaurant photos from exact product images", () => {
  const source = readFileSync(new URL("../components/Dining.js", import.meta.url), "utf8");
  assert.match(source, /photo\.exact \? "Menu item" : "Restaurant photo"/);
  assert.match(source, /<DishPhoto dish=\{dish\} restaurant=\{restaurant\}/);
  assert.match(source, /Check ingredient and allergen details separately/);
});
