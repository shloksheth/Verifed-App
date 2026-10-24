import { localDishes } from "./local-catalog.js";

const dishesByKey = new Map(localDishes.map((dish) => [dish.catalogKey, dish]));
const tacoBellBranches = ["taco-bell-east-colonial", "taco-bell-orlando-west"];
const canonicalBranch = "taco-bell-south-orange";

// Compare the food, not the branch address. A changed product must get its own
// review rather than quietly borrowing another item's photograph.
function productSignature(dish) {
  return JSON.stringify([
    dish.name,
    dish.description || "",
    dish.ingredients || [],
    dish.provenance?.kind,
  ]);
}

export const sharedChainPhotoKeys = {};
for (const dish of localDishes) {
  const branch = tacoBellBranches.find((slug) => dish.catalogKey.startsWith(slug + "-"));
  if (!branch) continue;
  const sourceKey = canonicalBranch + dish.catalogKey.slice(branch.length);
  const source = dishesByKey.get(sourceKey);
  if (source && productSignature(source) === productSignature(dish)) {
    sharedChainPhotoKeys[dish.catalogKey] = sourceKey;
  }
}

export function localPhotoKeyFor(dish) {
  const sourceKey = sharedChainPhotoKeys[dish.catalogKey];
  if (!sourceKey) return dish.catalogKey;
  const source = dishesByKey.get(sourceKey);
  return productSignature(source) === productSignature(dish) ? sourceKey : dish.catalogKey;
}
