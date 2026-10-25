import { ingredientHints } from "./ingredient-hints.js";
import { dietaryMenuStatus } from "./menu-filter.js";

// An authored bilingual example, not the output of a live AI request.
const sampleItems = [
  [
    "Entrantes",
    "Starters",
    "Guacamole casero",
    "House guacamole",
    "Aguacate, tomate, cebolla, lima y cilantro. Vegano.",
    "Avocado, tomato, onion, lime and cilantro. Vegan.",
    "3,95 €",
    ["Vegan"],
  ],
  [
    "Entrantes",
    "Starters",
    "Ensalada de la huerta",
    "Garden salad",
    "Lechuga, tomate, pepino, zanahoria y aceite de oliva. Vegano.",
    "Lettuce, tomato, cucumber, carrot and olive oil. Vegan.",
    "7,50 €",
    ["Vegan"],
  ],
  [
    "Platos principales",
    "Main dishes",
    "Tacos de pollo",
    "Chicken tacos",
    "Tortillas de maíz con pollo, cebolla y cilantro.",
    "Corn tortillas with chicken, onion and cilantro.",
    "10,50 €",
    [],
  ],
  [
    "Platos principales",
    "Main dishes",
    "Quesadilla de queso",
    "Cheese quesadilla",
    "Tortilla de trigo con queso fundido.",
    "Wheat tortilla with melted cheese.",
    "8,50 €",
    [],
  ],
  [
    "Platos principales",
    "Main dishes",
    "Arroz con verduras",
    "Vegetable rice",
    "Arroz, pimiento, guisantes, zanahoria y ajo. Vegano.",
    "Rice, bell pepper, peas, carrot and garlic. Vegan.",
    "8,95 €",
    ["Vegan"],
  ],
  [
    "Platos principales",
    "Main dishes",
    "Camarones al ajillo",
    "Garlic shrimp",
    "Camarones, ajo, aceite de oliva y perejil.",
    "Shrimp, garlic, olive oil and parsley.",
    "14,50 €",
    [],
  ],
  [
    "Postres",
    "Desserts",
    "Flan casero",
    "House flan",
    "Leche, huevos y caramelo.",
    "Milk, eggs and caramel.",
    "4,50 €",
    [],
  ],
  [
    "Entrantes",
    "Starters",
    "Berenjenas con miel",
    "Eggplant with honey",
    "Berenjenas rebozadas en harina de trigo con miel.",
    "Eggplant coated in wheat flour with honey.",
    "6,50 €",
    [],
  ],
];

export function spanishSample() {
  return {
    id: "spanish-example",
    title: "Mesa Verde",
    sample: true,
    sourceLabel: "Prepared bilingual example · not a live AI scan",
    items: sampleItems.map(
      (
        [
          categoryEs,
          categoryEn,
          nameEs,
          nameEn,
          descriptionEs,
          descriptionEn,
          price,
          tags,
        ],
        index,
      ) => ({
        id: `example-${index}`,
        categoryEs,
        categoryEn,
        nameEs,
        nameEn,
        descriptionEs,
        descriptionEn,
        price,
        tags: [...tags],
      }),
    ),
  };
}

export function assessScannedItem(item, profile) {
  if (item.needsTranslationReview)
    return {
      level: "unknown",
      conflicts: [],
      missing: [],
      clues: [
        "Original text changed. Review its English translation before comparing dietary needs.",
      ],
    };
  // Read English text only; do not invent a recipe or allergen-absence claim.
  const dish = {
    name: item.nameEn,
    description: item.descriptionEn,
    tags: item.tags || [],
    allergens: [],
  };
  dish.ingredientHints = ingredientHints(dish);
  return {
    ...dietaryMenuStatus(dish, profile),
    clues: dish.ingredientHints.clues,
  };
}

export function scannedItems(
  menu,
  { language = "en", query = "", forDiet = false, profile = {} } = {},
) {
  const search = query.trim().toLocaleLowerCase();
  const results = (menu?.items || [])
    .map((item) => ({ ...item, assessment: assessScannedItem(item, profile) }))
    .filter(
      (item) =>
        !forDiet ||
        (!item.needsTranslationReview && item.assessment.level !== "conflict"),
    )
    .filter((item) =>
      [item.nameEs, item.nameEn, item.descriptionEs, item.descriptionEn].some(
        (text) =>
          String(text || "")
            .toLocaleLowerCase()
            .includes(search),
      ),
    )
    .map((item) => ({
      ...item,
      name: language === "es" ? item.nameEs : item.nameEn,
      description: language === "es" ? item.descriptionEs : item.descriptionEn,
      category: language === "es" ? item.categoryEs : item.categoryEn,
    }));
  const categories = [...new Set(results.map((item) => item.category))];
  return categories.flatMap((category) =>
    results.filter((item) => item.category === category),
  );
}

export function updateScannedItem(menu, id, changes) {
  const fields = [
    "nameEs",
    "nameEn",
    "descriptionEs",
    "descriptionEn",
    "price",
  ];
  const cleaned = Object.fromEntries(
    fields.map((field) => [
      field,
      String(changes[field] || "")
        .trim()
        .slice(0, 1200),
    ]),
  );
  if (!cleaned.nameEs && !cleaned.nameEn)
    throw new Error("Enter a dish name before saving.");
  const original = menu.items.find((item) => item.id === id);
  if (!original) throw new Error("This dish no longer exists.");
  const originalChanged =
    cleaned.nameEs !== original.nameEs ||
    cleaned.descriptionEs !== original.descriptionEs;
  const englishChanged =
    cleaned.nameEn !== original.nameEn ||
    cleaned.descriptionEn !== original.descriptionEn;
  return {
    ...menu,
    edited: true,
    items: menu.items.map((item) =>
      item.id === id
        ? {
            ...item,
            ...cleaned,
            tags: [],
            needsTranslationReview: englishChanged
              ? false
              : originalChanged || !!item.needsTranslationReview,
          }
        : item,
    ),
  };
}

export function scanOwner(state) {
  return state.user?.id
    ? `account:${state.user.id}`
    : `device:${state.mode || "guest"}`;
}
