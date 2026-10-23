// Optional network health probe for third-party food imagery.
// Run: node scripts/verify-photo-urls.mjs
// 403 from a publisher can mean hotlink restrictions, not necessarily a missing asset.
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";
import { localRestaurants } from "../src/local-catalog.js";
import { restaurantFoodPhoto } from "../src/menu-photos.js";

const added = {
  "chipotle-south-orange": ["tortilla-chips"],
  "hawkers-orlando": Object.keys(verifiedDishPhotos["hawkers-orlando"]),
  "pizza-bruno-curry": ["take-out-garlic-knots-sauce", "meatballs-lemon-ricotta", "margherita-v"],
  "black-rooster-mills": ["guacamole-made-to-order", "achiote-pork"],
  "mamak-colonial": ["roti-canai"],
  "yellow-dog-eats-gotha": ["florida-cracker"],
  "fresh-kitchen-waterford": Object.keys(verifiedDishPhotos["fresh-kitchen-waterford"]),
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
  "tin-taco-downtown": ["mac-attack-taco"],
  "osteria-ester": ["spaghetti-alle-vongole"],
};
const dishJobs = Object.entries(added).flatMap(([slug, keys]) => keys.map((key) => ({ slug, key, ...verifiedDishPhotos[slug][key] })));
const coverJobs = localRestaurants.map((restaurant) => ({
  slug: restaurant.slug,
  key: "restaurant-food-cover",
  ...restaurantFoodPhoto(restaurant),
}));
const jobs = [...dishJobs, ...coverJobs];
async function inspect(item) {
  try {
    const response = await fetch(item.url, {
      method: "GET",
      headers: { Range: "bytes=0-8191", Accept: "image/*" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const contentType = response.headers.get("content-type") || "";
    await response.body?.cancel();
    return {
      menu: `${item.slug}/${item.key}`,
      status: response.status,
      contentType,
      healthy: response.ok && contentType.startsWith("image/"),
    };
  } catch (error) {
    return { menu: `${item.slug}/${item.key}`, status: "unavailable", reason: String(error.message || error), healthy: false };
  }
}
const results = [];
for (let i = 0; i < jobs.length; i += 8) {
  results.push(...await Promise.all(jobs.slice(i, i + 8).map(inspect)));
}
for (const result of results) console.log(JSON.stringify(result));
console.log(`PHOTO_HEALTH ${results.filter((r) => r.healthy).length}/${results.length}`);
