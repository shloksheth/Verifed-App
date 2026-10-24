import test from "node:test";
import assert from "node:assert/strict";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";
import { menuPhotoFor } from "../src/menu-photos.js";

const slugs=["hawkers-orlando","loving-hut-orlando","taco-bell-south-orange","taco-bell-east-colonial","taco-bell-orlando-west"];
const counts={"hawkers-orlando":49,"loving-hut-orlando":61,"taco-bell-south-orange":116,"taco-bell-east-colonial":116,"taco-bell-orlando-west":116};
test("Batch 5 references a distinct item image for every active menu entry",()=>{
 let total=0,illustrative=0;
 for(const slug of slugs){
  const rest=localRestaurants.find(r=>r.slug===slug);assert.ok(rest);
  const dishes=localDishes.filter(d=>d.restaurantId===slug);assert.equal(dishes.length,counts[slug]);
  for(const dish of dishes){
   const record=menuPhotoFor(dish,rest);
   assert.ok(record, "Missing item photo "+dish.catalogKey);
   assert.match(record.url,/^https:\/\//,"Insecure image URL: "+dish.catalogKey);
   assert.ok(record.alt && record.sourceUrl, "Missing photo metadata: "+dish.catalogKey);
   if(!record.exact){illustrative++; assert.match(record.alt,/representative|not|illustrat/i,"Disclose representative photo: "+dish.catalogKey);}
   total++;
  }
 }
 assert.equal(total,458);
 assert.equal(illustrative,11);
});
test("All 3 Taco Bell branches use the same verified 63 first-party product photos",()=>{
 const slugs=["taco-bell-south-orange","taco-bell-east-colonial","taco-bell-orlando-west"];
 const first=verifiedDishPhotos[slugs[0]]; assert.equal(Object.keys(first).length,63);
 for(const [key,photo] of Object.entries(first)){
  assert.match(photo.url,/^https:\/\/www\.tacobell\.com\/images\//);
  for(const slug of slugs) assert.equal(verifiedDishPhotos[slug]?.[key]?.url,photo.url);
 }
});
test("Retired venue remains out of the live app",()=>{
 assert.equal(localRestaurants.some(r=>r.slug==="tako-cheena-mills"),false);
 assert.equal(localDishes.some(d=>d.restaurantId==="tako-cheena-mills"),false);
});
