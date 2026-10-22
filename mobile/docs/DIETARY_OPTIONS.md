# Additional dietary choices (V11)

data.js adds Honey, No garlic or onion, and Vegetarian (no eggs). The API cleans and persists the shared choices. Profiles already use string arrays; no schema change was needed.

MAJOR_ALLERGENS is the original nine-item list. ALLERGENS extends it with Honey. The icon legend includes a labeled honey-jar glyph; baseline unknown-coverage symbols still use the nine-major list. A nine-allergen guide does not establish Honey absence. The strict all-nine discovery mode requires absence claims for those nine plus any additional selected allergy, so choosing Honey also requires its own support.

ingredient-hints.js recognizes the published word honey, including honey mustard and hot honey, without treating honeydew, honey-free wording or an explicitly named vegan honey alternative as real honey. Honey is flagged even when a contradictory Vegan tag exists. No honey in the available text does not prove honey-free.

Garlic, onion, shallot and scallion words flag No garlic or onion. The small cleaning rules understand simple no/without garlic or onion and garlic-free/onion-free wording. They do not invent an entire recipe or certify hidden ingredients. A vegan or vegetarian label alone never establishes garlic/onion absence; unsupported items remain possible options requiring confirmation.

menu-filter.js exports supportsRestriction and restrictionHasConflict for both personalized menus and domain.js dish assessments. Vegetarian (no eggs) rejects meat/fish and named or possible egg ingredients. It permits dairy. An explicit Vegan label supports this dietary preference; a Vegetarian label alone does not establish egg absence. Vegetarian plus an explicit Egg-free claim can support it, unless contradictory ingredients are flagged. Vegan still does not establish Egg allergy absence.

## Dish detail crash and interface cleanup

DishDetail accidentally referenced an onPress variable that belonged to RestaurantRow. Rendering the detail screen evaluated that undeclared identifier and threw the iPhone error "Property onPress doesn't exist". Its restaurant button now calls navigate directly. RestaurantRow still accepts its optional callback for chain branch picking. The two scopes remain separate.

The bindings test parses every published JavaScript module using the pinned Babel parser/traversal development dependencies. It checks referenced identifiers against actual lexical bindings and known runtime globals. This catches undefined callbacks before publication, unlike a bundle export that only validates syntax. The actual browser journey also opened a real dish, toggled its saved status, opened/closed the journal sheet, and returned to the restaurant.

Repeated menu warnings, confirmation paragraphs and per-row missing-needs lists were removed. The compact Details badge, Possible options group and specific ingredient flags remain factual status labels. Dish details show actual conflicts and ingredients; the expandable Source details section preserves coverage and original evidence. The rules still treat unknown ingredient data as unknown and never promote it to a source-supported match.
