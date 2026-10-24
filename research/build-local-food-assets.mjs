import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { localDishes } from "../mobile/src/local-catalog.js";
import { publishedMenus } from "../mobile/src/restaurant-menus.js";
import { sharedChainPhotoKeys } from "../mobile/src/local-photo-key.js";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const manifest = JSON.parse(readFileSync(path.join(root, "research/local-photo-manifest.json"), "utf8"));
const activeKeys = new Set(localDishes.map((dish) => dish.catalogKey));
const dishes = new Map(localDishes.map((dish) => [dish.catalogKey, dish]));
const menuItems = new Map(publishedMenus.flatMap((menu) => menu.items.map((item) => [`${menu.key}-${item.key}`, item])));
if (manifest.items.length !== activeKeys.size || new Set(manifest.items.map((item) => item.catalogKey)).size !== activeKeys.size || manifest.items.some((item) => !activeKeys.has(item.catalogKey))) {
  throw new Error("Photo inventory is stale. Run prepare-local-photo-review.mjs first.");
}
const assets = [];
const metadata = {};
const hashes = new Map();

for (const item of manifest.items) {
  if (!activeKeys.has(item.catalogKey) || item.review.status !== "approved") continue;
  const dish = dishes.get(item.catalogKey);
  const original = menuItems.get(item.catalogKey);
  const currentSpecification = {
    name: dish.name,
    description: dish.description,
    ingredients: dish.ingredients,
    servingSize: original.servingSize || original.portion || null,
    menuUrl: dish.provenance.menuUrl,
    kind: dish.provenance.kind,
  };
  const currentHash = createHash("sha256").update(JSON.stringify(currentSpecification)).digest("hex");
  if (currentHash !== item.specificationHash) throw new Error(`Recipe changed since review: ${item.catalogKey}`);
  const candidate = item.candidates.find((candidate) => candidate.id === item.review.selectedCandidateId);
  if (!candidate?.path || !item.review.inspectedAt || !item.review.notes ||
      !["identity", "ingredients", "portion", "framing", "quality"].every((check) => item.review.checks?.[check] === "pass")) {
    throw new Error(`Incomplete visual review: ${item.catalogKey}`);
  }
  if (/representative|context|other-location/i.test(candidate.kind || "")) {
    throw new Error(`A contextual photograph cannot be promoted as this exact dish: ${item.catalogKey}`);
  }
  if (candidate.origin === "generated" && (!candidate.generation?.prompt || !candidate.generation?.tool || !candidate.generation?.createdAt || !candidate.generation?.originalSha256)) {
    throw new Error(`Missing generation provenance: ${item.catalogKey}`);
  }
  const source = path.resolve(root, candidate.path);
  if (!source.startsWith(root + path.sep) || !existsSync(source) || !source.endsWith(".webp")) {
    throw new Error(`Invalid local candidate path: ${item.catalogKey}`);
  }
  const bytes = readFileSync(source);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== candidate.sha256) throw new Error(`Candidate changed since inspection: ${item.catalogKey}`);
  const duplicateKey = candidate.pixelHash || digest;
  if (hashes.has(duplicateKey)) throw new Error(`Repeated final photograph: ${hashes.get(duplicateKey)} and ${item.catalogKey}`);
  hashes.set(duplicateKey, item.catalogKey);
  const relative = `assets/food/${item.restaurant}/${item.itemKey}.webp`;
  const destination = path.join(root, "mobile", relative);
  mkdirSync(path.dirname(destination), { recursive: true });
  if (path.resolve(source) !== path.resolve(destination)) copyFileSync(source, destination);
  // Approved records must be reproducible from the checkout, not a reviewer's cache.
  candidate.path = "mobile/" + relative;
  assets.push(`  ${JSON.stringify(item.catalogKey)}: require(${JSON.stringify("../" + relative)}),`);
  metadata[item.catalogKey] = {
    path: relative,
    alt: candidate.alt || `${item.specification.name} at ${item.restaurantName}`,
    credit: candidate.credit || "Verifed generated illustration",
    generated: candidate.origin === "generated",
    sha256: digest,
    width: candidate.width,
    height: candidate.height,
  };
}

// Sharing a reviewed chain product does not invent a second visual review.
// Preserve each branch's pending review while recording its approved source.
for (const item of manifest.items) {
  const sourceKey = sharedChainPhotoKeys[item.catalogKey];
  if (sourceKey && metadata[sourceKey]) item.sharedPhotoFrom = sourceKey;
  else delete item.sharedPhotoFrom;
}

writeFileSync(path.join(root, "mobile/src/local-food-assets.js"),
  "// Generated from individually approved local-photo-manifest.json entries.\n" +
  "// Static require calls let Metro bundle every image on iOS, Android and web.\n" +
  "export const localFoodAssets = {\n" + assets.join("\n") + "\n};\n");
writeFileSync(path.join(root, "mobile/src/local-food-photo-metadata.js"),
  "// Generated display metadata. Source and generation provenance stay in research/local-photo-manifest.json.\n" +
  "export const localFoodPhotoMetadata = " + JSON.stringify(metadata, null, 2) + ";\n");
writeFileSync(path.join(root, "research/local-photo-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ activeItems: activeKeys.size, approvedBundled: assets.length, remaining: activeKeys.size - assets.length, complete: assets.length === activeKeys.size }));
