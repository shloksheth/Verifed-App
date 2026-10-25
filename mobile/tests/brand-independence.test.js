import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const file = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("Taco Bell menu restores V25 purple and white, not the global palette", () => {
  const source = file("components/TacoBellMenu.js");
  assert.match(source, /const purple = "#501098"/);
  assert.match(source, /const vivid = "#8B20DB"/);
  assert.match(source, /backgroundColor: "#FFFFFF"/);
  assert.doesNotMatch(source, /const purple = colors\.green/);
  assert.match(source, /contentFit="contain"/);
});

test("Chipotle retains independent brown and red component menu visual hierarchy", () => {
  const source = file("components/ChipotleMenu.js");
  assert.match(source, /const brown = "#451400"/);
  assert.match(source, /const red = "#AC2318"/);
  assert.match(source, /CHOOSE YOUR INGREDIENTS/);
  assert.match(source, /dish\.name\.toUpperCase\(\)/);
  assert.doesNotMatch(source, /const brown = colors\.ink/);
});

test("welcome restores the deep-green V25 design with white primary action", () => {
  const source = file("components/Welcome.js");
  assert.match(source, /backgroundColor: "#FFFFFF",\s*borderRadius: 28/);
  assert.match(source, /backgroundColor: "#17281F"/);
  assert.match(source, /color: "#17281F"/);
  assert.match(source, /contentFit=\{index === 0 \? "contain" : "cover"\}/);
  assert.match(source, /<Text style=\{w\.wordmark\}>verifed<\/Text>/);
});

test("authentication is dark-green and brand menus do not inherit the cream shell", () => {
  const auth = file("components/Account.js");
  const app = file("App.js");
  assert.match(auth, /backgroundColor: "#17281F"/);
  assert.match(auth, /style=\{authStyles\.form\}/);
  assert.match(app, /chainMenu === "taco-bell"/);
  assert.match(app, /chainMenu && \{ backgroundColor: "#FFFFFF" \}/);
  assert.match(app, /!inAccount/);
});

test("all visible shell wordmarks are light and have no orange terminal dot", () => {
  const app = file("App.js");
  const home = file("components/Home.js");
  const welcome = file("components/Welcome.js");
  const styles = file("styles.js");
  assert.doesNotMatch(app, /verifed<Text style=\{s\.brandDot\}>/);
  assert.doesNotMatch(home, /verifed<Text/);
  assert.match(home, /fontFamily: "HomeBody"/);
  assert.match(styles, /brand: \{[\s\S]*?fontWeight: "400"/);
  assert.match(welcome, /fontWeight: "400",\s*letterSpacing: -0\.8/);
});
