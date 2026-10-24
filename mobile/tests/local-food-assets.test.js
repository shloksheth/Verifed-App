import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { localDishes } from "../src/local-catalog.js";
import { localFoodPhotoMetadata } from "../src/local-food-photo-metadata.js";

const mobileRoot = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(new URL("../../research/local-photo-manifest.json", import.meta.url), "utf8"));
const registrySource = readFileSync(new URL("../src/local-food-assets.js", import.meta.url), "utf8");
const assets = vm.runInNewContext(registrySource.replace("export const localFoodAssets =", "globalThis.assets ="), {
  require(relative) { return path.resolve(mobileRoot, "src", relative); },
});

test("the photo QA inventory includes exactly the current active catalog", () => {
  assert.deepEqual(manifest.items.map((item) => item.catalogKey).sort(), localDishes.map((dish) => dish.catalogKey).sort());
  assert.equal(new Set(manifest.items.map((item) => item.catalogKey)).size, localDishes.length);
  for (const item of manifest.items) {
    const dish = localDishes.find((dish) => dish.catalogKey === item.catalogKey);
    assert.equal(item.specification.name, dish.name);
    assert.deepEqual(item.specification.ingredients, dish.ingredients);
  }
});

test("every bundled image has a complete visual decision and unchanged WebP content", () => {
  const approved = manifest.items.filter((item) => item.review.status === "approved");
  assert.ok(approved.length > 0);
  assert.equal(Object.keys(assets).length, approved.length);
  assert.deepEqual(Object.keys(assets).sort(), Object.keys(localFoodPhotoMetadata).sort());
  const seen = new Set();
  for (const item of approved) {
    const candidate = item.candidates.find((candidate) => candidate.id === item.review.selectedCandidateId);
    const metadata = localFoodPhotoMetadata[item.catalogKey];
    assert.ok(item.review.inspectedAt && item.review.notes);
    for (const check of ["identity", "ingredients", "portion", "framing", "quality"]) assert.equal(item.review.checks[check], "pass", `${item.catalogKey}: ${check}`);
    assert.ok(existsSync(assets[item.catalogKey]), item.catalogKey);
    assert.equal(path.resolve(mobileRoot, metadata.path), assets[item.catalogKey]);
    const bytes = readFileSync(assets[item.catalogKey]);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), candidate.sha256);
    assert.equal(metadata.sha256, candidate.sha256);
    assert.equal(seen.has(candidate.pixelHash), false, `Repeated image: ${item.catalogKey}`);
    seen.add(candidate.pixelHash);
    assert.doesNotMatch(metadata.path, /https?:/);
    if (metadata.generated) assert.ok(candidate.generation?.prompt && candidate.generation?.originalSha256 && candidate.generation?.tool);
  }
});

test("downloads, rejected images and generated drafts are not silently approved", () => {
  for (const item of manifest.items.filter((item) => item.review.status !== "approved")) {
    assert.equal(assets[item.catalogKey], undefined);
    assert.equal(localFoodPhotoMetadata[item.catalogKey], undefined);
  }
});

test("both menu renderers prefer the local asset over the legacy remote reference", () => {
  for (const file of ["Dining.js", "TacoBellMenu.js"]) {
    const source = readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8");
    assert.match(source, /localFoodAssets\[dish\.catalogKey\]/);
    assert.match(source, /source=\{localAsset \|\| \{ uri: photo\.url \}\}/);
    assert.match(source, /resizeMode="contain"/);
  }
});
