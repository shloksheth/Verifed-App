import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createSerialQueue } from "../src/storage-queue.js";
import { configureIdFactory, newId, copy } from "../src/model-utils.js";
import {
  restaurants,
  dishes,
  defaultProfile,
  ALLERGENS,
  RESTRICTIONS,
  TASTE_TAGS,
} from "../src/data.js";
import {
  localRestaurants,
  localDishes,
  mergeLocalCatalog,
} from "../src/local-catalog.js";
import {
  makeDemoState,
  makeRequest,
  transitionRequest,
} from "../src/domain.js";
import { finishCommittedWrite } from "../src/write-sync.js";
import { passwordSignIn, passwordSignUp } from "../src/account-auth.js";
import { createScanLibrary } from "../src/scan-library.js";
import { scanOwner, spanishSample } from "../src/menu-scan.js";

const source = (
  await readFile(new URL("../src/api.js", import.meta.url), "utf8")
)
  .replace(/^import[\s\S]*?;\r?\n/gm, "")
  .replace("export const api =", "const api =");

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

// Run the actual API with only its native/network adapters replaced. Delays below
// represent writes whose screen was closed before storage or the server replied.
function harness({ onStore, onQuery, onRpc } = {}) {
  const stored = new Map();
  let session = null;
  const client = {
    auth: {
      async signInWithPassword() {
        session = { user: { id: "account-a" } };
        return { data: {} };
      },
      async signOut() {
        session = null;
        return { data: {} };
      },
      async getSession() {
        return { data: { session } };
      },
    },
    rpc: (...args) => onRpc(...args),
    from(table) {
      let operation = "select";
      const query = {
        then(yes, no) {
          return Promise.resolve(
            onQuery?.(table, operation) ?? {
              data: table === "profiles" ? null : [],
            },
          ).then(yes, no);
        },
      };
      for (const method of [
        "select",
        "order",
        "range",
        "eq",
        "maybeSingle",
        "single",
      ])
        query[method] = () => query;
      for (const method of ["insert", "update", "upsert", "delete"])
        query[method] = () => {
          operation = method;
          return query;
        };
      return query;
    },
  };
  const adapters = {
    setupURLPolyfill() {},
    AsyncStorage: {
      async getItem(key) {
        return stored.get(key) ?? null;
      },
      async setItem(key, value) {
        await onStore?.(key, value);
        stored.set(key, value);
      },
      async removeItem(key) {
        stored.delete(key);
      },
    },
    AppState: {},
    Platform: { OS: "web" },
    Constants: {},
    Crypto: { randomUUID },
    WebBrowser: { maybeCompleteAuthSession() {} },
    makeRedirectUri() {},
    configureIdFactory,
    newId,
    copy,
    createSerialQueue,
    createClient: () => client,
    processLock() {},
    restaurants,
    dishes,
    defaultProfile,
    ALLERGENS,
    RESTRICTIONS,
    TASTE_TAGS,
    mergeLocalCatalog,
    makeDemoState,
    makeRequest,
    transitionRequest,
    supabaseUrl: "test",
    supabasePublishableKey: "test",
    finishCommittedWrite,
    passwordSignIn,
    passwordSignUp,
  };
  adapters.scanLibrary = createScanLibrary(adapters.AsyncStorage);
  adapters.scanOwner = scanOwner;
  const api = new Function(...Object.keys(adapters), `${source}\nreturn api;`)(
    ...Object.values(adapters),
  );
  return { api, stored };
}

test("guest allergy preview survives cloud refresh and is not written to an account", async () => {
  const writes = [];
  const { api, stored } = harness({
    onQuery: (table, operation) => {
      if (operation !== "select") writes.push(table);
    },
  });
  await api.previewProfile({
    allergies: ["Milk", "Milk", "invented"],
    name: "Guest",
  });
  await api.refresh();
  assert.deepEqual(api.getState().profile.allergies, ["Milk"]);
  assert.deepEqual(
    JSON.parse(stored.get("verifed-preview-profile-v1")).allergies,
    ["Milk"],
  );
  assert.equal(
    api.getState().restaurants.filter((r) => r.fictional === false).length,
    localRestaurants.length,
  );
  await api.signIn("sample@example.test", "placeholder");
  assert.deepEqual(api.getState().profile.allergies, []);
  assert.deepEqual(writes, []);
  await api.signOut();
  assert.deepEqual(api.getState().profile.allergies, ["Milk"]);
});

