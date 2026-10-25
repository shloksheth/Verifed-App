// Home is a small editorial collection, not an allergy-safety ranking.
export const homeRestaurantSlugs = ["hawkers-orlando", "chipotle-south-orange"];

export function homeRestaurants(restaurants = []) {
  return homeRestaurantSlugs
    .map((slug) =>
      restaurants.find(
        (place) => place.slug === slug && place.fictional === false,
      ),
    )
    .filter(Boolean);
}

export function homeNeeds(profile = {}) {
  const restrictions = Array.isArray(profile.restrictions)
    ? profile.restrictions
    : [];
  const allergies = Array.isArray(profile.allergies) ? profile.allergies : [];
  return [
    ...[...new Set(restrictions)].map((value) => ({
      key: `restriction:${value}`,
      label: value,
      icon: "leaf-outline",
    })),
    ...[...new Set(allergies)].map((value) => ({
      key: `allergy:${value}`,
      label: `${value === "Peanuts" ? "Peanut" : value === "Tree nuts" ? "Tree nut" : value} allergy`,
      icon: "alert-circle-outline",
    })),
  ];
}

export function homeCuisine(cuisines, requested) {
  return (
    cuisines.find(
      (cuisine) =>
        cuisine.toLowerCase() === String(requested || "").toLowerCase(),
    ) || null
  );
}
