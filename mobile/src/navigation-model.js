export const primaryRoutes = ["home", "explore", "scan", "history"];

export const navigationItems = [
  { route: "home", label: "Home", icon: "home-outline", active: "home" },
  { route: "explore", label: "Explore", icon: "compass-outline", active: "compass" },
  { route: "scan", label: "Scan", icon: "scan-outline", active: "scan" },
  { route: "history", label: "Journal", icon: "journal-outline", active: "journal" },
];

const associatedTab = {
  restaurant: "explore",
  dish: "explore",
  favorites: "explore",
  meal: "history",
};

export function tabForPage(page) {
  if (primaryRoutes.includes(page)) return page;
  return associatedTab[page] || null;
}

export function bottomNavigationMode(page) {
  if (primaryRoutes.includes(page)) return "primary";
  if (page === "auth") return "hidden";
  return "contextual";
}

export const contextualPages = {
  restaurant: { title: "Restaurant menu", icon: "restaurant-outline", action: "Explore", actionIcon: "compass-outline", target: "explore" },
  dish: { title: "Dish details", icon: "restaurant-outline", action: "Saved", actionIcon: "heart-outline", target: "favorites" },
  meal: { title: "Meal notes", icon: "document-text-outline", action: "Journal", actionIcon: "journal-outline", target: "history" },
  favorites: { title: "Saved dishes", icon: "heart-outline", action: "Explore", actionIcon: "compass-outline", target: "explore" },
  profile: { title: "Dietary profile", icon: "person-outline", action: "Edit", actionIcon: "create-outline", target: "edit-profile" },
  "edit-profile": { title: "Edit preferences", icon: "options-outline", action: "Profile", actionIcon: "person-outline", target: "profile" },
  settings: { title: "Settings", icon: "settings-outline", action: "Profile", actionIcon: "person-outline", target: "profile" },
  help: { title: "Help", icon: "help-circle-outline", action: "Home", actionIcon: "home-outline", target: "home" },
};
