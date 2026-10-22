import { publishedMenus } from "./restaurant-menus.js";

// A small, reviewed catalog, not a live ordering feed. Every entry keeps its source.
// Stable text keys also let offline copies merge with database-generated UUIDs.
const reviewedAt = "2026-10-21";
const hawkersMenu = "https://eathawkers.com/menus/dining/";
const hawkersAllergens = "https://eathawkers.com/wp-content/uploads/2026/06/Allergen-Guide-6.26-Digital.pdf";
const freshMenu = "https://www.eatfreshkitchen.com/menu";
const freshAllergens = "https://cdn.prod.website-files.com/693520b45340ea3acc83192b/6ab51f5af1b27f93c60865a5_2609-FK-Allergen-and-Ingredient-Document.pdf";
const chipotleMenu = "https://locations.chipotle.com/fl/orlando/2211-s-orange-ave";
const chipotleAllergens = "https://www.chipotle.com/content/chipotle/us/en/allergens.html";

function district(address) {
  return {
    state: "FL", number: "10", congress: 119, verifiedAt: reviewedAt,
    sourceUrl: "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?" +
      new URLSearchParams({ address, benchmark: "Public_AR_Current", vintage: "ACS2025_Current", format: "json" }),
  };
}

export const localRestaurants = [
  {
    id: "hawkers-orlando", slug: "hawkers-orlando", name: "Hawkers Orlando",
    location: "Mills 50 · Orlando", address: "1103 N Mills Ave, Orlando, FL 32803",
    phone: "407-237-0606", description: "Asian street food in Mills 50. Selected dishes from the published allergen guide.",
    websiteUrl: "https://eathawkers.com/locations/orlando/", menuUrl: hawkersMenu, allergenUrl: hawkersAllergens,
    emoji: "", fictional: false, confirmed: false,
    district: district("1103 N Mills Ave Orlando FL 32803"),
    source: { reviewedAt, scope: "chain", note: "Guide version 6.5.26 V1. Wheat and tree nuts are not covered by its matrix. Branch availability and preparation need confirmation." },
  },
  {
    id: "fresh-kitchen-waterford", slug: "fresh-kitchen-waterford", name: "Fresh Kitchen · Waterford Lakes",
    location: "Waterford Lakes · Orlando", address: "851 N Alafaya Trail, Q01, Orlando, FL 32828",
    phone: "407-866-2219", description: "Build-your-own bowls. Each catalog entry describes one component, not a whole bowl.",
    websiteUrl: "https://www.eatfreshkitchen.com/locations/orlando-ucf", menuUrl: freshMenu, allergenUrl: freshAllergens,
    emoji: "", fictional: false, confirmed: false,
    district: district("851 N Alafaya Trail Orlando FL 32828"),
    source: { reviewedAt, scope: "chain", note: "Chain menu and ingredient document. Recipes, seasonal options and local availability can change; shared preparation is not verified." },
  },
  {
    id: "chipotle-south-orange", slug: "chipotle-south-orange", name: "Chipotle · South Orange",
    location: "South Orange · Orlando", address: "2211 S Orange Ave, Orlando, FL 32806",
    phone: "407-841-5656", description: "Burritos and bowls. Selected components from the US allergen matrix.",
    websiteUrl: chipotleMenu, menuUrl: chipotleMenu, allergenUrl: chipotleAllergens,
    emoji: "", fictional: false, confirmed: false,
    district: district("2211 S Orange Ave Orlando FL 32806"),
    source: { reviewedAt, scope: "chain", note: "US chain matrix; components touch during preparation. Limited-time foods may contain allergens outside the chart." },
  },
].map((restaurant) => {
  const menu = publishedMenus.find((item) => item.key === restaurant.slug);
  return { ...restaurant,
    description: 'Explore the published food menu and its reported dietary information.',
    menuCoverage: menu.menuCoverage, availabilityVerified: false,
    source: { ...restaurant.source, note: menu.sourceCaveats },
  };
});

// Convert reviewed source records into the app's shared dish contract.
export const localDishes = publishedMenus.flatMap((menu) => menu.items.map((item) => ({
  id: menu.key + '-' + item.key,
  catalogKey: menu.key + '-' + item.key,
  restaurantId: menu.key,
  name: item.name,
  category: item.category,
  description: item.kind === 'component' ? 'One component; review the complete order.' : '',
  price: null, emoji: '', revision: 1,
  ingredients: item.ingredients || [],
  allergens: item.allergens || [],
  otherDeclaredAllergens: item.otherDeclaredAllergens || [],
  tags: item.tags || [], modifications: [], informationComplete: false,
  preparation: menu.sourceCaveats + ' Confirm this location’s preparation and cross-contact with staff.',
  provenance: {
    menuUrl: item.menuUrl || menu.menuUrl,
    allergenUrl: item.allergenUrl || menu.allergenUrl,
    reviewedAt: item.reviewedAt || reviewedAt,
    scope: 'chain', kind: item.kind,
    coverage: item.coverage || menu.allergenCoverage || [],
    freeFromAllergens: item.freeFromAllergens || [],
    freeFromClaims: item.freeFromClaims || [],
    evidenceNote: item.evidenceNote,
    guideRow: item.guideRow || item.pdfName || null,
    pdfPage: item.pdfPage || null,
  },
})));

export function mergeLocalCatalog(restaurants = [], dishes = [], { preferBundled = false } = {}) {
  const flat = restaurants.map(({ details, ...row }) => ({ ...details, ...row }));
  const mergedRestaurants = localRestaurants.map((local) => {
    const live = flat.find((row) => row.slug === local.slug);
    if (live && preferBundled) return { ...local, id: live.id };
    return live || { ...local };
  });
  mergedRestaurants.push(...flat.filter((row) => !localRestaurants.some((local) => local.slug === row.slug)));
  const mergedDishes = localDishes.map((local) => {
    const live = dishes.find((dish) => dish.catalogKey === local.catalogKey);
    const restaurant = mergedRestaurants.find((row) => row.slug === local.restaurantId);
    if (live && !preferBundled) return { ...live, cloudBacked: true };
    // Device-saved demo facts are a cache, not a source. Refresh them from this
    // release while keeping stable IDs for favorites and historical references.
    return { ...local, id: live?.id || local.id, restaurantId: restaurant.id, cloudBacked: false };
  });
  mergedDishes.push(...dishes.filter((dish) => !localDishes.some((local) => local.catalogKey === dish.catalogKey)));
  return { restaurants: mergedRestaurants, dishes: mergedDishes };
}
