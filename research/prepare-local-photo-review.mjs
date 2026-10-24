import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { localDishes, localRestaurants } from "../mobile/src/local-catalog.js";
import { publishedMenus } from "../mobile/src/restaurant-menus.js";

const output = fileURLToPath(new URL("./local-photo-manifest.json", import.meta.url));
const previous = existsSync(output) ? JSON.parse(readFileSync(output, "utf8")) : { items: [] };
const previousItems = new Map(previous.items.map((item) => [item.catalogKey, item]));
const restaurants = new Map(localRestaurants.map((restaurant) => [restaurant.id, restaurant]));

// A changed recipe invalidates approval. An accessible URL is only a candidate.
const items = localDishes.map((dish) => {
  const restaurant = restaurants.get(dish.restaurantId);
  const menu = publishedMenus.find((menu) => menu.key === restaurant.slug);
  const original = menu.items.find((item) => `${menu.key}-${item.key}` === dish.catalogKey);
  const specification = {
    name: dish.name,
    description: dish.description,
    ingredients: dish.ingredients,
    servingSize: original.servingSize || original.portion || null,
    menuUrl: dish.provenance.menuUrl,
    kind: dish.provenance.kind,
  };
  const specificationHash = createHash("sha256").update(JSON.stringify(specification)).digest("hex");
  const old = previousItems.get(dish.catalogKey);
  const candidates = old?.candidates || [];
  if (dish.imageUrl && !candidates.some((candidate) => candidate.url === dish.imageUrl)) {
    candidates.push({
      id: createHash("sha256").update(dish.imageUrl).digest("hex").slice(0, 16),
      origin: "sourced",
      url: dish.imageUrl,
      sourceUrl: dish.imageSourceUrl,
      credit: dish.imageCredit,
      alt: dish.imageAlt,
      kind: dish.imageKind,
      status: "not-downloaded",
    });
  }
  return {
    catalogKey: dish.catalogKey,
    restaurant: restaurant.slug,
    restaurantName: restaurant.name,
    itemKey: original.key,
    specification,
    specificationHash,
    candidates,
    searchLog: old?.searchLog || [],
    review: old?.specificationHash === specificationHash ? old.review : {
      status: "pending",
      selectedCandidateId: null,
      inspectedAt: null,
      notes: "Name, ingredients, portion, source identity and full-food framing require visual review.",
    },
  };
});

writeFileSync(output, JSON.stringify({
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  completionStatus: "incomplete",
  policy: {
    storage: "Local optimized WebP only for final assets; source URLs are internal provenance.",
    approval: "Human/agent visual inspection of each item; download success never grants approval.",
    alternatives: "If an accurate source is not immediately available, inspect at least four candidates.",
    generated: "Retain exact prompt, generator, date, original hash and visual-review notes.",
    duplicates: "Repeated content is flagged for resolution, never made unique by changing bytes.",
  },
  items,
}, null, 2) + "\n");
console.log(JSON.stringify({ activeItems: items.length, withCandidates: items.filter((item) => item.candidates.length).length, approved: items.filter((item) => item.review.status === "approved").length }));
