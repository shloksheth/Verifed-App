import { publishedMenus } from "./restaurant-menus.js";
import { ingredientHints } from "./ingredient-hints.js";

import { catalogLocations } from "./restaurant-locations.js";

// Location facts and menu facts have separate sources. Join them by stable slug,
// then let database UUIDs replace the offline IDs when a live copy is available.
const reviewedAt = "2026-10-21";
export const localRestaurants = catalogLocations.map((restaurant) => {
  const menu = publishedMenus.find((item) => item.key === restaurant.slug);
  return {
    ...restaurant,
    description:
      restaurant.description ||
      "Explore the published food menu and its reported dietary information.",
    menuCoverage: menu.menuCoverage,
    availabilityVerified: false,
    source: { ...restaurant.source, note: menu.sourceCaveats },
  };
});

// Convert reviewed source records into the app's shared dish contract.
export const localDishes = publishedMenus.flatMap((menu) =>
  menu.items.map((item) => ({
    id: menu.key + "-" + item.key,
    catalogKey: menu.key + "-" + item.key,
    restaurantId: menu.key,
    name: item.name,
    category: item.category,
    description:
      item.description ||
      (item.kind === "component"
        ? "One component; review the complete order."
        : ""),
    price: null,
    emoji: "",
    revision: 1,
    ingredients: item.ingredients || [],
    allergens: item.allergens || [],
    otherDeclaredAllergens: item.otherDeclaredAllergens || [],
    ingredientHints: ingredientHints(item),
    tags: item.tags || [],
    modifications: [],
    informationComplete: false,
    preparation:
      menu.sourceCaveats +
      " Confirm this location’s preparation and cross-contact with staff.",
    provenance: {
      menuUrl: item.menuUrl || menu.menuUrl,
      allergenUrl: item.allergenUrl || menu.allergenUrl,
      reviewedAt: item.reviewedAt || reviewedAt,
      scope:
        item.scope ||
        menu.scope ||
        catalogLocations.find((location) => location.slug === menu.key)?.source
          ?.scope ||
        "location",
      kind: item.kind,
      coverage: item.coverage || menu.allergenCoverage || [],
      freeFromAllergens: item.freeFromAllergens || [],
      freeFromClaims: item.freeFromClaims || [],
      evidenceNote: item.evidenceNote,
      guideRow: item.guideRow || item.pdfName || null,
      pdfPage: item.pdfPage || null,
    },
  })),
);

export function mergeLocalCatalog(
  restaurants = [],
  dishes = [],
  { preferBundled = false } = {},
) {
  const flat = restaurants.map(({ details, ...row }) => ({
    ...details,
    ...row,
  }));
  const mergedRestaurants = localRestaurants.map((local) => {
    const live = flat.find((row) => row.slug === local.slug);
    if (live && preferBundled) return { ...local, id: live.id };
    return live || { ...local };
  });
  mergedRestaurants.push(
    ...flat.filter(
      (row) => !localRestaurants.some((local) => local.slug === row.slug),
    ),
  );
  const mergedDishes = localDishes.map((local) => {
    const live = dishes.find((dish) => dish.catalogKey === local.catalogKey);
    const restaurant = mergedRestaurants.find(
      (row) => row.slug === local.restaurantId,
    );
    if (live && !preferBundled)
      return {
        ...live,
        ingredientHints: ingredientHints(live),
        cloudBacked: true,
      };
    // Device-saved demo facts are a cache, not a source. Refresh them from this
    // release while keeping stable IDs for favorites and historical references.
    return {
      ...local,
      id: live?.id || local.id,
      restaurantId: restaurant.id,
      cloudBacked: false,
    };
  });
  mergedDishes.push(
    ...dishes.filter(
      (dish) =>
        !localDishes.some((local) => local.catalogKey === dish.catalogKey),
    ),
  );
  return { restaurants: mergedRestaurants, dishes: mergedDishes };
}
