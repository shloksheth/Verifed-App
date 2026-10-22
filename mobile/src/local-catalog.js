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
];

function selection(restaurantId, key, name, allergens, description, options = {}) {
  const restaurant = localRestaurants.find((item) => item.id === restaurantId);
  return {
    id: `${restaurantId}-${key}`, catalogKey: `${restaurantId}-${key}`, restaurantId,
    name, description, price: null, emoji: "", category: options.kind === "dish" ? "Street food" : "Components",
    ingredients: options.ingredients || [], allergens, tags: options.tags || [], modifications: [], revision: 1,
    informationComplete: false,
    preparation: options.preparation || "Cross-contact and branch preparation are unconfirmed. Discuss your needs with restaurant staff.",
    provenance: {
      menuUrl: restaurant.menuUrl, allergenUrl: restaurant.allergenUrl, reviewedAt,
      scope: "chain", kind: options.kind || "component",
      // Coverage describes the source's categories, never proof that a blank cell is safe.
      coverage: options.coverage || [], freeFromClaims: options.freeFromClaims || [],
      evidenceNote: options.evidenceNote || "Positive declarations transcribed from the restaurant's published guide. Other ingredients and allergens may be unreported.",
    },
  };
}

const hawkersCoverage = ["Soy", "Shellfish", "Fish", "Milk", "Egg", "Peanuts", "Sesame"];
// Ingredients copied as public factual lists from the linked September document.
// Prepared blends remain the restaurant's descriptions, with no invented recipe.
const freshIngredients = {
  "almond-chicken": ["Marinated chicken tenders", "Olive oil", "Salt & pepper", "Yellow mustard", "Pure olive oil", "Fresh garlic", "Blackening spice", "Fresh basil", "Dried thyme", "Dried sage", "Dried rosemary", "Eggs", "Cornstarch", "Gluten-free breadcrumbs", "Toasted almonds"],
  "sweet-potato-noodles": ["Sweet potato noodles", "Cilantro", "Salt & pepper", "Pure olive oil", "Apple cider vinegar", "Sriracha", "Tamari (GF soy sauce)", "Agave", "Ginger", "Cayenne pepper", "Toasted white sesame seeds"],
  "kale-caesar": ["Chopped kale", "Almonds", "Mustard", "Fresh garlic", "Lemon juice", "Nutritional yeast", "Granulated onion", "Kosher salt", "Pure olive oil"],
  "green-beans": ["Green beans", "Sriracha", "Salt & pepper", "Pure olive oil", "Ginger", "Garlic", "Tamari (GF soy sauce)"],
  "white-ginger": ["Garbanzo aquafaba", "Lemon juice", "Kosher salt", "Yellow mustard", "Pomace/EVOO blend", "Tamari", "Agave", "Fresh ginger"],
  "coconut-sriracha": ["Yellow Bird sriracha", "Tamari (GF soy sauce)", "Fresh ginger", "Mustard", "Coconut milk", "Pomace/EVOO blend", "Cayenne pepper", "Agave", "Water", "Xanthan gum", "Apple cider vinegar"],
  "brown-rice": ["Brown rice", "Onion", "Pure olive oil", "Salt & pepper"],
  "coconut-ginger-rice": ["White rice", "Ginger", "Lime juice", "Coconut milk", "Coconut oil", "Orange juice", "Pure olive oil", "Salt & pepper"],
  "lemon-broccoli": ["Broccoli", "Pure olive oil", "Lemon juice", "Blackened seasoning", "Fresh garlic", "Salt & pepper"],
  "golden-chickpeas": ["Garbanzo beans", "Pure olive oil", "White onions", "Minced garlic", "Minced ginger", "Cumin", "Turmeric", "Tomato paste", "Salt & pepper", "Light chili powder", "Cayenne pepper", "Cilantro", "Paprika", "Red peppers", "Green peppers"],
  "basil-mushrooms": ["Mushrooms", "Salt & pepper", "Granulated garlic", "Basil", "Balsamic vinegar", "Pure olive oil", "Fresh garlic"],
  "rosemary-chicken": ["Marinated chicken", "Fresh rosemary", "Italian parsley", "Orange juice", "Lemon juice", "Fresh garlic", "Yellow mustard", "Salt", "Pepper", "Paprika", "Pure olive oil"],
};
const hawkers = (key, name, allergens, description) => selection("hawkers-orlando", key, name, allergens, description, {
  kind: "dish", coverage: hawkersCoverage,
  preparation: "The guide says cooking oil may contain trace soy protein. Wheat and tree nuts are not covered. Ask this location about ingredients and cross-contact.",
});
const fresh = (key, name, allergens, description, options) => selection("fresh-kitchen-waterford", key, name, allergens, description, {
  coverage: [...new Set(["Milk", "Soy", ...allergens])], ingredients: freshIngredients[key], ...options,
});
const chipotle = (key, name, allergens, description, options) => selection("chipotle-south-orange", key, name, allergens, description, {
  coverage: ["Milk", "Soy", "Wheat"], ...options,
});

