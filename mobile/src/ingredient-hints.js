// Clues come only from the words a restaurant publishes. This is a small,
// inspectable ingredient dictionary, not an AI recipe guess or an absence claim.
const direct = [
  [
    "Milk",
    /\b(?:milk|dairy|gouda|manchego|stracciatella|mascarpone|provolone|crema|crème fraîche|queso fresco|cheddar|feta|parmesan|pecorino|mozzarella|ricotta|burrata|gorgonzola|cotija|paneer|ghee|curd|khoya|buttermilk|whey|yogurt|yoghurt|sour cream|heavy cream|cream cheese|goat cheese)\b/i,
  ],
  ["Egg", /\b(?:eggs?|omelet|omelette|egg yolks?|egg whites?)\b/i],
  [
    "Fish",
    /\b(?:fish|flounder|bluefin|unagi|eel|ikura|mentaiko|roe|salmon|tuna|anchov(?:y|ies)|cod|tilapia|mahi|snapper|branzino|sea bream|hamachi|yellowtail|sardines?|trout|fish sauce|bonito)\b/i,
  ],
  ["Shellfish", /\b(?:shrimp|prawns?|lobster|crab|crawfish|crayfish)\b/i],
  [
    "Tree nuts",
    /\b(?:almonds?|cashews?|walnuts?|pecans?|pistachios?|hazelnuts?|macadamias?|pine nuts?)\b/i,
  ],
  ["Peanuts", /\bpeanuts?\b/i],
  ["Wheat", /\b(?:wheat|seitan|semolina|bulgur|couscous)\b/i],
  ["Soy", /\b(?:soy|soya|soy sauce|soybeans?|edamame|tofu|miso|tempeh)\b/i],
  ["Sesame", /\b(?:sesame|tahini)\b/i],
  ["Honey", /\bhoney\b/i],
];
const uncertain = [
  [
    "Milk",
    /\b(?:cheese|butter|cream|creme|queso|ice cream|gelato|cheesecake|budino|pudding|brownie|blondie|chantilly|trifle|parm|chz|ranch|pesto)\b/i,
  ],
  ["Shellfish", /\b(?:mussels?|clams?|oysters?|scallops?)\b/i],
  [
    "Egg",
    /\b(?:mayo|mayonnaise|aioli|brioche|custard|meringue|flan|cake|cookies?|cannoli|tiramisu|budino|pudding|brownie|blondie|pastry|trifle)\b/i,
  ],
  [
    "Wheat",
    /\b(?:bread|breadcrumbs|chapati|roti|paratha|poori|bun|buns|brioche|pasta|pizza|biscuit|biscuits|flour tortilla|flour tortillas|panko|battered|breaded|focaccia|croissant|naan|pita|dumplings?|wontons?|ramen|udon|tempura|flour|cake|cookies?|crackers?|croutons?|tortellini|rigatoni|spaghetti|pappardelle|bucatini|paccheri|gnocchi|fettuccine|macaroni|calzone|pastry|brownie|blondie|pretzel|toast|rye|lavash)\b/i,
  ],
];
const meatOrFish =
  /\b(?:seafood|fish|flounder|ribs|wings|meatloaf|barbacoa|birria|bistecca|wagyu|sirloin|jamon|pesce|bluefin|toro|unagi|eel|uni|ikura|mentaiko|roe|anchovies|meats?|meatballs?|ham|veal|chorizo|pollo|carne asada|guanciale|capicola|lardo|bolognese|ragu|beef|pork|chicken|duck|lamb|turkey|bacon|prosciutto|salami|mortadella|nduja|pepperoni|sausage|steak|brisket|carnitas|fish|flounder|bluefin|unagi|eel|ikura|mentaiko|roe|salmon|tuna|anchovy|cod|snapper|branzino|sea bream|hamachi|yellowtail|mussels?|clams?|oysters?|scallops?|octopus|squid|shrimp|prawns?|lobster|crab|fish sauce|bonito)\b/i;

