import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { imageAssetPaths, assetMimeTypes } from "../../research/native-tools/assets.mjs";
import { localFoodPhotoMetadata } from "../src/local-food-photo-metadata.js";

test("Snack's asset inventory includes every bundled food image and the logo", async () => {
  const paths = await imageAssetPaths(fileURLToPath(new URL("../", import.meta.url)));
  assert.ok(paths.includes("assets/verifed-mark.png"));
  for (const photo of Object.values(localFoodPhotoMetadata)) assert.ok(paths.includes(photo.path), photo.path);
  assert.equal(paths.filter((path) => path.startsWith("assets/food/")).length, Object.keys(localFoodPhotoMetadata).length);
  assert.equal(assetMimeTypes[".webp"], "image/webp");
  assert.equal(paths.some((path) => path.includes("node_modules") || /\.env/.test(path)), false);
});
