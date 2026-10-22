import "./native-globals.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { configureIdFactory, newId, copy } from "./model-utils.js";
import { createSerialQueue } from "./storage-queue.js";
import { createClient, processLock } from "@supabase/supabase-js";
import {
  restaurants,
  dishes,
  defaultProfile,
  ALLERGENS,
  RESTRICTIONS,
  TASTE_TAGS,
} from "./data.js";
import { makeDemoState, makeRequest, transitionRequest } from "./domain.js";
import { supabaseUrl, supabasePublishableKey } from "./config.js";
import { finishCommittedWrite } from "./write-sync.js";
import { mergeLocalCatalog } from "./local-catalog.js";

configureIdFactory(Crypto.randomUUID);
WebBrowser.maybeCompleteAuthSession();
const DEMO_KEY = "verifed-demo-v1";
const MODE_KEY = "verifed-mode";
const PREVIEW_KEY = "verifed-preview-profile-v1";
const LIBRARY_KEY = "verifed-device-library-v1";
let previewProfile = cloneProfile(defaultProfile);
let deviceLibrary = { favoriteKeys: [], meals: [] };
function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}
function cleanProfile(profile) {
  const choices = (values, allowed) => [
    ...new Set(
      (Array.isArray(values) ? values : []).filter((value) =>
        allowed.includes(value),
      ),
    ),
  ];
  return {
    name: String(profile.name || "")
      .trim()
      .slice(0, 100),
    allergies: choices(profile.allergies, ALLERGENS),
    restrictions: choices(profile.restrictions, RESTRICTIONS),
    likes: choices(profile.likes, TASTE_TAGS),
    dislikes: choices(profile.dislikes, TASTE_TAGS),
  };
}
if (Platform.OS !== "web") {
  try {
    new URL(supabaseUrl);
    new global.URL(supabaseUrl);
  } catch (error) {
    throw new Error(`Native URL setup failed: ${error.message}`);
  }
}
const client =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          lock: processLock,
        },
      })
    : null;
const clone = copy;
const listeners = new Set();
function deviceCollections(catalog) {
  const find = (key) =>
    catalog.dishes.find((dish) => (dish.catalogKey || dish.id) === key);
  return {
    favorites: deviceLibrary.favoriteKeys
      .map((key) => find(key)?.id)
      .filter(Boolean),
    meals: deviceLibrary.meals.map((meal) => {
      const dish = find(meal.dishKey);
      return {
        ...meal,
        dishId: dish?.id || null,
        restaurantId: dish?.restaurantId || null,
      };
    }),
  };
}
const empty = () => {
  const catalog = clone(mergeLocalCatalog(restaurants, dishes));
  return {
    ready: false,
    mode: "guest",
    user: null,
    profile: clone(previewProfile),
    ...catalog,
    requests: [],
    ...deviceCollections(catalog),
    memberships: [],
    connection: "idle",
    error: null,
    passwordRecovery: false,
  };
};
let state = empty();
let initialized = false;
let generation = 0;
let refreshSequence = 0;

function publish(next) {
  state = next;
  for (const listener of listeners) listener();
}
function requireUser() {
  if (!state.user) throw new Error("Sign in or open the demo to continue.");
}
function writeContext() {
  const started = generation;
  const mode = state.mode;
  const userId = state.user?.id;
  return () =>
    started === generation && mode === state.mode && userId === state.user?.id;
}
function result(response) {
  if (response.error) throw new Error(response.error.message);
  return response.data;
}
function requireCloud() {
  if (!client)
    throw new Error(
      "Cloud setup is unavailable. You can still choose the local demo.",
    );
  return client;
}
async function loadDemo() {
  const stored = await AsyncStorage.getItem(DEMO_KEY);
  if (!stored) return makeDemoState();
  try {
    const saved = JSON.parse(stored);
    if (
      saved.mode === "demo" &&
      Array.isArray(saved.requests) &&
      Array.isArray(saved.dishes)
    )
      return {
        ...saved,
        ...mergeLocalCatalog(saved.restaurants, saved.dishes, {
          preferBundled: true,
        }),
      };
  } catch {
    /* A damaged demo can be safely reset without touching cloud data. */
  }
  return makeDemoState();
}

