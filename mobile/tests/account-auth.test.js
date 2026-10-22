import test from "node:test";
import assert from "node:assert/strict";
import { validateSignup, validateLogin, passwordSignIn, passwordSignUp } from "../src/account-auth.js";

const signup = { username: "  Dinner_Fan ", email: " DINER@EXAMPLE.COM ", password: "test-only-example" };
test("signup normalizes username and email but preserves the password", () => {
  assert.deepEqual(validateSignup(signup), { username: "dinner_fan", email: "diner@example.com", password: signup.password });
  for (const username of ["ab", "has space", "@diner", "a".repeat(25)])
    assert.throws(() => validateSignup({ ...signup, username }), /3–24/);
  assert.throws(() => validateSignup({ ...signup, email: "" }), /email/);
  assert.throws(() => validateSignup({ ...signup, password: "short" }), /eight/);
  assert.equal(validateLogin(" DINNER_FAN ", "pass"), "dinner_fan");
  assert.throws(() => validateLogin("", "pass"), /username or email/);
});

test("email login goes directly through Auth with a generic wrong-password error", async () => {
  const client = { auth: { async signInWithPassword(input) {
    assert.deepEqual(input, { email: "diner@example.com", password: "wrong" });
    return { error: { code: "invalid_credentials" } };
  } } };
  await assert.rejects(passwordSignIn(client, "Diner@example.com", "wrong"), /incorrect/);
});

test("username login installs a normal session without fetching a public email", async () => {
  let installed;
  const session = { access_token: "test-access", refresh_token: "test-refresh" };
  const client = {
    functions: { async invoke(name, { body }) {
      assert.equal(name, "account-auth");
      assert.deepEqual(body, { action: "signin", username: "dinner_fan", password: "secret-example" });
      return { data: session };
    } },
    auth: { async setSession(value) { installed = value; return { data: { session } }; } },
  };
  await passwordSignIn(client, "DINNER_FAN", "secret-example");
  assert.deepEqual(installed, session);
});

test("duplicate username stops before creating an Auth account", async () => {
  const client = { functions: { async invoke() { return { data: { available: false } }; } } };
  await assert.rejects(passwordSignUp(client, signup), /Username already exists/);
});

test("signup handles the database uniqueness race with a useful username error", async () => {
  let checks = 0;
  const client = {
    functions: { async invoke() { return { data: { available: ++checks === 1 } }; } },
    auth: { async signUp() { return { error: { code: "unexpected_failure", message: "Database error saving new user" } }; } },
  };
  await assert.rejects(passwordSignUp(client, signup), /Username already exists/);
  assert.equal(checks, 2);
});

test("duplicate email gives an actionable error", async () => {
  const client = {
    functions: { async invoke() { return { data: { available: true } }; } },
    auth: { async signUp() { return { error: { code: "user_already_exists", message: "User already registered" } }; } },
  };
  await assert.rejects(passwordSignUp(client, signup), /email already has an account/);
});

test("signup requires a real session, and forwards only validated identity metadata", async () => {
  let session = { access_token: "test-access" };
  const client = {
    functions: { async invoke() { return { data: { available: true } }; } },
    auth: { async signUp(input) {
      assert.deepEqual(input.options.data, { username: "dinner_fan", name: "dinner_fan" });
      return { data: { session } };
    } },
  };
  assert.equal((await passwordSignUp(client, signup)).session, session);
  session = null;
  await assert.rejects(passwordSignUp(client, signup), /confirmation is still enabled/);
});

test("server rate-limit messages survive the function adapter", async () => {
  const client = { functions: { async invoke() {
    return { error: { context: { async json() { return { error: "Too many attempts. Wait a minute and try again." }; } } } };
  } } };
  await assert.rejects(passwordSignIn(client, "dinner_fan", "wrong"), /Too many attempts/);
});
