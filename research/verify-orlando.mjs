import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { supabaseUrl, supabasePublishableKey } from "../verifed-mobile/src/config.js";
import { localRestaurants, localDishes } from "../verifed-mobile/src/local-catalog.js";
const headers = { apikey: supabasePublishableKey };
async function read(path) {
  const rows = [];
  // The Data API caps a response at 1,000 rows. A larger catalog must not
  // silently validate only its first page.
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(supabaseUrl + "/rest/v1/" + path +
      `&order=id&limit=1000&offset=${offset}`, { headers });
    assert.equal(response.status, 200);
    const page = await response.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}
const restaurants = await read("restaurants?fictional=eq.false&select=*");
const menu = await read("dishes?select=id,restaurant_id,body");
for (const source of localRestaurants) {
  const live = restaurants.find((row) => row.slug === source.slug);
  assert.ok(live, source.slug);
  assert.equal(live.confirmed, false);
  assert.equal(live.details.address, source.address);
  assert.deepEqual(live.details.district, source.district);
  assert.equal(live.details.imageUrl, source.imageUrl);
  for (const entry of localDishes.filter((dish) => dish.restaurantId === source.id)) {
    const row = menu.find((item) => item.body.catalogKey === entry.catalogKey);
    assert.ok(row, entry.catalogKey);
    assert.equal(row.body.id, row.id);
    assert.equal(row.body.restaurantId, live.id);
    assert.equal(row.restaurant_id, live.id);
    assert.deepEqual(row.body.allergens, entry.allergens);
    assert.deepEqual(row.body.provenance, entry.provenance);
    assert.equal(row.body.price, null);
  }
}
const result = { verifiedAt: new Date().toISOString(), publicCatalogRead: true,
  restaurants: restaurants.map((r) => ({ slug: r.slug, entries: menu.filter((d) => d.restaurant_id === r.id).length })),
  sourceRecordsChecked: localDishes.length,
};
await writeFile(new URL("../outputs/verifed-design/verification/orlando-backend.json", import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
