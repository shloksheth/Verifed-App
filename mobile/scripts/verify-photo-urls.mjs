// Optional network health probe for third-party food imagery.
// Run: node scripts/verify-photo-urls.mjs
// 403 from a publisher can mean hotlink restrictions, not necessarily a missing asset.
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";

const added = {
  "chipotle-south-orange": ["tortilla-chips"],
  "hawkers-orlando": ["twice-fried-wings", "pad-thai"],
  "pizza-bruno-curry": ["take-out-garlic-knots-sauce", "meatballs-lemon-ricotta", "margherita-v"],
  "black-rooster-mills": ["guacamole-made-to-order", "achiote-pork"],
  "mamak-colonial": ["roti-canai"],
  "yellow-dog-eats-gotha": ["florida-cracker"],
};
const jobs = Object.entries(added).flatMap(([slug, keys]) => keys.map((key) => ({ slug, key, ...verifiedDishPhotos[slug][key] })));
async function inspect(item) {
  try {
    const response = await fetch(item.url, {
      method: "GET",
      headers: { Range: "bytes=0-8191", Accept: "image/*" },
      signal: AbortSignal.timeout(10000),
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
for (let i = 0; i < jobs.length; i += 4) {
  results.push(...await Promise.all(jobs.slice(i, i + 4).map(inspect)));
}
for (const result of results) console.log(JSON.stringify(result));
console.log(`PHOTO_HEALTH ${results.filter((r) => r.healthy).length}/${results.length}`);
