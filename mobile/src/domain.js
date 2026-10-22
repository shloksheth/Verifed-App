import { restaurants, dishes, defaultProfile } from "./data.js";
import { restrictionHasConflict, supportsRestriction } from "./menu-filter.js";

import { newId as id, copy } from "./model-utils.js";
const now = () => new Date().toISOString();
const closed = (request) =>
  ["completed", "cancelled", "declined"].includes(request.status);
const lower = (value) => String(value).toLowerCase();

function validatePayload(payload) {
  for (const key of [
    "ingredients",
    "allergens",
    "allergies",
    "restrictions",
    "modifications",
  ]) {
    if (
      key in payload &&
      (!Array.isArray(payload[key]) ||
        payload[key].length > 30 ||
        payload[key].some(
          (value) =>
            typeof value !== "string" || value.length < 1 || value.length > 100,
        ))
    )
      throw new Error(`Invalid list: ${key}`);
  }
  for (const key of [
    "question",
    "preparation",
    "message",
    "reason",
    "decision",
    "dishName",
  ]) {
    if (
      key in payload &&
      (typeof payload[key] !== "string" || payload[key].length > 2000)
    )
      throw new Error(`Invalid text: ${key}`);
  }
}

export function assessDish(dish, profile = defaultProfile, meals = []) {
  const conflicts = (profile.allergies || []).filter((allergen) =>
    dish.allergens.some((item) => lower(item) === lower(allergen)),
  );
  const hints = dish.ingredientHints || {};
  const ingredientFlags = (profile.allergies || []).filter(
    (allergen) =>
      [...(hints.allergens || []), ...(hints.possibleAllergens || [])].some(
        (item) => lower(item) === lower(allergen),
      ) && !conflicts.includes(allergen),
  );
  const dietaryFlags = (profile.restrictions || []).filter((restriction) =>
    restrictionHasConflict(dish, restriction),
  );
  const missingRestrictions = (profile.restrictions || []).filter(
    (tag) => !supportsRestriction(dish, tag),
  );
  const tasteReasons = (profile.likes || []).filter((tag) =>
    dish.tags.some((item) => lower(item) === lower(tag)),
  );
  const avoids = (profile.dislikes || []).filter((tag) =>
    dish.tags.some((item) => lower(item) === lower(tag)),
  );
  // A rating teaches a small preference for that meal's tags, never an allergy judgment.
  let learnedScore = 0;
  const learnedReasons = [];
  for (const tag of dish.tags) {
    if (
      (profile.dislikes || []).some((dislike) => lower(dislike) === lower(tag))
    )
      continue;
    const ratings = meals.filter((meal) =>
      (meal.tags || []).some((item) => lower(item) === lower(tag)),
    );
    if (!ratings.length) continue;
    const average =
      ratings.reduce((total, meal) => total + Number(meal.rating), 0) /
      ratings.length;
    learnedScore += (average - 3) / 2;
    if (average >= 4)
      learnedReasons.push(`You rated ${lower(tag)} meals highly`);
  }
  const reasons = [
    ...conflicts.map((item) => `Listed allergen: ${item}`),
    ...ingredientFlags.map((item) => `Ingredient clue to check: ${item}`),
    ...dietaryFlags.map(
      (item) => `Named ingredients may conflict with ${item}`,
    ),
    ...missingRestrictions.map(
      (item) => `${item} suitability needs clarification`,
    ),
  ];
  const source = dish.provenance;
  const uncovered = source
    ? (profile.allergies || []).filter(
        (allergen) =>
          !source.coverage?.some((item) => lower(item) === lower(allergen)) &&
          !conflicts.includes(allergen),
      )
    : [];
  if (uncovered.length)
    reasons.push(`Source does not cover: ${uncovered.join(", ")}`);
  if (source?.kind === "component")
    reasons.push("This record covers one component, not your complete order");
  if (!dish.informationComplete) reasons.push("Menu details are unconfirmed");
  return {
    level:
      conflicts.length || ingredientFlags.length || dietaryFlags.length
        ? "conflict"
        : source || !dish.informationComplete || missingRestrictions.length
          ? "unknown"
          : "review",
    conflicts: [
      ...new Set([...conflicts, ...ingredientFlags, ...dietaryFlags]),
    ],
    reasons,
    tasteScore:
      tasteReasons.length * 2 +
      Math.max(-3, Math.min(3, learnedScore)) -
      avoids.length * 10,
    tasteReasons,
    learnedReasons,
  };
}

export function rankDishes(menu, profile, meals = []) {
  const order = { review: 0, unknown: 1, conflict: 2 };
  return [...menu].sort((a, b) => {
    const left = assessDish(a, profile, meals),
      right = assessDish(b, profile, meals);
    return (
      order[left.level] - order[right.level] ||
      right.tasteScore - left.tasteScore
    );
  });
}