// A single queue keeps two rapid taps from reading and overwriting the same
// saved demo. Failed edits release the queue so the next action can continue.
const enqueueDemo = createSerialQueue();
const enqueueDevice = createSerialQueue();
async function editDevice(change) {
  if (state.mode !== "guest")
    throw new Error("Open your device library as a guest first.");
  const isCurrent = writeContext();
  return enqueueDevice(async () => {
    if (!isCurrent())
      throw new Error("Your session changed. Try that action again.");
    const next = clone(deviceLibrary);
    const value = change(next);
    await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
    deviceLibrary = next;
    // A delayed device write must never replace a signed-in account's data.
    if (isCurrent()) publish({ ...state, ...deviceCollections(state) });
    return value;
  });
}
async function editDemo(change) {
  const isCurrent = writeContext();
  return enqueueDemo(async () => {
    const next = clone(await loadDemo());
    if (!isCurrent())
      throw new Error("Your session changed. Open this action again.");
    const value = change(next);
    await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(next));
    if (isCurrent()) publish({ ...next, connection: "local", error: null });
    return value;
  });
}

async function openDemo(reset) {
  const started = ++generation;
  return enqueueDemo(async () => {
    if (started !== generation)
      throw new Error("Your session changed. Open the demo again.");
    const next = reset ? makeDemoState() : await loadDemo();
    Object.assign(
      next,
      mergeLocalCatalog(next.restaurants, next.dishes, { preferBundled: true }),
    );
    await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(next));
    await AsyncStorage.setItem(MODE_KEY, "demo");
    if (started === generation)
      publish({ ...next, connection: "local", error: null });
  });
}

