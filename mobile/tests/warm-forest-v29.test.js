import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { featuredMenuSlugs } from "../src/featured-menus.js";
import { forest } from "../src/warm-forest.js";
const read = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("Warm Forest palette is scoped and separate from restaurant brand tokens", () => {
  assert.equal(forest.green, "#102F25");
  assert.equal(forest.orange, "#EB732E");
  assert.equal(forest.background, "#F3EBDD");
  for (const file of ["components/ChipotleMenu.js","components/TacoBellMenu.js"]) {
    assert.doesNotMatch(read(file), /warm-forest/);
  }
});

test("Home retains carrot mark and uses Verifed casing, real data and problem-solution hero", () => {
  const home = read("components/Home.js");
  assert.match(home, /Verifed carrot checkmark/);
  assert.match(home, /<Text style=\{h\.wordmark\}>Verifed<\/Text>/);
  assert.match(home, /Reduce dietary mix-ups before you order/);
  assert.match(home, /Share your dietary needs with staff/);
  assert.match(home, /featuredRestaurants\(state\.restaurants\)/);
  assert.match(home, /localFoodAssets\[featuredMenuCoverKeys\[restaurant\.slug\]\]/);
  assert.doesNotMatch(home, /Safe\. Simple\.|certified safe/i);
});

test("Explore lists only known featured complete menus, with Taco Bell and two locals first", () => {
  assert.deepEqual(featuredMenuSlugs,
    ["taco-bell-south-orange", "loving-hut-orlando", "hawkers-orlando", "fresh-kitchen-waterford", "chipotle-south-orange"]);
  const explore = read("components/Explore.js");
  assert.match(explore, /prioritizeFeaturedMenus\(cards\)/);
  assert.match(explore, /const featuredCards = orderedCards\.filter/);
  assert.match(explore, /group\.length > 1 \? setBranches\(group\)/);
  assert.match(explore, /surfaceStyle=\{f\.rowSurface\}/);
  assert.match(explore, /filter.*dietMode|dietMode.*filter/s);
});

test("Journal statistics are computed from real saved meal ratings, not mockup totals", () => {
  const journal = read("components/Journal.js");
  assert.match(journal, /ratedMeals\.reduce/);
  assert.match(journal, /\.toFixed\(1\)/);
  assert.match(journal, /<Text style=\{j\.count\}>\{averageRating\}<\/Text>/);
  assert.match(journal, /<Text style=\{j\.count\}>\{placeCount\}<\/Text>/);
  assert.match(journal, /<Text style=\{j\.count\}>\{state\.meals\.length\}<\/Text>/);
  assert.match(journal, /openSheet\(\{ type: "meal" \}\)/);
});

test("Floating pill and separate plus have different backgrounds and real quick actions", () => {
  const nav = read("components/FloatingNavigation.js");
  assert.match(nav, /backgroundColor: forest\.green/);
  assert.match(nav, /backgroundColor: forest\.orange/);
  assert.match(nav, /label: "Save a meal"/);
  assert.match(nav, /label: "Scan a menu"/);
  const app = read("App.js");
  assert.match(app, /warmScreen && !showWelcome/);
  assert.match(app, /chainMenu && \{ backgroundColor: "#FFFFFF" \}/);
});
