import fs from "node:fs/promises";
import path from "node:path";

export const assetMimeTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function imageAssetPaths(root, directory = "assets") {
  const results = [];
  const entries = await fs.readdir(path.join(root, directory), { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = directory + "/" + entry.name;
    if (entry.isDirectory()) results.push(...await imageAssetPaths(root, relative));
    else if (entry.isFile() && assetMimeTypes[path.extname(entry.name).toLowerCase()]) results.push(relative);
  }
  return results;
}
