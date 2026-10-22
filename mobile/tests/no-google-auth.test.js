import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("mobile sign-in stays in the app without Google or companion-login options", () => {
  const account = source("../components/Account.js");
  assert.match(account, /Username or email/);
  assert.match(account, /Create account/);
  assert.match(account, /Continue without an account/);
  assert.doesNotMatch(account, /signInWithGoogle|googleAuthEnabled|Continue with Google/);
  assert.doesNotMatch(account, /Google on companion website|development build|needs a Verifed development build/i);
  assert.doesNotMatch(account, /\$\{websiteUrl\}\/\#\/auth/);
});

test("mobile API no longer exposes Google OAuth", () => {
  const api = source("../src/api.js");
  const config = source("../src/config.js");
  assert.doesNotMatch(api, /signInWithGoogle|signInWithOAuth|openAuthSessionAsync|maybeCompleteAuthSession/);
  assert.doesNotMatch(config, /googleAuthEnabled/);
  assert.match(api, /async signIn\(identifier, password\)/);
  assert.match(api, /async signUp\(email, password, username\)/);
});
