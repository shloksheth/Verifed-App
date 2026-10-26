import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../components/Home.js", import.meta.url), "utf8");
const section = home.slice(home.indexOf('<View style={h.hero}>'), home.indexOf('<View style={h.section}>'));
const styles = home.slice(home.indexOf('  // Distinct, non-overlapping columns'), home.indexOf('  section: {'));

test("hero keeps all messaging in its own green column, separate from food photography", () => {
  assert.match(section, /<View style=\{h\.hero\}>\s*\{\/\*/);
  assert.ok(section.indexOf('<View style={h.heroText}>') < section.indexOf('<View style={h.heroVisual}>'));
  assert.ok(section.indexOf('Reduce dietary mix-ups before you order.') < section.indexOf('<View style={h.heroVisual}>'));
  assert.ok(section.indexOf('Share your dietary needs with staff') < section.indexOf('<View style={h.heroVisual}>'));
  assert.match(section, /accessibilityLabel="Explore restaurant menus"/);
  assert.match(section, /onPress=\{\(\) => navigate\("explore"\)\}/);
  assert.doesNotMatch(section, /heroMask/);
});

test("hero has responsive non-overlapping columns and text can expand vertically", () => {
  assert.match(styles, /hero: \{[\s\S]*?flexDirection: "row"/);
  assert.match(styles, /heroText: \{[\s\S]*?width: "62%"/);
  assert.match(styles, /heroVisual: \{[\s\S]*?flex: 1/);
  assert.match(styles, /heroFood: \{ \.\.\.StyleSheet\.absoluteFillObject/);
  assert.doesNotMatch(styles, /heroMask:|maxWidth:"71%"|right:-39/);
  assert.doesNotMatch(styles, /height: 320/);
  assert.match(styles, /heroTitle: \{[\s\S]*?fontSize: 25/);
  assert.match(styles, /heroSub: \{[\s\S]*?lineHeight: 18/);
});
