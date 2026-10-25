// A small, complete photo collection for the CAC demonstration. The wider
// catalog stays available, with its existing ingredient/source limitations.
export const primaryDemoMenuSlugs = [
  "fresh-kitchen-waterford",
  "chipotle-south-orange",
  "loving-hut-orlando",
];

// User-approved CAC discovery order. Only these menus have full approved image
// coverage. Preserve this order after discovery filters and chain grouping.
export const featuredMenuSlugs = [
  "taco-bell-south-orange",
  "loving-hut-orlando",
  "hawkers-orlando",
  "fresh-kitchen-waterford",
  "chipotle-south-orange",
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

// Explore groups chain locations into one card. Rank the whole group so Taco
// Bell stays featured even when another branch is the displayed location.
export function prioritizeFeaturedMenus(cards) {
  const rank = ({ group }) => {
    let first = featuredMenuSlugs.length;
    for (const { restaurant } of group) {
      const index = featuredMenuSlugs.findIndex((slug) =>
        slug === restaurant.slug ||
        (restaurant.chainId && slug.startsWith(`${restaurant.chainId}-`)),
      );
      if (index >= 0) first = Math.min(first, index);
    }
    return first;
  };
  return [...cards].sort((a, b) => rank(a) - rank(b));
}
