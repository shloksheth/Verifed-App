import test from "node:test";
import { snackVersionFor } from "../../research/native-tools/dependencies.mjs";
import { assertSnackFilesUploaded, findUploadedSnackAsset } from "../../research/native-tools/uploads.mjs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { imageAssetPaths, assetMimeTypes } from "../../research/native-tools/assets.mjs";
import { localFoodPhotoMetadata } from "../src/local-food-photo-metadata.js";

test("reused Snack assets must match the local bytes rather than merely return HTTP 200", async () => {
  const bytes = new TextEncoder().encode("test-image-content");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const url = await findUploadedSnackAsset(bytes, hash, async () => new Response(bytes));
  assert.match(url, /^https:\/\/snack-code-uploads\.s3\.us-west-1\.amazonaws\.com\/~asset\//);
  assert.equal(await findUploadedSnackAsset(bytes, hash, async () => new Response(null, { status: 404 })), null);
  await assert.rejects(findUploadedSnackAsset(bytes, hash, async () => new Response("wrong image")), /bytes do not match/);
});

test("Snack refuses failed or unfinished image uploads before saving", () => {
  assert.throws(() => assertSnackFilesUploaded({ "food.webp": { type: "ASSET", contents: new Blob(["unfinished"]) } }), /food\.webp/);
  assert.throws(() => assertSnackFilesUploaded({ "food.webp": { type: "ASSET", contents: "https://example.test/photo", error: new Error("upload failed") } }), /food\.webp/);
  assert.doesNotThrow(() => assertSnackFilesUploaded({ "food.webp": { type: "ASSET", contents: "https://example.test/photo" }, "App.js": { type: "CODE", contents: "export default App;" } }));
});

test("Snack's asset inventory includes every bundled food image and the logo", async () => {
  const paths = await imageAssetPaths(fileURLToPath(new URL("../", import.meta.url)));
  assert.ok(paths.includes("assets/verifed-mark.png"));
  assert.ok(paths.includes("assets/brands/taco-bell-logo.png"));
  assert.ok(paths.includes("assets/fonts/Anton-Regular.ttf"));
  assert.ok(paths.includes("assets/fonts/BarlowCondensed-SemiBold.ttf"));
  assert.equal(assetMimeTypes[".ttf"], "font/ttf");
  for (const photo of Object.values(localFoodPhotoMetadata)) assert.ok(paths.includes(photo.path), photo.path);
  assert.equal(paths.filter((path) => path.startsWith("assets/food/")).length, Object.keys(localFoodPhotoMetadata).length);
  assert.equal(assetMimeTypes[".webp"], "image/webp");
  assert.equal(paths.some((path) => path.includes("node_modules") || /\.env/.test(path)), false);
});

test("Snack publication preserves existing Expo-compatible dependency ranges", () => {
  assert.equal(snackVersionFor("expo-image", "~3.0.11"), "~3.0.11");
  assert.equal(snackVersionFor("expo-crypto", "15.0.9"), "~15.0.9");
  assert.equal(snackVersionFor("@expo/vector-icons", "^15.0.3"), "^15.0.3");
  assert.equal(snackVersionFor("@expo/vector-icons", "15.0.3"), "^15.0.3");
  assert.equal(snackVersionFor("@supabase/supabase-js", "2.118.0"), "2.118.0");
});
