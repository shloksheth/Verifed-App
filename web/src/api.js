import { createClient } from "@supabase/supabase-js";
import { restaurants, dishes, defaultProfile } from "./data.js";
import { makeDemoState, makeRequest, transitionRequest } from "./domain.js";
import { supabaseUrl, supabasePublishableKey } from "./config.js";
import { finishCommittedWrite } from "./write-sync.js";

const DEMO_KEY = "verifed-demo-v1";
const MODE_KEY = "verifed-mode";
const client =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null;
const clone = (value) => structuredClone(value);
const listeners = new Set();
const empty = () => ({
  ready: false,
  mode: "guest",
  user: null,
  profile: clone(defaultProfile),
  restaurants: clone(restaurants),
  dishes: clone(dishes),
  requests: [],
  meals: [],
  favorites: [],
  memberships: [],
  connection: "idle",
  error: null,
  passwordRecovery: false,
});
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
function loadDemo() {
  const stored = localStorage.getItem(DEMO_KEY);
  if (!stored) return makeDemoState();
  try {
    const saved = JSON.parse(stored);
    if (
      saved.mode === "demo" &&
      Array.isArray(saved.requests) &&
      Array.isArray(saved.dishes)
    )
      return saved;
  } catch {
    /* A damaged demo can be safely reset without touching cloud data. */
  }
  return makeDemoState();
}

// Web Locks serializes tabs on the same origin. Without it, each tab remains a local demo,
// while cloud writes always use database locks and cannot rely on browser synchronization.
async function editDemo(change) {
  const run = () => {
    const next = clone(loadDemo());
    const value = change(next);
    localStorage.setItem(DEMO_KEY, JSON.stringify(next));
    publish({ ...next, connection: "local", error: null });
    return value;
  };
  return navigator.locks
    ? navigator.locks.request("verifed-demo-write", run)
    : run();
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
  publish({
    ...empty(),
    ready: true,
    mode: user ? "cloud" : "guest",
    user,
    profile: profile || {
      ...clone(defaultProfile),
      id: user?.id,
      name: user?.user_metadata?.name || "",
    },
    restaurants: catalog.map((row) => ({ ...row.details, ...row })),
    dishes: menu.map((row) => row.body),
    requests: (requests || [])
      .map((row) => row.body)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    meals: (meals || [])
      .map((row) => ({ ...row.body, id: row.id }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    favorites: (favorites || []).map((row) => row.dish_id),
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
  const value = result(
    await requireCloud().rpc("verifed_command", {
      p_action: action,
      p_payload: payload,
    }),
  );
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
  return synchronizeWrite(value);
}

function synchronizeWrite(value) {
  return finishCommittedWrite(value, refresh, (message) =>
    publish({ ...state, connection: "error", error: message }),
  );
}

export const api = {
  getState: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async init() {
    if (initialized) return;
    initialized = true;
    if (localStorage.getItem(MODE_KEY) === "demo")
      publish({ ...loadDemo(), connection: "local", error: null });
    if (client) {
      client.auth.onAuthStateChange((event) => {
        // Defer Supabase calls until the auth callback has released its session lock.
        if (event === "PASSWORD_RECOVERY") {
          generation++;
          localStorage.removeItem(MODE_KEY);
          publish({ ...empty(), passwordRecovery: true });
        }
        if (state.mode !== "demo")
          setTimeout(() => refresh().catch(() => {}), 0);
      });
      setInterval(() => {
        if (state.mode === "cloud" && document.visibilityState === "visible")
          refresh().catch(() => {});
      }, 15000);
    }
    window.addEventListener("storage", (event) => {
      if (event.key === DEMO_KEY && state.mode === "demo")
        publish({ ...loadDemo(), connection: "local", error: null });
    });
    if (state.mode !== "demo") {
      if (client) await refresh();
      else publish({ ...state, ready: true, connection: "unconfigured" });
    }
  },
  refresh,
  async enterDemo() {
    generation++;
    localStorage.setItem(MODE_KEY, "demo");
    const next = loadDemo();
    localStorage.setItem(DEMO_KEY, JSON.stringify(next));
    publish({ ...next, connection: "local", error: null });
  },
  async resetDemo() {
    generation++;
    const next = makeDemoState();
    localStorage.setItem(MODE_KEY, "demo");
    localStorage.setItem(DEMO_KEY, JSON.stringify(next));
    publish({ ...next, connection: "local", error: null });
  },
  async signIn(email, password) {
    result(
      await requireCloud().auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
    );
    generation++;
    localStorage.removeItem(MODE_KEY);
    publish({ ...empty(), ready: true });
    await refresh();
  },
  async signInWithGoogle() {
    // The provider returns to this same app; Supabase owns the token exchange.
    generation++;
    localStorage.removeItem(MODE_KEY);
    result(
      await requireCloud().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/",
          queryParams: { prompt: "select_account" },
        },
      }),
    );
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
          emailRedirectTo: window.location.origin,
        },
      }),
    );
    if (data.session) {
      generation++;
      localStorage.removeItem(MODE_KEY);
      publish({ ...empty(), ready: true });
      await refresh();
    }
    return { verificationRequired: !data.session };
  },
  async resetPassword(email) {
    result(
      await requireCloud().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/#/reset-password",
      }),
    );
  },
  async updatePassword(password) {
    if (password.length < 8) throw new Error("Use at least 8 characters.");
    result(await requireCloud().auth.updateUser({ password }));
    publish({ ...state, passwordRecovery: false });
  },
  async signOut() {
    if (client) result(await client.auth.signOut());
    generation++;
    localStorage.removeItem(MODE_KEY);
    publish({ ...empty(), ready: true });
    if (client) await refresh();
  },
  async saveProfile(profile) {
    requireUser();
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
    publish({ ...state, profile: clean });
    return synchronizeWrite(clean);
  },
  async createRequest(input) {
    requireUser();
    if (state.mode === "demo")
      return editDemo((next) => {
        const dish = next.dishes.find((d) => d.id === input.dishId);
        if (!dish) throw new Error("Dish not found.");
        if (
          !next.restaurants.find((r) => r.id === dish.restaurantId)?.confirmed
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
    requireUser();
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
    if (state.mode === "demo")
      return editDemo((next) => {
        const saved = { ...body, id: existing?.id || crypto.randomUUID() };
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
    publish({
      ...state,
      meals: existing
        ? state.meals.map((item) => (item.id === value.id ? value : item))
        : [value, ...state.meals],
    });
    return synchronizeWrite(value);
  },
  async toggleFavorite(dishId) {
    requireUser();
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
    publish({
      ...state,
      favorites: state.favorites.includes(dishId)
        ? state.favorites.filter((id) => id !== dishId)
        : [...state.favorites, dishId],
    });
    return synchronizeWrite();
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
          id: crypto.randomUUID(),
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
          id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
            restaurantId: restaurant.id,
          })),
        );
        return restaurant;
      });
    return command("createRestaurant", input);
  },
  async exportData() {
    requireUser();
    return clone({
      exportedAt: new Date().toISOString(),
      mode: state.mode,
      profile: state.profile,
      requests: state.requests.filter((r) => r.userId === state.user.id),
      meals: state.meals,
      favorites: state.favorites,
    });
  },
  async deleteMyData() {
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
