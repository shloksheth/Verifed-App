import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { navigationItems, primaryRoutes, contextualPages, bottomNavigationMode, tabForPage } from "../src/navigation-model.js";

test("Option B navigation is Home first with four primary tabs", () => {
  assert.deepEqual(primaryRoutes, ["home", "explore", "scan", "history"]);
  assert.deepEqual(navigationItems.map(({ route }) => route), primaryRoutes);
  assert.equal(new Set(navigationItems.map(({ label }) => label)).size, 4);
  assert.equal(navigationItems[0].label, "Home");
});

test("secondary screens display a contextual dock, not the five-tab footer", () => {
  for (const route of primaryRoutes) assert.equal(bottomNavigationMode(route), "primary");
  for (const route of ["restaurant", "dish", "meal", "favorites", "profile", "edit-profile", "settings", "help"])
    assert.equal(bottomNavigationMode(route), "contextual");
  assert.equal(bottomNavigationMode("auth"), "hidden");
  assert.equal(tabForPage("dish"), "explore");
  assert.equal(tabForPage("meal"), "history");
  assert.equal(tabForPage("profile"), null);
});

test("every context has a back escape and an actionable destination", () => {
  for (const [route, data] of Object.entries(contextualPages)) {
    assert.ok(data.title.length > 2 && data.icon && data.actionIcon, route);
    assert.ok(data.target, route);
  }
  const view = readFileSync(new URL("../components/FloatingNavigation.js", import.meta.url), "utf8");
  assert.match(view, /if \(!goBack\(\)\) navigate\("home"\)/);
  assert.match(view, /navigate\(item.target\)/);
  assert.match(view, /AccessibilityInfo\.isReduceMotionEnabled/);
  assert.match(view, /useNativeDriver: true/);
  assert.match(view, /openSheet\(\{ type: "meal" \}\)/);
});

test("plus menu offers real actions, header keeps profile accessible", () => {
  const nav = readFileSync(new URL("../components/FloatingNavigation.js", import.meta.url), "utf8");
  const home = readFileSync(new URL("../components/Home.js", import.meta.url), "utf8");
  const app = readFileSync(new URL("../App.js", import.meta.url), "utf8");
  assert.match(nav, /label: "Dietary profile", icon: "person-outline", action: "profile"/);
  assert.match(nav, /label: "Scan a menu", icon: "scan-outline", action: "scan"/);
  assert.match(nav, /label: "Save a meal", icon: "create-outline", action: "meal"/);
  assert.match(home, /accessibilityLabel="Open dietary profile"/);
  assert.match(app, /keyboardDidShow/);
  assert.match(app, /bottomNavigationMode\(route.page\)/);
});
