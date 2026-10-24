import test from "node:test";
import assert from "node:assert/strict";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";
import { menuPhotoFor } from "../src/menu-photos.js";

const newSourceKeys = {
  "fresh-kitchen-waterford": [
    "6-bowl","4-bowl","3-bowl","cauliflower-rice","cauli-potato-mash",
    "coconut-ginger-rice","brown-rice","sweet-potato-noodles","chard-cabbage-slaw",
    "kale-caesar","arugula-spinach-salad","almond-chicken","bbq-chicken",
    "rosemary-chicken","herb-steak","lemon-broccoli","maple-sweet-potatoes",
    "basil-mushrooms","golden-chickpeas","green-beans","white-ginger",
    "coconut-sriracha","parmesan-cheese","pico-de-gallo","citrus-avocado",
    "toasted-almonds","feta-cheese","cucumber-salad","kale-pesto-tomatoes"
  ],
  "reyes-mezcaleria": ["tuna-tostada"],
  "the-monroe": ["the-monroes-famous-fried-chicken"],
  "the-strand-mills": ["strand-burger"],
  "the-osprey": ["lobster-roll"],
  "stubborn-mule": ["stubborn-mule-burger"],
  "lazy-moon-mills": ["20-tomato-base-includes-mozzarella"],
  "pig-floyds-mills": ["the-big-floyd"],
  "woodlands-orlando": ["masala-dosai"],
  "winter-park-biscuit": ["the-og"],
  "bombay-street-kitchen": ["pani-puri-8-pcs"],
  "tin-taco-downtown": ["mac-attack-taco"]
};

test("new menu photography is individually sourced, matched and nonduplicated", () => {
  const urls = new Map();
  for (const [slug, keys] of Object.entries(newSourceKeys)) {
    const restaurant = localRestaurants.find((r) => r.slug === slug);
    assert.ok(restaurant, slug);
    for (const key of keys) {
      const dish = localDishes.find((d) => d.catalogKey === `${slug}-${key}`);
      const photo = verifiedDishPhotos[slug]?.[key];
      assert.ok(dish, `Missing reviewed menu item ${slug}/${key}`);
      assert.ok(photo, `Missing photo ${slug}/${key}`);
      assert.match(photo.url, /^https:\/\//);
      assert.match(photo.sourceUrl, /^https:\/\//);
      assert.ok(photo.alt.length > 15 && photo.credit.length > 10);
      assert.equal(urls.has(photo.url), false, `Same image reused across different items: ${slug}/${key}`);
      urls.set(photo.url, `${slug}/${key}`);
      const resolved = menuPhotoFor(dish, restaurant);
      assert.equal(resolved.url, photo.url);
      assert.equal(resolved.exact, true);
    }
  }
  assert.equal(urls.size, 40);
});

test("official Fresh Kitchen images use their own item keys and source page", () => {
  const photos = verifiedDishPhotos["fresh-kitchen-waterford"];
  assert.equal(Object.keys(photos).length, 35);
  for (const meta of Object.values(photos)) {
    assert.equal(meta.sourceUrl, "https://www.eatfreshkitchen.com/menu");
    assert.match(meta.url, /cdn\.prod\.website-files\.com/);
  }
});

test("no generic image is substituted for unmatched food or inferred safe ingredients", () => {
  for (const restaurant of localRestaurants) {
    const dishes = localDishes.filter((d) => d.restaurantId === restaurant.id);
    for (const dish of dishes) {
      const photo = menuPhotoFor(dish, restaurant);
      if (photo) assert.equal(photo.exact,
        !/^(representative|menu-context|editorial-context)/.test(dish.imageKind || "") && !dish.imageGenerated);
      assert.ok(Array.isArray(dish.allergens));
    }
  }
  const fresh = localRestaurants.find((r) => r.slug === "fresh-kitchen-waterford");
  const unmatched = localDishes.find((d) => d.restaurantId === fresh.id && d.name === "Golden Char Chicken");
  assert.equal(menuPhotoFor(unmatched, fresh)?.exact, true);
});
