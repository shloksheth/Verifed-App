import { writeFileSync } from "node:fs";
import { localDishes, localRestaurants } from "../src/local-catalog.js";
import { menuPhotoFor } from "../src/menu-photos.js";
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";

const restaurants = new Map(localRestaurants.map(r => [r.slug,r]));
const records = localDishes.map(d => {
  const p = menuPhotoFor(d, restaurants.get(d.restaurantId));
  return {
    catalogKey: d.catalogKey,
    restaurant: d.restaurantId,
    name: d.name,
    description: d.description || "",
    imageStatus: p ? (p.generated ? "illustrative" : "sourced") : "missing",
    imageUrl: p?.url || "",
    imageSourceUrl: p?.sourceUrl || "",
    credit: p?.credit || "",
    alt: p?.alt || "",
    imageFit: "contain",
    actionNeeded: p ? "Review image identity, sharpness, rights and mobile rendering" : "Find exact dish photo; check multiple candidates; do not reuse restaurant cover",
  };
});
const counts = Object.fromEntries(localRestaurants.map(r => {
  const items = records.filter(x => x.restaurant === r.slug);
  return [r.slug, { total:items.length, sourced:items.filter(x=>x.imageStatus==="sourced").length, missing:items.filter(x=>x.imageStatus==="missing").length }];
}));
const all=records.length,sourced=records.filter(x=>x.imageStatus==="sourced").length;
const report={createdAt:"2026-10-23",all,sourced,missing:all-sourced,perRestaurant:counts,items:records};
writeFileSync(new URL("../photo-audit.json", import.meta.url),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({all,sourced,missing:all-sourced,perRestaurant:counts},null,2));
