import test from "node:test";
import assert from "node:assert/strict";
import { localRestaurants, localDishes } from "../src/local-catalog.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";
import { menuPhotoFor } from "../src/menu-photos.js";

const expected = {
  "chipotle-south-orange":26,
  "fresh-kitchen-waterford":35,
  "black-rooster-mills":27,
};

test("all 88 Batch 1 menu entries have individually keyed and attributed image sources", () => {
  let total=0;
  for(const [slug,count] of Object.entries(expected)){
    const restaurant=localRestaurants.find(x=>x.slug===slug);
    const items=localDishes.filter(x=>x.restaurantId===restaurant.id);
    const photos=verifiedDishPhotos[slug];
    assert.equal(items.length,count);
    assert.equal(Object.keys(photos).length,count);
    let sources=new Set();
    for(const dish of items){
      const key=dish.catalogKey.slice(slug.length+1);
      const meta=photos[key];
      assert.ok(meta, dish.name);
      assert.match(meta.url,/^https:\/\//);
      assert.match(meta.sourceUrl,/^https:\/\//);
      assert.ok(meta.alt.length>=25 && meta.credit.length>=8,key);
      assert.equal(sources.has(meta.url),false,"Duplicate image within restaurant: "+key);
      sources.add(meta.url);
      const display=menuPhotoFor(dish,restaurant);
      assert.equal(display.url,meta.url);
      assert.equal(display.exact,
        !/^(representative|menu-context|editorial-context)/.test(dish.imageKind||"") &&
        !dish.imageGenerated);
    }
    total+=items.length;
  }
  assert.equal(total,88);
});

test("representative photos must remain explicitly separate from official product images", () => {
  for(const [slug,items] of Object.entries(expected)){
    for(const [key,photo] of Object.entries(verifiedDishPhotos[slug])){
      if (/^(representative|menu-context|editorial-context)/.test(photo.kind||"")) {
        assert.match(photo.alt,/representative|not|unconfirmed|illustrative|different/i,slug+"/"+key);
      }
    }
  }
});
