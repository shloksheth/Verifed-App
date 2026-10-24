// Verify the new V14.5 photo URLs. This checks image delivery,
// not whether the image is an accurate representation of current recipes.
import { verifiedDishPhotos } from "../src/verified-dish-photos.js";

const newRecords = {
  "seito-baldwin-park": ["hand-made-dumplings"],
  "sparrow-orlando": ["say-cheese"],
  "reyes-mezcaleria": ["guacamole"],
  "winter-park-biscuit": ["wpbc-box"],
  "mamak-colonial": ["nasi-goreng-indonesia", "pad-thai"],
  "lazy-moon-mills": ["slice-garden-grazer-pizza"],
};
let passed = 0;
for (const [restaurant, keys] of Object.entries(newRecords)) {
  for (const key of keys) {
    const url = verifiedDishPhotos[restaurant]?.[key]?.url;
    if (!url) throw Error(`No photo: ${restaurant}/${key}`);
    try {
      const response = await fetch(url, {
        headers: { Accept: "image/*", Range: "bytes=0-8191" },
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      });
      const type = response.headers.get("content-type") || "";
      const ok = response.ok && type.startsWith("image/");
      await response.body?.cancel();
      if (ok) passed++;
      console.log(JSON.stringify({ restaurant, key, status: response.status, type, ok }));
    } catch (error) {
      console.log(JSON.stringify({ restaurant, key, ok: false, error: String(error.message || error) }));
    }
  }
}
console.log(`NEW_PHOTOS_HEALTHY ${passed}/7`);
