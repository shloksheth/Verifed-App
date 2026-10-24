import test from "node:test";
import assert from "node:assert/strict";
import { localRestaurants,localDishes } from "../src/local-catalog.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";
import { menuPhotoFor } from "../src/menu-photos.js";
const tacoStores=["taco-bell-south-orange","taco-bell-east-colonial","taco-bell-orlando-west"];
test("Batch 5 official Taco Bell product photos are shared accurately across all three restaurants",()=>{
 const master=verifiedDishPhotos[tacoStores[0]];
 assert.ok(Object.keys(master).length>=62);
 for(const slug of tacoStores){
  assert.ok(localRestaurants.some(x=>x.slug===slug));
  for(const [key,img] of Object.entries(master)){
   assert.equal(verifiedDishPhotos[slug]?.[key]?.url,img.url,slug+"/"+key);
   assert.match(img.url,/^https:\/\/www\.tacobell\.com\/images\//);
   assert.ok(img.alt&&img.credit&&img.sourceUrl);
   const dish=localDishes.find(x=>x.catalogKey===slug+"-"+key);
   assert.ok(dish,slug+"/"+key);
   assert.equal(menuPhotoFor(dish)?.url,img.url);
  }
 }
});
test("Batch 5 Hawkers lo mein photos identify the protein depicted",()=>{
 const imgs=verifiedDishPhotos["hawkers-orlando"];
 for(const [key,protein] of [["chicken-lo-mein","chicken"],["steak-lo-mein","steak"],["shrimp-lo-mein","shrimp"]]){
  assert.ok(imgs[key]?.url);
  assert.match(imgs[key].alt,new RegExp(protein==="steak"?"beef|steak":protein,"i"));
  assert.ok(imgs[key].sourceUrl&&imgs[key].credit);
 }
});
test("A retired menu is not resurrected just to satisfy photo coverage",()=>{
 assert.equal(localRestaurants.some(x=>x.slug==="tako-cheena-mills"),false);
 assert.equal(localDishes.some(x=>x.restaurantId==="tako-cheena-mills"),false);
});