test("real restaurant cannot receive simulated kitchen requests in local demo", async () => {
  const { api } = harness();
  await api.enterDemo();
  const dish = api.getState().dishes.find((d) => d.provenance);
  await assert.rejects(
    api.createRequest({ dishId: dish.id }),
    /Contact the restaurant directly/,
  );
  await api.resetDemo();
  assert.equal(
    api.getState().restaurants.filter((r) => r.fictional === false).length,
    localRestaurants.length,
  );
});

test("a missing cloud catalog row remains browsable but cannot submit a text ID as a favorite", async () => {
  const { api } = harness();
  await api.signIn("sample@example.test", "placeholder");
  const dish = api.getState().dishes.find((item) => item.provenance);
  await assert.rejects(api.toggleFavorite(dish.id), /offline copy/);
});

test("reset waits for a pending demo commit and restores storage after it", async () => {
  const started = deferred(),
    finish = deferred();
  let pause = false;
  const { api, stored } = harness({
    onStore: async (key) => {
      if (pause && key === "verifed-demo-v1") {
        pause = false;
        started.resolve();
        await finish.promise;
      }
    },
  });
  await api.enterDemo();
  pause = true;
  const save = api.saveMeal({ dishName: "Before reset", rating: 4 });
  await started.promise;
  const reset = api.resetDemo();
  finish.resolve();
  assert.equal((await save).dishName, "Before reset");
  await reset;
  assert.equal(
    api.getState().meals.some((meal) => meal.dishName === "Before reset"),
    false,
  );
  assert.deepEqual(
    JSON.parse(stored.get("verifed-demo-v1")).meals,
    api.getState().meals,
  );
});

test("sign-out cannot be undone by a demo write that already started", async () => {
  const started = deferred(),
    finish = deferred();
  let pause = false;
  const { api, stored } = harness({
    onStore: async (key) => {
      if (pause && key === "verifed-demo-v1") {
        pause = false;
        started.resolve();
        await finish.promise;
      }
    },
  });
  await api.enterDemo();
  pause = true;
  const save = api.saveMeal({ dishName: "Committed locally", rating: 5 });
  await started.promise;
  const logout = api.signOut();
  await new Promise(setImmediate);
  finish.resolve();
  assert.equal((await save).dishName, "Committed locally");
  await logout;
  assert.equal(api.getState().mode, "guest");
  assert.equal(stored.has("verifed-mode"), false);
});

test("reset cancels queued demo edits that have not reached persistence", async () => {
  const started = deferred(),
    finish = deferred();
  let pause = false;
  const { api } = harness({
    onStore: async (key) => {
      if (pause && key === "verifed-demo-v1") {
        pause = false;
        started.resolve();
        await finish.promise;
      }
    },
  });
  await api.enterDemo();
  pause = true;
  const first = api.saveMeal({ dishName: "Already writing", rating: 4 });
  await started.promise;
  const cancelled = assert.rejects(
    api.saveMeal({ dishName: "Still queued", rating: 4 }),
    /session changed/,
  );
  const reset = api.resetDemo();
  finish.resolve();
  await Promise.all([first, cancelled, reset]);
  assert.equal(
    api.getState().meals.some((meal) => meal.dishName === "Still queued"),
    false,
  );
});

test("a committed cloud command returns its result without repopulating a signed-out account", async () => {
  const pending = deferred();
  const { api } = harness({ onRpc: () => pending.promise });
  await api.signIn("a@example.com", "password");
  const save = api.createRequest({ dishId: "dish" });
  await api.signOut();
  const committed = { id: "server-request", userId: "account-a" };
  pending.resolve({ data: committed });
  assert.equal(await save, committed);
  assert.equal(api.getState().mode, "guest");
  assert.deepEqual(api.getState().requests, []);
});

