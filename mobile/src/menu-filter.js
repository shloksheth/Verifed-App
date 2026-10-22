const same = (left, right) => String(left).toLowerCase() === String(right).toLowerCase();
const includes = (values, value) => (values || []).some((item) => same(item, value));

// A dietary-menu match means the restaurant explicitly supports each selected
// requirement. It is separate from the meal assessment and cannot certify food.
export function dietaryMenuStatus(dish, profile = {}) {
  const allergies = profile.allergies || [];
  const restrictions = profile.restrictions || [];
  if (!allergies.length && !restrictions.length)
    return { level: "unset", missing: [], conflicts: [] };

  const conflicts = allergies.filter((allergen) => includes(dish.allergens, allergen));
  const claims = dish.provenance?.freeFromAllergens || [];
  const missing = [
    ...allergies.filter((allergen) => !includes(claims, allergen) && !includes(conflicts, allergen)),
    ...restrictions.filter((restriction) => !includes(dish.tags, restriction)),
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
