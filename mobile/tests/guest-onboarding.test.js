import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bottomNavigationMode } from "../src/navigation-model.js";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("sign-in screen uses approved CAC purpose headline and supporting copy", () => {
  const account = read("components/Account.js");
  assert.match(account, /signin: "Make your dietary needs clear before you order"/);
  assert.match(account, /signin: "Sign in to save your allergies and dietary preferences, explore restaurant menus, and communicate your needs more clearly with restaurant staff\."/);
  assert.match(account, /signin: "Sign in",\s*signup: "Create account"/);
});

test("guest entry visits a distinct preference page before Explore", () => {
  const app = read("App.js");
  const account = read("components/Account.js");
  assert.match(app, /onContinue=\{\(\) => \{\s*setWelcomeDone\(true\);\s*navigate\("guest-preferences"\)/);
  assert.match(app, /case "guest-preferences":\s*screen = <ProfileEditor \{\.\.\.shared\} onboarding returnTo="explore" \/>/);
  assert.match(account, /onPress=\{\(\) => navigate\("guest-preferences"\)\}/);
  assert.equal(bottomNavigationMode("guest-preferences"), "hidden");
  assert.match(app, /route\.page === "guest-preferences" \? null/);
});

test("guest X is top-left and truly unboxed; dismiss without saving", () => {
  const account = read("components/Account.js");
  assert.match(account, /accessibilityLabel="Close dietary preferences and explore as a guest"/);
  assert.match(account, /onPress=\{\(\) => navigate\("explore"\)\}/);
  assert.match(account, /<Icon name="close" size=\{26\} color=\{forest\.ink\} \/>/);
  assert.match(account, /close: \{ width: 48, height: 48/);
  assert.match(account, /borderWidth: 0, backgroundColor: "transparent"/);
  assert.doesNotMatch(account, /guestPrefs\.close[\s\S]{0,80}api\.previewProfile/);
});

test("guests can save selected allergy, restriction and flavor options to the device before Explore", () => {
  const account = read("components/Account.js");
  const api = read("src/api.js");
  assert.match(account, /label="Allergies"/);
  assert.match(account, /label="Dietary restrictions"/);
  assert.match(account, /label="Flavors you like"/);
  assert.match(account, /onboarding\s*\? "explore"/);
  assert.match(account, /\? api\.previewProfile\(draft\)/);
  assert.match(account, /Save preferences and explore/);
  assert.match(api, /async previewProfile\(profile\)/);
  assert.match(api, /AsyncStorage\.setItem\(PREVIEW_KEY, JSON\.stringify\(clean\)\)/);
});