export const localDishes = [
  hawkers("chili-crisp-wontons", "Chili Crisp Wontons", ["Soy", "Shellfish", "Egg", "Peanuts", "Sesame"], "Wontons with chicken, shrimp and mushrooms."),
  hawkers("bbq-pork-bao", "Bao - Chinese BBQ Pork", ["Soy", "Milk", "Sesame"], "Bao with roasted pork and hoisin."),
  hawkers("pork-belly-bao", "Bao - Pork Belly", ["Soy", "Fish", "Milk", "Peanuts"], "Pork belly bao with greens and peanuts."),
  hawkers("seoul-chicken-bao", "Bao - Seoul Hot Chicken", ["Soy", "Milk"], "Fried chicken bao with garlic gochujang."),
  hawkers("bulgogi-steak", "Bulgogi Steak", ["Soy", "Egg", "Sesame"], "Korean BBQ steak with onions."),
  hawkers("twice-fried-wings", "Korean Twice Fried Wings", ["Soy", "Peanuts", "Sesame"], "Wings with garlic gochujang and peanuts."),
  fresh("almond-chicken", "Almond Baked Chicken", ["Tree nuts", "Egg"], "Chicken component with almonds; not a complete bowl.", {
    evidenceNote: "Menu declares nuts. The PDF's corresponding Baked Almond Chicken also lists almonds and eggs among its ingredients. Neither name nor top-level label alone is a complete allergen record.",
  }),
  fresh("sweet-potato-noodles", "Sweet Potato Noodles", ["Soy", "Sesame"], "Noodle base component; other bowl choices need separate review.", {
    evidenceNote: "The September PDF names this component Chilled Sweet Potato Noodles, declares soy, and lists toasted white sesame seeds. Sesame comes from ingredient evidence, even though its short label only highlights soy.",
  }),
  fresh("kale-caesar", "Crunchy Kale Caesar", ["Tree nuts"], "Salad base component. The ingredient document identifies almonds."),
  fresh("green-beans", "Blistered Green Beans", ["Soy"], "Vegetable component from the chain menu."),
  fresh("white-ginger", "Creamy White Ginger", ["Soy"], "Sauce component from the chain menu."),
  fresh("coconut-sriracha", "Coconut Sriracha", ["Soy"], "Sauce component from the chain menu."),
  fresh("brown-rice", "Brown Rice", [], "Rice base component; no selected major allergens declared in its published row.", {
    evidenceNote: "The component row is marked dairy-free, nut-free and soy-free in the ingredient PDF. Blank categories do not establish absence; review the full bowl and shared preparation with staff.",
    freeFromClaims: ["Restaurant labels dairy-free", "Restaurant labels nut-free", "Restaurant labels soy-free"],
  }),
  fresh("coconut-ginger-rice", "Coconut Ginger Rice", [], "Rice base made with coconut ingredients; not a complete bowl.", {
    evidenceNote: "PDF row lists coconut milk/oil and is marked dairy-free, nut-free and soy-free. Coconut is recorded here explicitly; no personal tolerance or allergen absence is inferred.",
    freeFromClaims: ["Restaurant labels dairy-free", "Restaurant labels nut-free", "Restaurant labels soy-free"],
  }),
  fresh("lemon-broccoli", "Lemon Garlic Broccoli", [], "Vegetable component from the chain menu.", {
    evidenceNote: "PDF row is marked dairy-free, nut-free and soy-free. Other categories, recipe substitutions and cross-contact still need staff review.",
    freeFromClaims: ["Restaurant labels dairy-free", "Restaurant labels nut-free", "Restaurant labels soy-free"],
  }),
  fresh("golden-chickpeas", "Golden Spice Chickpeas", [], "Chickpea component from the chain menu.", {
    evidenceNote: "PDF row is marked dairy-free, nut-free and soy-free; this is a restaurant claim for one component, not assurance about the complete order.",
    freeFromClaims: ["Restaurant labels dairy-free", "Restaurant labels nut-free", "Restaurant labels soy-free"],
  }),
  fresh("basil-mushrooms", "Basil Mushrooms", [], "Vegetable component from the chain menu.", {
    evidenceNote: "PDF row is marked dairy-free, nut-free and soy-free. Shared preparation and branch availability remain unconfirmed.",
    freeFromClaims: ["Restaurant labels dairy-free", "Restaurant labels nut-free", "Restaurant labels soy-free"],
  }),
  fresh("rosemary-chicken", "Grilled Rosemary Chicken", [], "Chicken protein component; the ingredient document also lists yellow mustard.", {
    evidenceNote: "Corresponding Rosemary Chicken PDF row is marked dairy-free, nut-free and soy-free and lists yellow mustard. Mustard is not one of the app's nine tracked categories; consult the source for other needs.",
    freeFromClaims: ["Restaurant labels dairy-free", "Restaurant labels nut-free", "Restaurant labels soy-free"],
  }),
  chipotle("burrito-tortilla", "Flour Tortilla (Burrito)", ["Wheat"], "Tortilla component; fillings need their own review.", { evidenceNote: "The US matrix marks wheat/gluten and sulphites. Its sulphites note concerns naturally occurring sulphites in vinegar below 10 ppm." }),
  chipotle("taco-tortilla", "Flour Tortilla (Taco)", ["Wheat"], "Tortilla component, without fillings.", { evidenceNote: "The US matrix marks wheat/gluten and sulphites. Its sulphites note concerns naturally occurring sulphites in vinegar below 10 ppm." }),
  chipotle("sofritas", "Sofritas", ["Soy"], "Tofu protein component; not a complete entrée.", { evidenceNote: "US matrix marks soy and sulphites; the vinegar sulphites note is below 10 ppm. Review the complete order with staff." }),
  chipotle("cheese", "Monterey Jack Cheese", ["Milk"], "Cheese topping component."),
  chipotle("queso", "Queso Blanco", ["Milk"], "Queso component."),
  chipotle("sour-cream", "Sour Cream", ["Milk"], "Dairy topping component."),
];

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
