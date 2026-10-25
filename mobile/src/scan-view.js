// Category selection stays tied to the English key when the display language changes.
export function menuCategories(menu, language) {
  const categories = new Map();
  for (const item of menu?.items || []) {
    if (!categories.has(item.categoryEn))
      categories.set(
        item.categoryEn,
        language === "es" ? item.categoryEs : item.categoryEn,
      );
  }
  return [...categories].map(([value, label]) => ({ value, label }));
}

export function visibleScanItems(items, category) {
  return category === "all"
    ? items
    : items.filter((item) => item.categoryEn === category);
}

export function hasOriginalPage(menu) {
  return ["sayola-dinner-fixed", "2cero7-spanish-fixed"].includes(menu?.id);
}
