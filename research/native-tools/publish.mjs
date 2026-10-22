import { Snack } from "snack-sdk";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../verifed-mobile",
);
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "package.json"), "utf8"),
);
const release = JSON.parse(await fs.readFile(path.join(root, "release.json"), "utf8"));
const files = {};
async function addFile(relative) {
  const bytes = await fs.readFile(path.join(root, relative));
  if (relative.endsWith(".png")) {
    files[relative] = {
      type: "ASSET",
      contents: new Blob([bytes], { type: "image/png" }),
    };
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
await addFile("assets/verifed-mark.png");
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
        version:
          name.startsWith("expo-") || name === "react-native-safe-area-context"
            ? `~${version}`
            : name === "@expo/vector-icons"
              ? `^${version}`
              : version,
      },
    ]),
);
const snack = new Snack({
  name: release.name,
  description: release.description,
  sdkVersion: "54.0.0",
  files,
  dependencies,
});
try {
  let state = await snack.getStateAsync();
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
  const saved = await snack.saveAsync({ ignoreUser: true });
  const publication = {
    version: release.number,
    name: release.name,
    ...saved,
    editorUrl: `https://snack.expo.dev/${saved.id}`,
    publishedAt: new Date().toISOString(),
    sdkVersion: state.sdkVersion,
    files: Object.keys(files),
    sourceHash: createHash("sha256")
      .update(
        JSON.stringify({
          code: Object.fromEntries(
            Object.entries(files).filter(([, value]) => value.type === "CODE"),
          ),
          dependencies: state.dependencies,
          logo: createHash("sha256")
            .update(
              await fs.readFile(path.join(root, "assets/verifed-mark.png")),
            )
            .digest("hex"),
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
