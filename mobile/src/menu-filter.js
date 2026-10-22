const same = (left, right) =>
  String(left).toLowerCase() === String(right).toLowerCase();
const includes = (values, value) =>
  (values || []).some((item) => same(item, value));
export const supportsRestriction = (dish, restriction) =>
  includes(dish.tags, restriction) ||
  (["Vegetarian", "Vegetarian (no eggs)"].some((value) =>
    same(restriction, value),
  ) &&
    includes(dish.tags, "Vegan")) ||
  (same(restriction, "Vegetarian (no eggs)") &&
    includes(dish.tags, "Vegetarian") &&
    includes(dish.provenance?.freeFromAllergens, "Egg"));

export function restrictionHasConflict(dish, restriction) {
  const hints = dish.ingredientHints || {};
  if (includes(hints.restrictionConflicts, restriction)) return true;
  if (same(restriction, "Vegetarian (no eggs)")) {
    return (
      includes(hints.restrictionConflicts, "Vegetarian") ||
      [
        ...(dish.allergens || []),
        ...(hints.allergens || []),
        ...(hints.possibleAllergens || []),
      ].some((value) =>
        ["Egg", "Fish", "Shellfish"].some((animal) => same(value, animal)),
      )
    );
  }
  return false;
}

// A dietary-menu match means the restaurant explicitly supports each selected
// requirement. It is separate from the meal assessment and cannot certify food.
export function dietaryMenuStatus(dish, profile = {}) {
  const allergies = profile.allergies || [];
  const restrictions = profile.restrictions || [];
  if (!allergies.length && !restrictions.length)
    return { level: "unset", missing: [], conflicts: [] };

  const hints = dish.ingredientHints || {};
  const conflicts = [
    ...allergies.filter((allergen) => includes(dish.allergens, allergen)),
    ...allergies.filter(
      (allergen) =>
        includes(hints.allergens, allergen) ||
        includes(hints.possibleAllergens, allergen),
    ),
    ...restrictions.filter((restriction) =>
      restrictionHasConflict(dish, restriction),
    ),
  ].filter((value, index, values) => values.indexOf(value) === index);
  const claims = dish.provenance?.freeFromAllergens || [];
  const missing = [
    ...allergies.filter(
      (allergen) =>
        !includes(claims, allergen) && !includes(conflicts, allergen),
    ),
    ...restrictions.filter(
      (restriction) => !supportsRestriction(dish, restriction),
    ),
  ];
  return {
    level: conflicts.length ? "conflict" : missing.length ? "unknown" : "match",
    missing,
    conflicts,
  };
}

export function groupMenu(menu) {
  const groups = new Map();
  for (const dish of menu) {
    const name = dish.category || "Menu";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(dish);
  }
  return [...groups].map(([category, dishes]) => ({ category, dishes }));
}