async function refreshCloud() {
  const ownGeneration = generation;
  const sequence = ++refreshSequence;
  const session = result(await requireCloud().auth.getSession()).session;
  const user = session?.user || null;
  const jobs = [readAll("restaurants", "*"), readAll("dishes", "*")];
  if (user)
    jobs.push(
      client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      readAll("requests", "body"),
      readAll("meals", "id,body"),
      readAll("favorites", "dish_id", "dish_id"),
      readAll("memberships", "restaurant_id,role", "restaurant_id"),
    );
  const responses = (await Promise.all(jobs)).map(result);
  if (
    ownGeneration !== generation ||
    sequence !== refreshSequence ||
    state.mode === "demo"
  )
    return;
  const [catalog, menu, profile, requests, meals, favorites, memberships] =
    responses;
  const publicCatalog = mergeLocalCatalog(
    catalog,
    menu.map((row) => row.body),
  );
  publish({
    ...empty(),
    ready: true,
    mode: user ? "cloud" : "guest",
    user,
    profile: !user
      ? clone(previewProfile)
      : profile || {
          ...clone(defaultProfile),
          id: user?.id,
          name: user?.user_metadata?.name || "",
        },
    ...publicCatalog,
    requests: (requests || [])
      .map((row) => row.body)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    meals: user
      ? (meals || [])
          .map((row) => ({ ...row.body, id: row.id }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : deviceCollections(publicCatalog).meals,
    favorites: user
      ? (favorites || []).map((row) => row.dish_id)
      : deviceCollections(publicCatalog).favorites,
    memberships: (memberships || []).map((row) => ({
      restaurantId: row.restaurant_id,
      role: row.role,
    })),
    connection: "online",
    passwordRecovery: state.passwordRecovery,
  });
}

async function readAll(table, columns, order = "id") {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = result(
      await client
        .from(table)
        .select(columns)
        .order(order)
        .range(offset, offset + 999),
    );
    rows.push(...page);
    if (page.length < 1000) return { data: rows, error: null };
  }
}

async function refresh() {
  if (state.mode === "demo") return;
  const ownGeneration = generation;
  return refreshCloud().catch((error) => {
    if (ownGeneration !== generation || state.mode === "demo") return;
    publish({
      ...state,
      ready: true,
      connection: "error",
      error: error.message,
    });
    throw error;
  });
}
async function command(action, payload = {}) {
  requireUser();
  const isCurrent = writeContext();
  const value = result(
    await requireCloud().rpc("verifed_command", {
      p_action: action,
      p_payload: payload,
    }),
  );
  // The server may have committed for an account that is no longer open.
  if (!isCurrent()) return value;
  if (action === "createRequest")
    publish({ ...state, requests: [value, ...state.requests] });
  if (action === "actOnRequest")
    publish({
      ...state,
      requests: state.requests.map((request) =>
        request.id === value.id ? value : request,
      ),
    });
  if (action === "addDish")
    publish({ ...state, dishes: [...state.dishes, value] });
  if (action === "saveDish")
    publish({
      ...state,
      dishes: state.dishes.map((dish) => (dish.id === value.id ? value : dish)),
    });
  if (action === "deleteMyData")
    publish({
      ...state,
      profile: { ...clone(defaultProfile), id: state.user.id },
      requests: state.requests.filter(
        (request) => request.userId !== state.user.id,
      ),
      meals: [],
      favorites: [],
    });
  return synchronizeWrite(value, isCurrent);
}

function synchronizeWrite(value, isCurrent) {
  if (!isCurrent()) return value;
  return finishCommittedWrite(value, refresh, (message) => {
    if (isCurrent()) publish({ ...state, connection: "error", error: message });
  });
}

export const api = {
  getState: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async init() {
    if (initialized) return;
    try {
      const saved = JSON.parse(await AsyncStorage.getItem(PREVIEW_KEY));
      if (saved && Array.isArray(saved.allergies))
        previewProfile = cleanProfile(saved);
    } catch {
      /* Ignore damaged local preferences; no account data is involved. */
    }
    try {
      const saved = JSON.parse(await AsyncStorage.getItem(LIBRARY_KEY));
      if (Array.isArray(saved?.favoriteKeys) && Array.isArray(saved?.meals)) {
        deviceLibrary = {
          favoriteKeys: saved.favoriteKeys.filter(
            (key) => typeof key === "string",
          ),
          meals: saved.meals.filter(
            (meal) =>
              typeof meal?.id === "string" && typeof meal.dishName === "string",
          ),
        };
      }
    } catch {
      /* A damaged device library does not affect any cloud account. */
    }
    if (state.mode === "guest")
      publish({
        ...state,
        profile: clone(previewProfile),
        ...deviceCollections(state),
      });
    if ((await AsyncStorage.getItem(MODE_KEY)) === "demo")
      publish({ ...(await loadDemo()), connection: "local", error: null });
    initialized = true;
    if (client) {
      client.auth.onAuthStateChange(() => {
        // Do not await Supabase work inside its own auth lock.
        if (state.mode !== "demo")
          setTimeout(() => refresh().catch(() => {}), 0);
      });
      if (Platform.OS !== "web") {
        AppState.addEventListener("change", (next) => {
          if (next === "active") {
            client.auth.startAutoRefresh();
            if (state.mode !== "demo") refresh().catch(() => {});
          } else client.auth.stopAutoRefresh();
        });
      }
      setInterval(() => {
        if (state.mode === "cloud" && AppState.currentState === "active")
          refresh().catch(() => {});
      }, 15000);
    }
    if (state.mode !== "demo") {
      if (client) await refresh();
      else publish({ ...state, ready: true, connection: "unconfigured" });
    }
  },
  refresh,
  async enterDemo() {
    return openDemo(false);
  },
  async resetDemo() {
    return openDemo(true);
  },
  async signIn(email, password) {
    result(
      await requireCloud().auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
    );
    generation++;
    await enqueueDemo(() => AsyncStorage.removeItem(MODE_KEY));
    publish({ ...empty(), ready: true });
    await refresh();
  },
  async signInWithGoogle() {
    if (
      Platform.OS === "web" ||
      Constants.executionEnvironment === "storeClient"
    )
      throw new Error(
        "Google sign-in needs a Verifed development build. You can save dishes and journal on this device without signing in, or use the companion website for an account.",
      );
    const redirectTo = makeRedirectUri({
      scheme: "verifed",
      path: "auth/callback",
    });
    const { url } = result(
      await requireCloud().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      }),
    );
    const response = await WebBrowser.openAuthSessionAsync(url, redirectTo);
    if (response.type !== "success") throw new Error("Sign-in was cancelled.");
    const callback = new URL(response.url);
    const params = new URLSearchParams(callback.hash.slice(1));
    if (params.get("error"))
      throw new Error("Google sign-in was not completed. Please try again.");
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token)
      throw new Error("Sign-in returned without a session. Please try again.");
    result(await client.auth.setSession({ access_token, refresh_token }));
    generation++;
    await enqueueDemo(() => AsyncStorage.removeItem(MODE_KEY));
    publish({ ...empty(), ready: true });
    await refresh();
  },
  async signUp(email, password, name) {
    if (password.length < 8)
      throw new Error("Use at least 8 characters for your password.");
    const data = result(
      await requireCloud().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: String(name || "").trim() },
          emailRedirectTo:
            "https://verifed-dining-studio.jackbruns247.chatgpt.site",
        },
      }),
    );
    if (data.session) {
      generation++;
      await enqueueDemo(() => AsyncStorage.removeItem(MODE_KEY));
      publish({ ...empty(), ready: true });
      await refresh();
    }
    return { verificationRequired: !data.session };
  },
  async resetPassword(email) {
    result(
      await requireCloud().auth.resetPasswordForEmail(email.trim(), {
        redirectTo:
          "https://verifed-dining-studio.jackbruns247.chatgpt.site/#/reset-password",
      }),
    );
  },
  async updatePassword(password) {
    const isCurrent = writeContext();
    if (password.length < 8) throw new Error("Use at least 8 characters.");
    result(await requireCloud().auth.updateUser({ password }));
    if (isCurrent()) publish({ ...state, passwordRecovery: false });
  },
  async signOut() {
    if (client) result(await client.auth.signOut());
    generation++;
    await enqueueDemo(() => AsyncStorage.removeItem(MODE_KEY));
    publish({ ...empty(), ready: true });
    if (client) await refresh();
  },
  async saveProfile(profile) {
    requireUser();
    const isCurrent = writeContext();
    const clean = {
      id: state.user.id,
      name: String(profile.name || "")
        .trim()
        .slice(0, 100),
      allergies: profile.allergies || [],
      restrictions: profile.restrictions || [],
      likes: profile.likes || [],
      dislikes: profile.dislikes || [],
    };
    if (state.mode === "demo")
      return editDemo((next) => {
        next.profile = clean;
      });
    result(await requireCloud().from("profiles").upsert(clean));
    if (!isCurrent()) return clean;
    publish({ ...state, profile: clean });
    return synchronizeWrite(clean, isCurrent);
  },
  async previewProfile(profile) {
    if (state.mode !== "guest")
      throw new Error("Use Save profile for your signed-in account.");
    const isCurrent = writeContext();
    const clean = cleanProfile(profile);
    await AsyncStorage.setItem(PREVIEW_KEY, JSON.stringify(clean));
    previewProfile = clean;
    if (isCurrent()) publish({ ...state, profile: clone(clean) });
  },
  async createRequest(input) {
    requireUser();
    if (state.mode === "demo")
      return editDemo((next) => {
        const dish = next.dishes.find((d) => d.id === input.dishId);
        if (!dish) throw new Error("Dish not found.");
        if (
          !next.restaurants.find(
            (r) => r.id === dish.restaurantId && r.fictional,
          )?.confirmed
        )
          throw new Error(
            "This menu is unconfirmed. Contact the restaurant directly.",
          );
        const request = makeRequest(dish, input, next.user.id);
        next.requests.unshift(request);
        return request;
      });
    return command("createRequest", input);
  },
  async actOnRequest(id, action, payload = {}, expectedRevision) {
    requireUser();
    if (state.mode === "demo")
      return editDemo((next) => {
        const index = next.requests.findIndex((request) => request.id === id);
        if (index < 0) throw new Error("Request not found.");
        const request = next.requests[index];
        const staff = ["respond", "change"].includes(action);
        if (
          staff &&
          !next.memberships.some((m) => m.restaurantId === request.restaurantId)
        )
          throw new Error("Restaurant staff permission required.");
        const changed = transitionRequest(
          request,
          action,
          payload,
          staff ? "staff" : "diner",
          expectedRevision,
        );
        next.requests[index] = changed;
        return changed;
      });
    return command("actOnRequest", {
      ...payload,
      id,
      action,
      expectedRevision,
    });
  },
  async saveMeal(meal) {
    if (state.mode !== "guest") requireUser();
    const isCurrent = writeContext();
    if (
      !String(meal.dishName || "").trim() ||
      !Number.isInteger(Number(meal.rating)) ||
      Number(meal.rating) < 1 ||
      Number(meal.rating) > 5
    )
      throw new Error("Add a dish name and a rating from 1 to 5.");
    const existing = meal.id
      ? state.meals.find((item) => item.id === meal.id)
      : null;
    if (meal.id && !existing)
      throw new Error("Meal not found. Refresh your history.");
    const body = {
      dishId: meal.dishId || null,
      restaurantId: meal.restaurantId || null,
      dishName: meal.dishName.trim().slice(0, 120),
      restaurantName: String(meal.restaurantName || "").slice(0, 120),
      rating: Number(meal.rating),
      notes: String(meal.notes || "").slice(0, 2000),
      tags: meal.tags || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    if (state.mode === "guest") {
      const dish = state.dishes.find((item) => item.id === meal.dishId);
      return editDevice((next) => {
        const saved = {
          ...body,
          dishKey: dish?.catalogKey || dish?.id || existing?.dishKey || null,
          id: existing?.id || newId(),
        };
        if (existing)
          next.meals = next.meals.map((item) =>
            item.id === existing.id ? saved : item,
          );
        else next.meals.unshift(saved);
        return saved;
      });
    }
    if (state.mode === "demo")
      return editDemo((next) => {
        const saved = { ...body, id: existing?.id || newId() };
        if (existing)
          next.meals = next.meals.map((item) =>
            item.id === existing.id ? saved : item,
          );
        else next.meals.unshift(saved);
        return saved;
      });
    const query = existing
      ? requireCloud()
          .from("meals")
          .update({ body })
          .eq("id", existing.id)
          .eq("user_id", state.user.id)
      : requireCloud().from("meals").insert({ user_id: state.user.id, body });
    const saved = result(await query.select("id").single());
    const value = { ...body, id: saved.id };
    if (!isCurrent()) return value;
    publish({
      ...state,
      meals: existing
        ? state.meals.map((item) => (item.id === value.id ? value : item))
        : [value, ...state.meals],
    });
    return synchronizeWrite(value, isCurrent);
  },
  async toggleFavorite(dishId) {
    const dish = state.dishes.find((item) => item.id === dishId);
    if (!dish) throw new Error("Dish not found.");
    if (state.mode === "guest")
      return editDevice((next) => {
        const key = dish.catalogKey || dish.id;
        next.favoriteKeys = next.favoriteKeys.includes(key)
          ? next.favoriteKeys.filter((item) => item !== key)
          : [...next.favoriteKeys, key];
      });
    requireUser();
    if (state.mode === "cloud" && dish?.provenance && !dish.cloudBacked)
      throw new Error(
        "This menu is an offline copy. Refresh the catalog before saving it to your account.",
      );
    const isCurrent = writeContext();
    if (state.mode === "demo")
      return editDemo((next) => {
        if (!next.dishes.some((d) => d.id === dishId))
          throw new Error("Dish not found.");
        next.favorites = next.favorites.includes(dishId)
          ? next.favorites.filter((id) => id !== dishId)
          : [...next.favorites, dishId];
      });
    const query = state.favorites.includes(dishId)
      ? requireCloud()
          .from("favorites")
          .delete()
          .eq("user_id", state.user.id)
          .eq("dish_id", dishId)
      : requireCloud()
          .from("favorites")
          .upsert({ user_id: state.user.id, dish_id: dishId });
    result(await query);
    if (!isCurrent()) return;
    publish({
      ...state,
      favorites: state.favorites.includes(dishId)
        ? state.favorites.filter((id) => id !== dishId)
        : [...state.favorites, dishId],
    });
    return synchronizeWrite(undefined, isCurrent);
  },
  async saveDish(dish) {
    requireUser();
    if (state.mode === "demo")
      return editDemo((next) => {
        const index = next.dishes.findIndex((d) => d.id === dish.id),
          old = next.dishes[index];
        if (
          !old ||
          !next.memberships.some((m) => m.restaurantId === old.restaurantId)
        )
          throw new Error("Restaurant staff permission required.");
        if (old.revision !== dish.revision)
          throw new Error("Menu changed. Refresh before saving.");
        if (
          !String(dish.name || "").trim() ||
          !Array.isArray(dish.ingredients) ||
          !Array.isArray(dish.allergens)
        )
          throw new Error("Provide a name, ingredients, and allergens.");
        if (
          !Number.isFinite(Number(dish.price)) ||
          Number(dish.price) < 0 ||
          Number(dish.price) > 10000
        )
          throw new Error("Enter a valid price.");
        const updated = {
          ...old,
          name: dish.name,
          description: dish.description,
          price: Number(dish.price),
          category: dish.category,
          emoji: dish.emoji,
          tags: dish.tags,
          modifications: dish.modifications,
          ingredients: dish.ingredients,
          allergens: dish.allergens,
          preparation: dish.preparation,
          informationComplete: dish.informationComplete,
          revision: old.revision + 1,
        };
        next.dishes[index] = updated;
        next.requests = next.requests.map((request) =>
          request.dishId !== dish.id ||
          ["completed", "cancelled", "declined"].includes(request.status)
            ? request
            : transitionRequest(
                request,
                "change",
                {
                  dishName: updated.name,
                  ingredients: updated.ingredients,
                  allergens: updated.allergens,
                  preparation: updated.preparation,
                  dishRevision: updated.revision,
                  reason:
                    "Restaurant updated this dish. A new response is required.",
                },
                "staff",
                request.revision,
              ),
        );
        return updated;
      });
    return command("saveDish", dish);
  },
  async addDish(dish) {
    requireUser();
    if (state.mode === "demo")
      return editDemo((next) => {
        if (!next.memberships.some((m) => m.restaurantId === dish.restaurantId))
          throw new Error("Restaurant staff permission required.");
        if (
          !String(dish.name || "").trim() ||
          !Array.isArray(dish.ingredients) ||
          !Array.isArray(dish.allergens)
        )
          throw new Error("Provide a name, ingredients, and allergens.");
        const saved = {
          id: newId(),
          restaurantId: dish.restaurantId,
          name: dish.name.trim(),
          description: dish.description || "",
          price: Number(dish.price || 0),
          emoji: dish.emoji || "🍽️",
          category: dish.category || "Plates",
          ingredients: dish.ingredients,
          allergens: dish.allergens,
          tags: dish.tags || [],
          modifications: dish.modifications || [],
          preparation:
            dish.preparation ||
            "Ask staff about preparation and shared equipment.",
          informationComplete: !!dish.informationComplete,
          revision: 1,
        };
        next.dishes.push(saved);
        return saved;
      });
    return command("addDish", dish);
  },
  async createRestaurant(input) {
    requireUser();
    if (state.mode === "demo")
      return editDemo((next) => {
        if (!String(input.name || "").trim())
          throw new Error("Enter a restaurant name.");
        if (next.memberships.length >= 3)
          throw new Error("You can create up to three fictional workspaces.");
        const restaurant = {
          id: newId(),
          name: input.name.trim(),
          location: input.location || "Fictional workspace",
          description:
            input.description || "Your fictional restaurant workspace",
          emoji: "🍽️",
          confirmed: true,
          fictional: true,
        };
        next.restaurants.push(restaurant);
        next.memberships.push({ restaurantId: restaurant.id, role: "owner" });
        next.dishes.push(
          ...clone(dishes.slice(0, 4)).map((d) => ({
            ...d,
            id: newId(),
            restaurantId: restaurant.id,
          })),
        );
        return restaurant;
      });
    return command("createRestaurant", input);
  },
  async exportData() {
    return clone({
      exportedAt: new Date().toISOString(),
      mode: state.mode,
      profile: state.profile,
      requests: state.user
        ? state.requests.filter((r) => r.userId === state.user.id)
        : [],
      meals: state.meals,
      favorites: state.favorites,
    });
  },
  async deleteMyData() {
    if (state.mode === "guest") {
      await editDevice((next) => {
        next.favoriteKeys = [];
        next.meals = [];
      });
      await api.previewProfile(defaultProfile);
      return;
    }
    requireUser();
    if (state.mode === "demo")
      return editDemo((next) => {
        next.profile = { ...clone(defaultProfile), id: next.user.id };
        next.requests = [];
        next.meals = [];
        next.favorites = [];
      });
    await command("deleteMyData");
  },
};
