import { publishedMenus } from "./restaurant-menus.js";
import { verifiedDishPhotos } from "./verified-dish-photos.js";
import { ingredientHints } from "./ingredient-hints.js";

import { catalogLocations } from "./restaurant-locations.js";

// Location facts and menu facts have separate sources. Join them by stable slug,
// then let database UUIDs replace the offline IDs when a live copy is available.
const reviewedAt = "2026-10-21";
// Keep old source records for provenance and meal history, but retire this venue
// from every current browsing path, including copies returned by the database.
const retiredSlugs = new Set(["tako-cheena-mills"]);
const activeMenus = publishedMenus.filter((menu) => !retiredSlugs.has(menu.key));
export const localRestaurants = catalogLocations.filter((restaurant) => !retiredSlugs.has(restaurant.slug)).map((restaurant) => {
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
export const localDishes = activeMenus.flatMap((menu) =>
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
    // Product photos must match this item. Representative restaurant photos
    // are selected separately in menu-photos.js, never stored as dish evidence.
    imageUrl: item.imageUrl || verifiedDishPhotos[menu.key]?.[item.key]?.url || null,
    imageAlt: item.imageAlt || verifiedDishPhotos[menu.key]?.[item.key]?.alt || null,
    imageCredit: item.imageCredit || verifiedDishPhotos[menu.key]?.[item.key]?.credit || null,
    imageSourceUrl: item.imageSourceUrl ||
      verifiedDishPhotos[menu.key]?.[item.key]?.sourceUrl ||
      item.menuUrl || menu.menuUrl || null,
    imageKind: item.imageKind || verifiedDishPhotos[menu.key]?.[item.key]?.kind || "published",
    imageGenerated: Boolean(item.imageGenerated || verifiedDishPhotos[menu.key]?.[item.key]?.generated),
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
      ingredientUrl: item.ingredientSourceUrl || null,
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
  const retiredIds = new Set(restaurants.filter((row) => retiredSlugs.has(row.slug || row.details?.slug)).map((row) => row.id));
  const flat = restaurants.map(({ details, ...row }) => ({
    ...details,
    ...row,
  })).filter((row) => !retiredSlugs.has(row.slug));
  const mergedRestaurants = localRestaurants.map((local) => {
    const live = flat.find((row) => row.slug === local.slug);
    if (live && preferBundled) return { ...local, id: live.id };
    return live
      ? {
          ...local,
          ...live,
          imageUrl: local.imageUrl || live.imageUrl || null,
          imageAlt: local.imageAlt || live.imageAlt || null,
          imageCredit: local.imageCredit || live.imageCredit || null,
          imageKind: local.imageKind || live.imageKind || null,
        }
      : { ...local };
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
    if (live && !preferBundled) {
      // An older public row may have an empty ingredient list. Fill that gap
      // from reviewed bundled facts, while preserving nonempty cloud updates.
      const useLocalIngredients = !live.ingredients?.length && local.ingredients.length > 0;
      const mergedDish = {
        ...live,
        ...(useLocalIngredients ? { ingredients: local.ingredients } : {}),
        ...(useLocalIngredients && local.provenance.ingredientUrl ? {
          description: local.description,
          provenance: {
            ...live.provenance,
            ingredientUrl: local.provenance.ingredientUrl,
            evidenceNote: local.provenance.evidenceNote,
          },
        } : {}),
      };
      return {
        ...mergedDish,
        ingredientHints: ingredientHints(mergedDish),
        // Only reviewed source records can supply exact dish photos. Older
        // cloud rows might contain unverified or restaurant-wide images.
        imageUrl: local.imageUrl || null,
        imageAlt: local.imageAlt || null,
        imageCredit: local.imageCredit || null,
        imageSourceUrl: local.imageSourceUrl || null,
        imageKind: local.imageKind || "published",
        imageGenerated: Boolean(local.imageGenerated),
        cloudBacked: true,
      };
    }
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
        !retiredIds.has(dish.restaurantId) &&
        ![...retiredSlugs].some((slug) => dish.catalogKey?.startsWith(slug + "-")) &&
        !localDishes.some((local) => local.catalogKey === dish.catalogKey),
    ),
  );
  return { restaurants: mergedRestaurants, dishes: mergedDishes };
}