export function makeRequest(dish, input, userId) {
  validatePayload(input);
  const at = now();
  const snapshot = {
    dishName: dish.name,
    ingredients: copy(dish.ingredients),
    allergens: copy(dish.allergens),
    preparation: dish.preparation,
    dishRevision: dish.revision,
    allergies: input.allergies || [],
    restrictions: input.restrictions || [],
    modifications: input.modifications || [],
    question: String(input.question || "").trim(),
  };
  return {
    id: id(),
    userId,
    restaurantId: dish.restaurantId,
    dishId: dish.id,
    dishName: dish.name,
    revision: 1,
    status: "submitted",
    snapshot: copy(snapshot),
    response: null,
    acknowledgedResponseId: null,
    createdAt: at,
    updatedAt: at,
    events: [
      {
        id: id(),
        type: "submitted",
        revision: 1,
        actor: "diner",
        message: "Request sent to kitchen",
        at,
        snapshot: copy(snapshot),
      },
    ],
  };
}

// Work on a copy: an old screen must never mutate the current request or its earlier snapshots.
export function transitionRequest(
  request,
  action,
  payload = {},
  actor = "diner",
  expectedRevision = request.revision,
) {
  validatePayload(payload);
  if (request.revision !== expectedRevision)
    throw new Error("This request changed. Refresh it before continuing.");
  if (closed(request))
    throw new Error("This request is closed. Start a new request.");
  const next = copy(request),
    at = now();
  const staff = ["respond", "change"].includes(action);
  if ((staff ? "staff" : "diner") !== actor)
    throw new Error("You do not have permission for this action.");
  let message = "";
  if (action === "respond") {
    if (
      !["accommodate", "clarify", "decline"].includes(payload.decision) ||
      !String(payload.message || "").trim()
    )
      throw new Error("Choose a response and explain the preparation details.");
    if (request.status === "acknowledged")
      throw new Error(
        "Record a change before replacing an acknowledged response.",
      );
    next.response = {
      id: id(),
      revision: next.revision,
      decision: payload.decision,
      message: payload.message.trim(),
      createdAt: at,
    };
    next.acknowledgedResponseId = null;
    next.status = {
      accommodate: "responded",
      clarify: "clarification",
      decline: "declined",
    }[payload.decision];
    message = next.response.message;
  } else if (action === "acknowledge") {
    if (
      next.status !== "responded" ||
      next.response?.decision !== "accommodate" ||
      next.response.revision !== next.revision ||
      payload.responseId !== next.response.id
    )
      throw new Error("This response is outdated or not ready to acknowledge.");
    next.acknowledgedResponseId = next.response.id;
    next.status = "acknowledged";
    message = "Diner read the current kitchen response";
  } else if (action === "change" || action === "resubmit") {
    if (action === "change" && !String(payload.reason || "").trim())
      throw new Error("Explain what changed.");
    const fields =
      action === "change"
        ? [
            "ingredients",
            "allergens",
            "preparation",
            "dishRevision",
            "dishName",
          ]
        : ["allergies", "restrictions", "modifications", "question"];
    for (const key of fields)
      if (payload[key] !== undefined) next.snapshot[key] = copy(payload[key]);
    next.dishName = next.snapshot.dishName;
    next.revision += 1;
    next.response = null;
    next.acknowledgedResponseId = null;
    next.status = action === "change" ? "review_required" : "submitted";
    message =
      action === "change" ? payload.reason : "Diner updated their request";
  } else if (action === "cancel") {
    next.status = "cancelled";
    message = "Diner cancelled this request";
  } else if (action === "complete") {
    if (
      next.status !== "acknowledged" ||
      next.response?.id !== next.acknowledgedResponseId ||
      next.response?.revision !== next.revision
    )
      throw new Error("Read and acknowledge the current response first.");
    next.status = "completed";
    message = "Diner finished this request";
  } else throw new Error("Unknown request action.");
  next.updatedAt = at;
  next.events.push({
    id: id(),
    type: action,
    revision: next.revision,
    actor,
    message,
    at,
    snapshot: copy(next.snapshot),
    response: copy(next.response),
  });
  return next;
}

export function makeDemoState() {
  const profile = {
    ...copy(defaultProfile),
    id: "demo-diner",
    name: "Alex",
    allergies: ["Milk"],
    likes: ["Fresh", "Citrus"],
  };
  const request = makeRequest(
    dishes[0],
    {
      allergies: profile.allergies,
      question:
        "Could you use separate utensils and confirm the dressing ingredients?",
    },
    profile.id,
  );
  return {
    ready: true,
    mode: "demo",
    user: { id: profile.id, email: "Demo on this device" },
    profile,
    restaurants: copy(restaurants),
    dishes: copy(dishes),
    requests: [request],
    meals: [
      {
        id: id(),
        dishId: dishes[0].id,
        restaurantId: restaurants[0].id,
        dishName: dishes[0].name,
        restaurantName: restaurants[0].name,
        rating: 5,
        notes: "Loved the bright citrus flavor.",
        tags: ["Fresh", "Citrus"],
        createdAt: now(),
      },
    ],
    favorites: [dishes[0].id],
    memberships: [{ restaurantId: restaurants[0].id, role: "owner" }],
  };
}
