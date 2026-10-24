import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { localDishes, localRestaurants } from "../mobile/src/local-catalog.js";
import { featuredRestaurants, primaryDemoMenuSlugs } from "../mobile/src/featured-menus.js";
import { localPhotoKeyFor } from "../mobile/src/local-photo-key.js";
import { localFoodPhotoMetadata } from "../mobile/src/local-food-photo-metadata.js";
import { MAJOR_ALLERGENS } from "../mobile/src/data.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(root, "research/local-photo-manifest.json"), "utf8"));
const reviewed = new Set(manifest.items.filter((item) => item.review.status === "approved").map((item) => item.catalogKey));
const menus = featuredRestaurants(localRestaurants).map((restaurant) => {
  const dishes = localDishes.filter((dish) => dish.restaurantId === restaurant.id);
  const missingImages = dishes.filter((dish) => {
    const key = localPhotoKeyFor(dish);
    const photo = localFoodPhotoMetadata[key];
    return !reviewed.has(key) || !photo || !existsSync(path.join(root, "mobile", photo.path));
  }).map((dish) => dish.catalogKey);
  return {
    restaurant: restaurant.slug, name: restaurant.name, primaryDemo: primaryDemoMenuSlugs.includes(restaurant.slug), menuEntries: dishes.length,
    localImages: dishes.length - missingImages.length, missingImages,
    generatedIllustrations: dishes.filter((dish) => localFoodPhotoMetadata[localPhotoKeyFor(dish)]?.generated).length,
    itemsWithPublishedIngredientText: dishes.filter((dish) => dish.ingredients.length > 0).length,
    itemsWithUnconfirmedMajorAllergens: dishes.filter((dish) => MAJOR_ALLERGENS.some((allergen) =>
      !dish.allergens.includes(allergen) && !dish.provenance.freeFromAllergens.includes(allergen))).length,
  };
});
const report = { checkedAt: new Date().toISOString(), scope: "Five featured imported food menus; the preferred three are listed first. Not a claim of live restaurant availability or complete allergy information",
  menus, totalMenuEntries: menus.reduce((total, menu) => total + menu.menuEntries, 0),
  primaryDemoMenuEntries: menus.filter((menu) => menu.primaryDemo).reduce((total, menu) => total + menu.menuEntries, 0),
  allFeaturedImagesLocal: menus.length === 5 && menus.every((menu) => menu.menuEntries > 0 && !menu.missingImages.length) };
writeFileSync(path.join(root, "research/featured-menu-readiness.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.allFeaturedImagesLocal) process.exitCode = 1;
