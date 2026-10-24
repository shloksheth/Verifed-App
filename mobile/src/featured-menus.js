// A small, complete photo collection for the CAC demonstration. The wider
// catalog stays available, with its existing ingredient/source limitations.
export const primaryDemoMenuSlugs = [
  "fresh-kitchen-waterford",
  "chipotle-south-orange",
  "loving-hut-orlando",
];

export const featuredMenuSlugs = [
  ...primaryDemoMenuSlugs,
  "taco-bell-south-orange",
  "hawkers-orlando",
];

// Each banner is a menu example already reviewed as an item photo. This keeps
// the demonstration's food imagery local, including the Home cards.
export const featuredMenuCoverKeys = {
  "fresh-kitchen-waterford": "fresh-kitchen-waterford-6-bowl",
  "chipotle-south-orange": "chipotle-south-orange-guacamole",
  "loving-hut-orlando": "loving-hut-orlando-spring-rolls-4-rolls-cha-gio",
  "taco-bell-south-orange": "taco-bell-south-orange-cantina-chicken-bowl",
  "taco-bell-east-colonial": "taco-bell-south-orange-cantina-chicken-bowl",
  "taco-bell-orlando-west": "taco-bell-south-orange-cantina-chicken-bowl",
  "hawkers-orlando": "hawkers-orlando-roti-canai",
};

export function featuredRestaurants(restaurants) {
  return featuredMenuSlugs
    .map((slug) => restaurants.find((restaurant) => restaurant.slug === slug))
    .filter(Boolean);
}