export function ingredientHints(item) {
  const text = [item.name, item.description, ...(item.ingredients || [])]
    .filter(Boolean)
    .join(" · ");
  const vegan = (item.tags || []).includes("Vegan");
  // A plant-based substitute must not inherit the animal ingredient's risk.
  const cleaned = text
    .replace(/\b(?:king\s+)?oyster mushrooms?\b/gi, "mushrooms")
    .replace(/\bFish[’\']s Gold\b/gi, "house sauce")
    .replace(/\b(?:no|without)\s+honey\b/gi, "")
    .replace(/\+\s*[^.;·]*?\d+(?:\.\d+)?/gi, "")
    .replace(/\b(?:add|optional)\s+[^.;·]*/gi, "")
    .replace(
      /(?:vegan|plant.based|non.dairy|dairy.free)\s+(?:cheese|butter|cream|mayo|mayonnaise|aioli|chicken|sausage|bacon|egg|honey)/gi,
      "",
    )
    .replace(
      /(?:coconut|almond|cashew|peanut|soy|oat|rice)\s+(?:milk|cream|butter)/gi,
      (phrase) => phrase.split(/\s/)[0],
    )
    .replace(
      /(?:rice|corn|almond|coconut|chickpea|tapioca|potato|cassava)\s+flour/gi,
      (phrase) => phrase.split(/\s/)[0],
    )
    .replace(
      /chicken.fried (?=cauliflower|tofu|mushroom)|jackfruit carnitas/gi,
      "",
    )
    .replace(
      /eggplant|egg roll|butter beans|butter lettuce|(?:milk|dairy|egg|soy|wheat|sesame|peanut|nut|honey).free|buckwheat/gi,
      "",
    );
  const allergens = [],
    possibleAllergens = [],
    clues = [];
  for (const [allergen, pattern] of direct) {
    if (vegan && ["Milk", "Egg", "Fish", "Shellfish"].includes(allergen))
      continue;
    const match = cleaned.match(pattern);
    if (match) {
      allergens.push(allergen);
      clues.push(`${allergen}: menu names ${match[0]}`);
    }
  }
  for (const [allergen, pattern] of uncertain) {
    if (
      allergens.includes(allergen) ||
      (vegan && ["Milk", "Egg", "Fish", "Shellfish"].includes(allergen))
    )
      continue;
    if (allergen === "Wheat" && (item.tags || []).includes("Gluten-free"))
      continue;
    const match = cleaned.match(pattern);
    if (match) {
      possibleAllergens.push(allergen);
      clues.push(`Possible ${allergen}: check ${match[0]}`);
    }
  }
  const restrictionConflicts = [];
  const aromatics = cleaned
    .replace(
      /\b(?:no|without)\s+(?:garlic(?:\s*(?:and|or|\/|&)\s*onions?)?|onions?(?:\s*(?:and|or|\/|&)\s*garlic)?|honey)\b/gi,
      "",
    )
    .replace(/\b(?:garlic|onion)[-\s]free\b/gi, "");
  const aromatic = aromatics.match(
    /\b(?:garlic|onions?|shallots?|scallions?)\b/i,
  );
  if (aromatic) {
    restrictionConflicts.push("No garlic or onion");
    clues.push(`No garlic or onion: menu names ${aromatic[0]}`);
  }
  const animalAllergens = [
    ...(item.allergens || []),
    ...allergens,
    ...possibleAllergens,
  ];
  if (animalAllergens.some((value) => ["Fish", "Shellfish"].includes(value)))
    restrictionConflicts.push("Vegetarian", "Vegan");
  if (
    !vegan &&
    meatOrFish.test(cleaned) &&
    !(item.tags || []).includes("Vegetarian")
  )
    restrictionConflicts.push("Vegetarian", "Vegan");
  if (
    !vegan &&
    (animalAllergens.some((value) => ["Milk", "Egg"].includes(value)) ||
      /\bhoney\b/i.test(cleaned))
  )
    restrictionConflicts.push("Vegan");
  if (
    [...allergens, ...possibleAllergens].includes("Wheat") &&
    !(item.tags || []).includes("Gluten-free")
  )
    restrictionConflicts.push("Gluten-free");
  return {
    allergens,
    possibleAllergens,
    restrictionConflicts: [...new Set(restrictionConflicts)],
    clues,
  };
}
