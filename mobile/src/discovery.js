import { ALLERGENS } from "./data.js";
import { dietaryMenuStatus } from "./menu-filter.js";

const list = (value) => (Array.isArray(value) ? value : []);
const text = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
const has = (values, value) =>
  list(values).some((item) => text(item) === text(value));

function point(value) {
  if (
    !value ||
    value.latitude === null ||
    value.longitude === null ||
    value.latitude === "" ||
    value.longitude === ""
  )
    return null;
  const latitude = Number(value.latitude),
    longitude = Number(value.longitude);
  return Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}

export const validCoordinates = (value) => point(value) !== null;

// Straight-line distance from the chosen search center, not a driving route.
export function distanceMilesBetween(from, to) {
  const start = point(from),
    end = point(to);
  if (!start || !end) return null;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const lat = radians(end.latitude - start.latitude);
  const lon = radians(end.longitude - start.longitude);
  const a =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(start.latitude)) *
      Math.cos(radians(end.latitude)) *
      Math.sin(lon / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

function normalizedProfile(profile) {
  return {
    allergies: list(profile?.allergies).filter(
      (value) => typeof value === "string",
    ),
    restrictions: list(profile?.restrictions).filter(
      (value) => typeof value === "string",
    ),
    likes: list(profile?.likes),
    dislikes: list(profile?.dislikes),
  };
}

function explicitAbsence(dish, allergies, restrictions) {
  if (!allergies.length) return false;
  // Coverage and an empty positive list never establish absence. Calling the
  // shared rule also rejects a contradictory declaration or ingredient flag.
  return (
    allergies.every((allergen) =>
      has(dish.provenance?.freeFromAllergens, allergen),
    ) && dietaryMenuStatus(dish, { allergies, restrictions }).level === "match"
  );
}

function historySignals(restaurants, meals) {
  const byRestaurant = new Map(),
    byCuisine = new Map(),
    byTag = new Map();
  const append = (map, key, rating) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(rating);
  };
  for (const meal of meals) {
    const rating = Number(meal?.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue;
    const linked =
      meal.restaurantId &&
      restaurants.find((place) => place.id === meal.restaurantId);
    const named = text(meal.restaurantName)
      ? restaurants.filter(
          (place) => text(place.name) === text(meal.restaurantName),
        )
      : [];
    // A typed chain name shared by several branches is not proof of a visit
    // to whichever branch happens to be first in the catalog.
    const restaurant = linked || (named.length === 1 ? named[0] : null);
    if (restaurant) {
      append(byRestaurant, restaurant.id, rating);
      append(byCuisine, text(restaurant.cuisine), rating);
    }
    // Custom journal entries can still teach a tag preference. They cannot
    // manufacture a venue or cuisine association that the catalog lacks.
    for (const tag of new Set(list(meal.tags).map(text)))
      append(byTag, tag, rating);
  }
  const averages = (map) =>
    new Map(
      [...map].map(([key, values]) => [
        key,
        values.reduce((sum, rating) => sum + rating, 0) / values.length,
      ]),
    );
  return {
    venue: averages(byRestaurant),
    cuisine: averages(byCuisine),
    tags: averages(byTag),
  };
}

function recommendation(result, profile, signals, needsSelected) {
  const reasons = [];
  const candidates = result.eligibleDishes;
  let score = 0;
  if (needsSelected && result.supportedCount) {
    score +=
      (50 * result.supportedCount) / Math.max(1, result.menuCount) +
      Math.min(20, result.supportedCount * 2);
    reasons.push(
      `${result.supportedCount} menu ${result.supportedCount === 1 ? "item explicitly supports" : "items explicitly support"} your selected needs`,
    );
  } else if (needsSelected && result.possibleCount) {
    reasons.push(
      `${result.possibleCount} possible ${result.possibleCount === 1 ? "option" : "options"}; ingredients need confirmation`,
    );
  } else if (needsSelected && result.conflictCount) {
    reasons.push(
      "Available menu items have dietary flags for your selected needs",
    );
  }

  // Personal taste can reorder suitable candidates. It never lifts an
  // all-conflict restaurant above places with usable dietary options.
  if (candidates.length) {
    const venueRating = signals.venue.get(result.restaurant.id);
    const cuisineRating = signals.cuisine.get(text(result.restaurant.cuisine));
    if (venueRating >= 4) {
      score += 12;
      reasons.push(`Your meals here average ${venueRating.toFixed(1)}/5`);
    } else if (cuisineRating >= 4) {
      score += 8;
      reasons.push(`You rated ${result.restaurant.cuisine} meals highly`);
    }
    const tags = new Set(
      candidates.flatMap((dish) => list(dish.tags)).map(text),
    );
    const learned = [...tags].filter(
      (tag) => signals.tags.get(tag) >= 4 && !has(profile.dislikes, tag),
    );
    if (learned.length) {
      score += Math.min(6, learned.length * 2);
      reasons.push(
        `Similar to your highly rated ${learned.slice(0, 2).join(" / ")} meals`,
      );
    }
    const liked = [...tags].filter(
      (tag) => has(profile.likes, tag) && !has(profile.dislikes, tag),
    );
    score += Math.min(4, liked.length);
    if (liked.length)
      reasons.push(
        `Includes your ${liked.slice(0, 2).join(" / ")} preferences`,
      );
    const disliked = [...tags].filter((tag) => has(profile.dislikes, tag));
    score -= Math.min(6, disliked.length * 2);
  }
  if (result.distanceMiles !== null) {
    score += Math.max(0, 5 - result.distanceMiles / 5);
    reasons.push(
      `${result.distanceMiles < 0.1 ? "Less than 0.1" : result.distanceMiles.toFixed(1)} miles from your search center`,
    );
  }
  if (!reasons.length) reasons.push("Explore this published local menu");
  return { score, reasons };
}

export function discoverRestaurants({
  restaurants = [],
  dishes = [],
  profile = {},
  meals = [],
  center = null,
  radiusMiles = 25,
  cuisine = "All",
  dietMode = "all",
  sort = "recommended",
  query = "",
} = {}) {
  const places = list(restaurants).filter(
    (restaurant) => restaurant?.fictional === false,
  );
  const needs = normalizedProfile(profile);
  const selected = !!(needs.allergies.length || needs.restrictions.length);
  if (["options", "reported"].includes(dietMode) && !selected) return [];
  if (dietMode === "selected-free" && !needs.allergies.length) return [];
  const searchCenter = point(center);
  const radius =
    Number.isFinite(Number(radiusMiles)) && Number(radiusMiles) >= 0
      ? Number(radiusMiles)
      : 25;
  const search = text(query);
  const signals = historySignals(places, list(meals));
  const results = [];
  for (const restaurant of places) {
    if (text(cuisine) !== "all" && text(restaurant.cuisine) !== text(cuisine))
      continue;
    const menu = list(dishes).filter(
      (dish) => dish?.restaurantId === restaurant.id,
    );
    const searchText = [
      restaurant.name,
      restaurant.location,
      restaurant.address,
      restaurant.cuisine,
      ...menu.flatMap((dish) => [
        dish.name,
        dish.description,
        ...list(dish.tags),
      ]),
    ]
      .map(text)
      .join(" ");
    if (search && !searchText.includes(search)) continue;
    const distanceMiles = distanceMilesBetween(
      searchCenter,
      restaurant.coordinates,
    );
    if (searchCenter && (distanceMiles === null || distanceMiles > radius))
      continue;
    const assessed = menu.map((dish) => ({
      dish,
      status: dietaryMenuStatus(dish, needs),
    }));
    const supportedCount = assessed.filter(
      ({ status }) => status.level === "match",
    ).length;
    const possibleCount = assessed.filter(
      ({ status }) => status.level === "unknown",
    ).length;
    const conflictCount = assessed.filter(
      ({ status }) => status.level === "conflict",
    ).length;
    const selectedFreeCount = menu.filter((dish) =>
      explicitAbsence(dish, needs.allergies, needs.restrictions),
    ).length;
    const allNineCount = menu.filter((dish) =>
      explicitAbsence(dish, ALLERGENS, needs.restrictions),
    ).length;
    if (dietMode === "options" && !supportedCount && !possibleCount) continue;
    if (dietMode === "reported" && !supportedCount) continue;
    if (dietMode === "selected-free" && !selectedFreeCount) continue;
    if (dietMode === "all-nine" && !allNineCount) continue;
    const eligibleDishes = assessed
      .filter(({ status }) => status.level !== "conflict")
      .map(({ dish }) => dish);
    const dietaryTier = selected
      ? supportedCount
        ? 0
        : possibleCount
          ? 1
          : 2
      : menu.length
        ? 0
        : 2;
    const result = {
      restaurant,
      menuCount: menu.length,
      supportedCount,
      possibleCount,
      conflictCount,
      selectedFreeCount,
      allNineCount,
      distanceMiles,
      dietaryTier,
      eligibleDishes,
      sourceReviewedAt: restaurant.source?.reviewedAt || null,
    };
    const ranked = recommendation(result, needs, signals, selected);
    delete result.eligibleDishes;
    results.push({ ...result, ...ranked });
  }
  const nearFirst = (a, b) =>
    (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
  return results.sort((a, b) => {
    const nameOrder = text(a.restaurant.name).localeCompare(
      text(b.restaurant.name),
    );
    if (sort === "name") return nameOrder;
    if (sort === "nearest") return nearFirst(a, b) || nameOrder;
    if (sort === "dietary")
      return (
        a.dietaryTier - b.dietaryTier ||
        b.supportedCount - a.supportedCount ||
        b.possibleCount - a.possibleCount ||
        nearFirst(a, b) ||
        nameOrder
      );
    return (
      a.dietaryTier - b.dietaryTier ||
      b.score - a.score ||
      nearFirst(a, b) ||
      nameOrder
    );
  });
}
