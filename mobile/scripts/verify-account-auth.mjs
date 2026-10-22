// Disposable live account test; credentials and tokens stay in memory.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabasePublishableKey } from "../src/config.js";
import { passwordSignIn, passwordSignUp } from "../src/account-auth.js";
const client = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
const username = `qa_${suffix}`, email = `${username}@example.com`, password = randomUUID() + "aA9!";
const evidence = { checkedAt: new Date().toISOString(), passed: [], disposableUserId: null };
function pass(name) { evidence.passed.push(name); console.log("PASS:", name); }
try {
  const created = await passwordSignUp(client, { username, email, password });
  evidence.disposableUserId = created.user.id;
  assert.ok(created.session?.access_token);
  assert.equal((await client.from("profiles").select("name").single()).data?.name, username);
  pass("signup returns an immediate session and owner-readable profile");
  await client.auth.signOut();
  await assert.rejects(passwordSignUp(client, { username: username.toUpperCase(), email: `other_${email}`, password }), /Username already exists/);
  pass("case-insensitive duplicate username is rejected");
  await assert.rejects(passwordSignUp(client, { username: `qb_${suffix}`, email, password }), /email already has an account/);
  pass("duplicate email is rejected");
  await assert.rejects(passwordSignIn(client, username, "incorrect-password"), /incorrect/);
  await assert.rejects(passwordSignIn(client, `qx_${suffix}`, "incorrect-password"), /incorrect/);
  pass("wrong password and unknown username have the same error");
  await passwordSignIn(client, username.toUpperCase(), password);
  assert.equal((await client.auth.getUser()).data.user.id, created.user.id);
  pass("username login creates a real Auth session");
  assert.ifError((await client.from("profiles").update({ allergies: ["Honey"] }).eq("id", created.user.id)).error);
  await client.auth.signOut();
  await passwordSignIn(client, email.toUpperCase(), password);
  assert.deepEqual((await client.from("profiles").select("allergies").single()).data.allergies, ["Honey"]);
  pass("email login restores the same database profile");
  await client.auth.signOut();
  assert.ok((await client.rpc("verifed_account_lookup", { p_username: username, p_bucket: "0".repeat(64) })).error);
  pass("anonymous access to private email resolver is denied");
} catch (error) {
  evidence.failure = error.message; process.exitCode = 1; console.error("FAIL:", error.message);
} finally {
  await client.auth.signOut();
  await writeFile(new URL("../account-auth-verification.json", import.meta.url), JSON.stringify(evidence, null, 2) + "\n");
}
