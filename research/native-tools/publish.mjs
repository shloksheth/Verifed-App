import { Snack } from "snack-sdk";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { assetMimeTypes, imageAssetPaths } from "./assets.mjs";
import { snackVersionFor } from "./dependencies.mjs";
import { assertSnackFilesUploaded, findUploadedSnackAsset } from "./uploads.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../mobile",
);
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "package.json"), "utf8"),
);
const release = JSON.parse(await fs.readFile(path.join(root, "release.json"), "utf8"));
const files = {};
const assetHashes = {};
async function addFile(relative) {
  const bytes = await fs.readFile(path.join(root, relative));
  const mimeType = assetMimeTypes[path.extname(relative).toLowerCase()];
  if (mimeType) {
    files[relative] = {
      type: "ASSET",
      contents: new File([bytes], path.basename(relative), { type: mimeType }),
    };
    assetHashes[relative] = createHash("sha256").update(bytes).digest("hex");
    return;
  }
  const contents = bytes.toString("utf8");
  if (/GOCSPX-|sb_secret_|service_role/.test(contents))
    throw new Error(
      `Refusing to publish a file containing a secret marker: ${relative}`,
    );
  files[relative] = { type: "CODE", contents };
}
await addFile("App.js");
await addFile("styles.js");
for (const directory of ["components", "src"]) {
  for (const name of (await fs.readdir(path.join(root, directory))).sort())
    if (name.endsWith(".js") && !(directory === "components" && ["Scanner.js", "Workspace.js", "Requests.js"].includes(name))) await addFile(`${directory}/${name}`);
}
for (const relative of await imageAssetPaths(root)) await addFile(relative);
const dependencies = Object.fromEntries(
  Object.entries(manifest.dependencies)
    .filter(
      ([name]) =>
        ![
          "expo",
          "react",
          "react-dom",
          "react-native",
          "react-native-web",
          "expo-camera",
          "react-native-qrcode-svg",
        ].includes(name),
    )
    .map(([name, version]) => [
      name,
      {
        version: snackVersionFor(name, version),
      },
    ]),
);
const assetEntries = Object.entries(files).filter(([, file]) => file.type === "ASSET");
const verifiedRemoteUrls = {};
for (let start = 0; start < assetEntries.length; start += 8) {
  await Promise.all(assetEntries.slice(start, start + 8).map(async ([name, file]) => {
    const bytes = new Uint8Array(await file.contents.arrayBuffer());
    const url = await findUploadedSnackAsset(bytes, assetHashes[name]);
    if (url) verifiedRemoteUrls[name] = url;
  }));
}
console.log(`Reused ${Object.keys(verifiedRemoteUrls).length}/${assetEntries.length} byte-verified uploaded images`);
const snack = new Snack({
  name: release.name,
  description: release.description,
  sdkVersion: "54.0.0",
  files: {
    ...Object.fromEntries(Object.entries(files).filter(([, file]) => file.type === "CODE")),
    ...Object.fromEntries(Object.entries(verifiedRemoteUrls).map(([name, url]) => [name, { type: "ASSET", contents: url }])),
  },
  dependencies,
});
try {
  let state = await snack.getStateAsync();
  const pendingAssets = assetEntries.filter(([name]) => !verifiedRemoteUrls[name]);
  // A bounded batch avoids hundreds of simultaneous multipart requests.
  for (let start = 0; start < pendingAssets.length; start += 8) {
    const batch = pendingAssets.slice(start, start + 8);
    for (let attempt = 0; attempt < 3; attempt++) {
      const retryFiles = await Promise.all(batch.map(async ([name, file]) => [name, {
        type: "ASSET", contents: new File([await file.contents.arrayBuffer()], path.basename(name), { type: file.contents.type }),
      }]));
      snack.updateFiles(Object.fromEntries(retryFiles));
      state = await snack.getStateAsync();
      try {
        assertSnackFilesUploaded(Object.fromEntries(batch.map(([name]) => [name, state.files[name]])));
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        console.log(`Retrying ${batch.length} image uploads after an incomplete batch`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    console.log(`Uploaded ${Math.min(start + 8, pendingAssets.length)}/${pendingAssets.length} new assets`);
  }
  if (Object.keys(state.missingDependencies).length) {
    console.log(
      "Resolving peer dependencies:",
      Object.keys(state.missingDependencies),
    );
    snack.updateDependencies(
      Object.fromEntries(
        Object.entries(state.missingDependencies).map(([name, info]) => [
          name,
          { version: info.wantedVersion || info.version || "*" },
        ]),
      ),
    );
    state = await snack.getStateAsync();
  }
  const failures = Object.entries(state.dependencies).filter(
    ([, value]) => value.error,
  );
  if (failures.length)
    throw new Error(
      `Dependency resolution failed: ${failures.map(([name, value]) => `${name}: ${value.error.message}`).join("; ")}`,
    );
  if (Object.keys(state.missingDependencies).length)
    throw new Error(
      `Unresolved peers: ${Object.keys(state.missingDependencies).join(", ")}`,
    );
  assertSnackFilesUploaded(state.files);
  // Verify the actual uploaded bytes as well as the SDK's success response.
  for (let start = 0; start < assetEntries.length; start += 8) {
    await Promise.all(assetEntries.slice(start, start + 8).map(async ([name]) => {
      if (state.files[name].contents === verifiedRemoteUrls[name]) return;
      const url = new URL(state.files[name].contents);
      if (url.hostname !== "snack-code-uploads.s3.us-west-1.amazonaws.com") {
        throw new Error(`Unexpected upload destination for ${name}`);
      }
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Uploaded image unavailable: ${name} (HTTP ${response.status})`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (createHash("sha256").update(bytes).digest("hex") !== assetHashes[name]) {
        throw new Error(`Uploaded image bytes differ: ${name}`);
      }
    }));
  }
  console.log(`Verified ${assetEntries.length} uploaded asset hashes`);
  const saved = await snack.saveAsync({ ignoreUser: true });
  const publication = {
    version: release.number,
    name: release.name,
    ...saved,
    editorUrl: `https://snack.expo.dev/${saved.id}`,
    publishedAt: new Date().toISOString(),
    sdkVersion: state.sdkVersion,
    files: Object.keys(files),
    assetHashes,
    uploadVerification: {
      assets: assetEntries.length,
      images: assetEntries.filter(([name]) => !name.endsWith(".ttf")).length,
      fonts: assetEntries.filter(([name]) => name.endsWith(".ttf")).length,
      allSourceHashesMatch: true,
    },
    sourceHash: createHash("sha256")
      .update(
        JSON.stringify({
          code: Object.fromEntries(
            Object.entries(files).filter(([, value]) => value.type === "CODE"),
          ),
          dependencies: state.dependencies,
          assets: assetHashes,
        }),
      )
      .digest("hex"),
  };
  await fs.writeFile(
    path.join(root, "publication.json"),
    JSON.stringify(publication, null, 2) + "\n",
  );
  console.log(JSON.stringify(publication, null, 2));
} finally {
  snack.setOnline(false);
}