for (const table of ["profiles", "meals", "favorites"]) {
  test(`late ${table} writes preserve success without publishing into the next session`, async () => {
    const pending = deferred();
    const { api } = harness({
      onQuery: (name, operation) =>
        name === table && operation !== "select"
          ? pending.promise
          : name === "dishes" && operation === "select"
            ? { data: [{ body: localDishes[0] }] }
            : undefined,
    });
    await api.signIn("a@example.com", "password");
    const save =
      table === "profiles"
        ? api.saveProfile({ name: "Old account" })
        : table === "meals"
          ? api.saveMeal({ dishName: "Old account meal", rating: 4 })
          : api.toggleFavorite(api.getState().dishes[0].id);
    await api.signOut();
    pending.resolve({ data: { id: "server-id" } });
    await save;
    assert.equal(api.getState().mode, "guest");
    assert.equal(api.getState().profile.name, defaultProfile.name);
    assert.deepEqual(api.getState().meals, []);
    assert.deepEqual(api.getState().favorites, []);
  });
}

test("additional honey and dietary choices survive profile cleaning and refresh", async () => {
  const { api, stored } = harness();
  const profile = {
    ...defaultProfile,
    allergies: ["Honey"],
    restrictions: ["No garlic or onion", "Vegetarian (no eggs)"],
  };
  await api.previewProfile(profile);
  await api.refresh();
  assert.deepEqual(api.getState().profile.allergies, ["Honey"]);
  assert.deepEqual(api.getState().profile.restrictions, profile.restrictions);
  assert.deepEqual(
    JSON.parse(stored.get("verifed-preview-profile-v1")).restrictions,
    profile.restrictions,
  );
});

test("device favorites and journal persist across refresh without cloud writes", async () => {
  const writes = [];
  const { api, stored } = harness({
    onQuery: (table, operation) => {
      if (operation !== "select") writes.push(table);
    },
  });
  const dish = api.getState().dishes.find((item) => item.provenance);
  await api.toggleFavorite(dish.id);
  await api.saveMeal({
    dishId: dish.id,
    dishName: dish.name,
    restaurantName: "Orlando",
    rating: 4,
    notes: "Ask about preparation next time.",
  });
  await api.refresh();
  assert.deepEqual(api.getState().favorites, [dish.id]);
  assert.equal(api.getState().meals.length, 1);
  assert.equal(
    JSON.parse(stored.get("verifed-device-library-v1")).favoriteKeys[0],
    dish.catalogKey,
  );
  assert.deepEqual(writes, []);
  await api.signIn("account@example.test", "placeholder");
  assert.deepEqual(api.getState().favorites, []);
  assert.deepEqual(api.getState().meals, []);
  await api.signOut();
  assert.deepEqual(api.getState().favorites, [dish.id]);
  assert.equal(api.getState().meals.length, 1);
  assert.equal((await api.exportData()).mode, "guest");
  await api.deleteMyData();
  assert.deepEqual(api.getState().favorites, []);
  assert.deepEqual(api.getState().meals, []);
});

test("a delayed device save cannot populate a newly signed-in account", async () => {
  const started = deferred(),
    finish = deferred();
  const { api } = harness({
    onStore: async (key) => {
      if (key === "verifed-device-library-v1") {
        started.resolve();
        await finish.promise;
      }
    },
  });
  const save = api.saveMeal({ dishName: "Device meal", rating: 5 });
  await started.promise;
  await api.signIn("account@example.test", "placeholder");
  finish.resolve();
  await save;
  assert.equal(api.getState().mode, "cloud");
  assert.deepEqual(api.getState().meals, []);
  await api.signOut();
  assert.equal(api.getState().meals[0].dishName, "Device meal");
});


test("export and deletion include the current owner's local scanned menus", async () => {
  const { api, stored } = harness();
  const owner = scanOwner(api.getState());
  stored.set(`verifed-menu-scans-v1:${owner}`, JSON.stringify([spanishSample()]));
  stored.set("verifed-menu-scans-v1:account:another-user", JSON.stringify([spanishSample()]));
  const exported = await api.exportData();
  assert.equal(exported.scannedMenus.length, 1);
  await api.deleteMyData();
  assert.equal((await api.exportData()).scannedMenus.length, 0);
  assert.equal(api.getState().scanResetVersion, 1);
  assert.ok(stored.has("verifed-menu-scans-v1:account:another-user"));
});

test("demo reset clears that demo's scan library and signals draft reset", async () => {
  const { api, stored } = harness();
  await api.enterDemo();
  const owner = scanOwner(api.getState());
  stored.set(`verifed-menu-scans-v1:${owner}`, JSON.stringify([spanishSample()]));
  await api.resetDemo();
  assert.equal((await api.exportData()).scannedMenus.length, 0);
  assert.equal(api.getState().scanResetVersion, 1);
});
