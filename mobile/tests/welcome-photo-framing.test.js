import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../components/Welcome.js", import.meta.url), "utf8");

test("welcome's Chipotle photo is displayed without further crop, while other slides keep their original framing", () => {
  assert.match(source, /source=\{dish\.source\}\s+contentFit=\{index === 0 \? "contain" : "cover"\}/);
  assert.match(source, /style=\{\[w\.photoFrame, index === 0 && w\.chipotleFrame\]\}/);
  assert.match(source, /chipotle-vegetarian-bowl\.webp/);
});
