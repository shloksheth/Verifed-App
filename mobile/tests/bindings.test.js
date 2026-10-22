import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default || traverseModule;
const allowedGlobals = new Set([
  ...Object.getOwnPropertyNames(globalThis),
  "window",
  "document",
  "navigator",
  "global",
  "__DEV__",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "require",
]);

test("published app modules have no unbound variable references", async () => {
  const root = new URL("../", import.meta.url);
  const files = ["App.js", "styles.js"];
  for (const folder of ["components", "src"])
    for (const name of await readdir(new URL(folder + "/", root)))
      if (
        name.endsWith(".js") &&
        !["Scanner.js", "Workspace.js", "Requests.js"].includes(name)
      )
        files.push(folder + "/" + name);
  const failures = [];
  for (const file of files) {
    const tree = parse(await readFile(new URL(file, root), "utf8"), {
      sourceType: "module",
      plugins: ["jsx"],
    });
    traverse(tree, {
      ReferencedIdentifier(path) {
        const name = path.node.name;
        if (!allowedGlobals.has(name) && !path.scope.hasBinding(name))
          failures.push(`${file}:${path.node.loc.start.line}: ${name}`);
      },
    });
  }
  assert.deepEqual(
    failures,
    [],
    "An undefined value can crash a screen when it renders.",
  );
});
