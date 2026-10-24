// A small, complete photo collection for the CAC demonstration. The wider
// catalog stays available, with its existing ingredient/source limitations.
export const featuredMenuSlugs = [
  "fresh-kitchen-waterford",
  "hawkers-orlando",
  "taco-bell-south-orange",
];

export function featuredRestaurants(restaurants) {
  return featuredMenuSlugs
    .map((slug) => restaurants.find((restaurant) => restaurant.slug === slug))
    .filter(Boolean);
}
