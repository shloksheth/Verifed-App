// Brand-inspired presentation; these are independent Verifed menu views.
const brands = [
  { key: "mcdonalds", prefix: "mcdonald", name: "McDonald’s", accent: "#292929", tint: "#FFF1B8", background: "#FFC72C", wordmark: "McDonald’s", edition: "BURGERS & MORE" },
  { key: "taco-bell", prefix: "taco-bell", name: "Taco Bell", accent: "#5B2AA8", tint: "#F0E8FC", background: "#F0E8FC", wordmark: "TACO BELL", edition: "LIVE MÁS" },
  { key: "pizza-hut", prefix: "pizza-hut", name: "Pizza Hut", accent: "#A81820", tint: "#FDE9E5", background: "#FFF4E8", wordmark: "Pizza Hut", edition: "PIZZA NIGHT" },
  { key: "dominos", prefix: "dominos", name: "Domino’s", accent: "#006491", tint: "#E2F1F8", background: "#E2F1F8", wordmark: "DOMINO’S", edition: "PIZZA & SIDES" },
  { key: "wendys", prefix: "wendys", name: "Wendy’s", accent: "#B5122B", tint: "#FCE9ED", background: "#FCE9ED", wordmark: "Wendy’s", edition: "FRESH FAVORITES" },
  { key: "chipotle", prefix: "chipotle", name: "Chipotle", accent: "#722C35", tint: "#F1E6E0", background: "#F1E6E0", wordmark: "CHIPOTLE", edition: "BUILD YOUR BOWL" },
];

export function chainBrand(restaurant) {
  const slug = restaurant.slug || restaurant.id || "";
  return brands.find((brand) => slug.startsWith(brand.prefix)) || null;
}
