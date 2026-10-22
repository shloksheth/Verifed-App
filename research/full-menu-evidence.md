# Full public food-menu evidence

Reviewed 2026-10-21. This is an inventory of the cited public food sources, not a verified complete live menu at each branch. No drinks, alcohol, catering packages, prices or invented fixed bowl combinations are included. The JSON keeps the existing catalog short keys for matching selections.

## Interpretation

- `allergens`: positive declared cells or named allergen ingredients only. Empty means none positively recorded, not absent.
- `freeFromAllergens`: explicit restaurant claims only; never blank matrix cells or vegan status. Known positives override conflicting claims. These are ingredient/label claims, not a safety assurance.
- `tags`: explicit dietary labels or vegetarian implication of an explicit vegan label. Gluten-free does not automatically mean wheat-free.
- `ingredients`: available named ingredients from Fresh Kitchen’s PDF; compound blends are unexpanded. Other records use empty arrays because complete ingredient lists were not provided.
- `informationComplete` remains false everywhere. Cross-contact and local availability are not independently verified.

## Hawkers Orlando

[Official dining page](https://eathawkers.com/menus/dining/) · [Orlando address page](https://eathawkers.com/locations/orlando/) · [Current allergen PDF, 6.5.26 V1](https://eathawkers.com/wp-content/uploads/2026/06/Allergen-Guide-6.26-Digital.pdf)

49 food records cover the dining page once, including three curry and three Lo Mein protein options, Happy Hour chicken, and the optional Thai fried egg. Repeated promotional entries are deduplicated. Crispy Pork Belly is excluded because the page explicitly restricts it to Atlanta Beltline. Kids items and dishes appearing only in the guide are outside this dining-page inventory.

The colored seven-column guide was rendered and visually checked across the food and sauce sections; row color sampling cross-checked the transcription. Wheat/tree nuts are not columns. No free-from claims or vegetarian status were inferred from white cells or the “Veggie-ish” heading. All cooked dishes may have trace soy from vegetable oil.

Rows marked without sauce are partial. Where the menu clearly names a matching sauce, JSON unions the positive source rows and names both: Roti + Curry Dipping Sauce; dumplings + Dumpling Sauce; soup dumplings + Soup Dumpling Sauce; egg rolls + Duck Sauce; spring rolls + Vietnamese Vinaigrette; summer rolls + Summer Roll Sauce; karaage + Japanese Mayo; coconut shrimp + Curry Dipping Sauce. Golden Wontons and Fries have an unmatched sweet Thai chili sauce, so their records retain incomplete coverage.

Pok Pok Wings is a source discrepancy: the whole-dish row has soy/fish/sesame, while the separately named Pok Pok Sauce also marks peanuts. The menu calls its glaze bird’s-eye chili, so exact sauce identity is not established. JSON preserves whole-dish positives and explicitly flags peanuts for confirmation. Banchan has no complete guide row; fish is recorded from its named Spicy Kimchi component, with other assortment information unresolved.

## Fresh Kitchen Waterford Lakes

[Official menu](https://www.eatfreshkitchen.com/menu) · [Waterford Lakes location](https://www.eatfreshkitchen.com/locations/orlando-ucf) · [September ingredient/allergen PDF](https://cdn.prod.website-files.com/693520b45340ea3acc83192b/6ab51f5af1b27f93c60865a5_2609-FK-Allergen-and-Ingredient-Document.pdf)

35 food records: 30 named components corresponding to the updated menu/PDF, three customizable bowl sizes, and two updated cookie listings. All five ingredient-table pages were rendered and visually checked. The site contains older and updated menu blocks; the updated block agrees with September proteins/sauces and is used here. Roasted Salmon, Blackened Chicken, Holy Kale, Herb Balsamic, generic Really Good Cookies and Harvest Bars appear only in the older block and are excluded.

Explicit Dairy Free and Soy Free column marks become Milk/Soy free-from claims. The PDF legend calls DF “Non-Dairy Friendly”; live menu calls it dairy-free. Nut Free is preserved verbatim in claims without expanding it into both peanut and tree-nut absence. GF/VF become dietary tags. Both Parmesan Cheese and Feta Cheese explicitly have the Vegetarian-column dot on PDF page 6; this is not a rennet inference. These claims remain subject to the PDF’s cross-contact and recipe-change disclaimer.

Important positives: Sweet Potato Noodles include sesame seeds despite a soy-only short warning; Almond Baked Chicken lists eggs and almonds; Teriyaki Salmon lists salmon, soy sauce and sesame; Parmesan/Feta are cheese ingredients. Mustard is retained in ingredient notes outside the nine tracked categories. Coconut is named but not auto-classified as tree nuts.

The live Seasonal Cauliflower Rice label says nuts, but does not specify species. The PDF’s Lemon Herb Cauli Rice contains almonds; its mapping to the generic seasonal entry is not branch-verified, so full ingredients and all normalized dietary/free-from/almond mappings are withheld for that generic entry. Cookie ingredients are not in the PDF: chocolate cookie has an explicit dairy-free label; both say nuts without full species, and the peanut-butter cookie explicitly names peanut butter. Other ingredient/allergen details remain unknown.

## Chipotle South Orange

[Official US allergen/dietary page](https://www.chipotle.com/content/chipotle/us/en/allergens.html) · [South Orange location/menu page](https://locations.chipotle.com/fl/orlando/2211-s-orange-ave)

All 26 components in the US matrix are included. This is a complete transcription of that component matrix, not a claim that the matrix includes every currently sold entrée or limited-time food. The local page features Pollo Asado meals not covered by the matrix; no allergen profiles or “free-from” claims were fabricated for them.

Only the explicit chain statement that eggs, fish, shellfish, peanuts, tree nuts and sesame are not used as ingredients maps to those six tracked free-from categories. It also names mustard. Cross-contact remains possible, and limited-time/test recipes may differ. Milk/soy/wheat blanks are not mapped. Wheat/gluten positives are normalized to Wheat. Sulphites are recorded separately for the two flour tortillas, Sofritas, honey vinaigrette and red chimichurri; the restaurant attributes these to vinegar below 10 ppm. Corn foods may have agricultural trace gluten.

Sofritas and the expressly named tortilla/vegetable/rice/bean/salsa/chip/guacamole groups receive Vegan and Vegetarian tags. Cheese, queso and sour cream receive Vegetarian based on the page’s vegetable-rennet/dairy explanation. Honey vinaigrette and red chimichurri get no inferred vegan tag.

## Food inventory

### Hawkers Orlando

| Key | Food name | Category | Recorded positives | Explicit tracked free-from claims |
| --- | --- | --- | --- | --- |
| roti-canai | Roti Canai | Dim Sum & Then Some | Soy, Fish | None recorded |
| seoul-chicken-bao | Seoul Hot Chicken Baos | Dim Sum & Then Some | Soy, Milk | None recorded |
| pork-belly-bao | Pork Belly Baos | Dim Sum & Then Some | Soy, Fish, Milk, Peanuts | None recorded |
| bbq-pork-bao | Chinese BBQ Pork Baos | Dim Sum & Then Some | Soy, Milk, Sesame | None recorded |
| chicken-dumplings | Yi-Yi’s Chicken Dumplings | Dim Sum & Then Some | Sesame, Soy | None recorded |
| chili-crisp-wontons | Chili Crisp Wontons | Dim Sum & Then Some | Soy, Shellfish, Egg, Peanuts, Sesame | None recorded |
| golden-wontons | Golden Wontons | Dim Sum & Then Some | Shellfish, Egg, Sesame | None recorded |
| soup-dumplings | Soup Dumplings | Dim Sum & Then Some | Soy, Fish, Milk, Sesame | None recorded |
| chicken-egg-rolls | Chicken Egg Rolls | Dim Sum & Then Some | Egg, Sesame | None recorded |
| spring-rolls | Spring Rolls | Dim Sum & Then Some | Sesame, Fish | None recorded |
| shrimp-summer-rolls | Shrimp Summer Rolls | Dim Sum & Then Some | Shellfish, Soy, Peanuts, Sesame | None recorded |
| chicken-karaage | Chicken Karaage | Lil Sumpin Sumpin | Soy, Egg | None recorded |
| chuan-jerk-wings | Chuan Jerk Wings | Lil Sumpin Sumpin | Soy, Sesame | None recorded |
| hawkers-fries | Hawkers Fries | Lil Sumpin Sumpin | Unknown / none recorded | None recorded |
| gochujang-salad | Gochujang Salad | Lil Sumpin Sumpin | Soy, Sesame | None recorded |
| chilly-chili-noodles | Chilly Chili Noodles | Lil Sumpin Sumpin | Soy, Egg, Peanuts, Sesame | None recorded |
| bulgogi-steak | Bulgogi Steak | Meats | Soy, Egg, Sesame | None recorded |
| hong-kong-sticky-ribs | Hong Kong Sticky Ribs | Meats | Soy, Sesame | None recorded |
| twice-fried-wings | Korean Twice Fried Wings | Meats | Soy, Peanuts, Sesame | None recorded |
| pok-pok-wings | Pok Pok Wings | Meats | Soy, Fish, Sesame | None recorded |
| satay-chicken | Satay Chicken | Meats | Soy, Peanuts | None recorded |
| coconut-shrimp | Coconut Shrimp | Meats | Shellfish, Milk, Egg, Soy, Fish | None recorded |
| goi-ga-salad | Vietnamese “Goi Gá” Salad | Veggie-ish | Soy, Fish, Peanuts | None recorded |
| chili-crisp-cucumbers | Chili Crisp Cucumbers | Veggie-ish | Soy, Sesame | None recorded |
| chili-garlic-edamame | Chili Garlic Edamame | Veggie-ish | Soy, Sesame | None recorded |
| hawkers-delight | Hawker’s Delight | Veggie-ish | Soy, Sesame | None recorded |
| crispy-tofu-bites | Crispy Tofu Bites | Veggie-ish | Soy | None recorded |
| banchan | Banchan | Veggie-ish | Fish | None recorded |
| chow-faan | Chow Faan | Rice & Curry | Soy, Shellfish, Egg, Sesame | None recorded |
| bibimbap | Bibimbap | Rice & Curry | Soy, Fish, Egg, Sesame | None recorded |
| curry-chicken | Po Po Lo’s Curry — Chicken | Rice & Curry | Soy, Fish | None recorded |
| curry-steak | Po Po Lo’s Curry — Steak | Rice & Curry | Soy, Fish, Egg | None recorded |
| curry-shrimp | Po Po Lo’s Curry — Shrimp | Rice & Curry | Soy, Shellfish, Fish | None recorded |
| steak-kimchi-rice | Steak and Kimchi Fried Rice | Rice & Curry | Soy, Egg | None recorded |
| jasmine-rice | Jasmine Rice | Rice & Curry | Unknown / none recorded | None recorded |
| ckt | C.K.T. | Noodles | Soy, Shellfish, Fish, Egg, Sesame | None recorded |
| singapore-mei-fun | Singapore Mei Fun | Noodles | Shellfish, Egg, Sesame | None recorded |
| yaki-udon | Yaki Udon | Noodles | Soy, Egg, Sesame | None recorded |
| pad-thai | Pad Thai | Noodles | Soy, Shellfish, Fish, Egg, Peanuts, Sesame | None recorded |
| beef-haw-fun | Beef Haw Fun | Noodles | Soy, Egg, Sesame | None recorded |
| chicken-lo-mein | Chicken Lo Mein | Noodles | Soy, Egg, Sesame | None recorded |
| steak-lo-mein | Steak Lo Mein | Noodles | Soy, Egg, Sesame | None recorded |
| shrimp-lo-mein | Shrimp Lo Mein | Noodles | Soy, Shellfish, Egg, Sesame | None recorded |
| hong-kong-wonton | Hong Kong Wonton | Noodle Soups | Soy, Shellfish, Egg, Sesame | None recorded |
| curry-laksa-ramen | Curry Laksa Ramen | Noodle Soups | Soy, Shellfish, Fish, Egg | None recorded |
| chili-vanilli | Chili Vanilli | Sweets | Soy, Milk, Peanuts, Sesame | None recorded |
| bag-o-donuts | Jo-Hé Bag O’ Donuts | Sweets | Milk, Egg | None recorded |
| korean-fried-chicken | Korean Fried Chicken | Happy Hour | Soy, Peanuts, Sesame | None recorded |
| thai-fried-egg | Thai Fried Egg | Add-ons | Egg | None recorded |

### Fresh Kitchen · Waterford Lakes

| Key | Food name | Category | Recorded positives | Explicit tracked free-from claims |
| --- | --- | --- | --- | --- |
| sweet-potato-noodles | Sweet Potato Noodles | Bases | Soy, Sesame | Milk |
| cauli-potato-mash | Cauliflower Potato Mash | Bases | Unknown / none recorded | Milk, Soy |
| coconut-ginger-rice | Coconut Ginger Rice | Bases | Unknown / none recorded | Milk, Soy |
| chard-cabbage-slaw | Chard & Cabbage Slaw | Bases | Unknown / none recorded | Milk, Soy |
| kale-caesar | Crunchy Kale Caesar | Bases | Tree nuts | Milk, Soy |
| arugula-spinach-salad | Arugula + Spinach Salad | Bases | Unknown / none recorded | Milk, Soy |
| cauliflower-rice | Seasonal Cauliflower Rice | Bases | Unknown / none recorded; Unspecified nuts | None recorded |
| brown-rice | Brown Rice | Bases | Unknown / none recorded | Milk, Soy |
| golden-chickpeas | Golden Spice Chickpeas | Vegetables | Unknown / none recorded | Milk, Soy |
| basil-mushrooms | Basil Mushrooms | Vegetables | Unknown / none recorded | Milk, Soy |
| maple-sweet-potatoes | Maple Sweet Potatoes | Vegetables | Unknown / none recorded | Milk, Soy |
| green-beans | Blistered Green Beans | Vegetables | Soy | Milk |
| lemon-broccoli | Lemon Garlic Broccoli | Vegetables | Unknown / none recorded | Milk, Soy |
| almond-chicken | Almond Baked Chicken | Proteins | Tree nuts, Egg | Milk, Soy |
| herb-steak | Herb Grilled Steak | Proteins | Unknown / none recorded | Milk, Soy |
| rosemary-chicken | Grilled Rosemary Chicken | Proteins | Unknown / none recorded | Milk, Soy |
| bbq-chicken | BBQ Chicken | Proteins | Unknown / none recorded | Milk, Soy |
| teriyaki-salmon | Teriyaki Salmon | Proteins | Soy, Sesame, Fish | Milk |
| golden-char-chicken | Golden Char Chicken | Proteins | Unknown / none recorded | Milk, Soy |
| coconut-sriracha | Coconut Sriracha | Sauces | Soy | Milk |
| white-ginger | Creamy White Ginger | Sauces | Soy | Milk |
| buffalo | Buffalo | Sauces | Unknown / none recorded | Milk, Soy |
| green-goodness | Green Goodness | Sauces | Unknown / none recorded | Milk, Soy |
| citrus-avocado | Citrus Avocado | Add-ons | Unknown / none recorded | Milk, Soy |
| toasted-almonds | Toasted Almonds | Add-ons | Tree nuts | Milk, Soy |
| pico-de-gallo | Pico De Gallo | Add-ons | Unknown / none recorded | Milk, Soy |
| cucumber-salad | Cucumber Salad | Add-ons | Unknown / none recorded | Milk, Soy |
| parmesan-cheese | Parmesan Cheese | Add-ons | Milk | Soy |
| kale-pesto-tomatoes | Kale Pesto Tomatoes | Add-ons | Tree nuts | Milk, Soy |
| feta-cheese | Feta Cheese | Add-ons | Milk | Soy |
| 3-bowl | 3 Bowl | Build-your-own bowls | Unknown / none recorded | None recorded |
| 4-bowl | 4 Bowl | Build-your-own bowls | Unknown / none recorded | None recorded |
| 6-bowl | 6 Bowl | Build-your-own bowls | Unknown / none recorded | None recorded |
| chocolate-chip-cookies | Really Good Chocolate Chip Cookies | Desserts & snacks | Unknown / none recorded; Unspecified nuts | Milk |
| peanut-butter-chip-cookies | Really Good Peanut Butter Chip Cookies | Desserts & snacks | Peanuts; Unspecified nuts | None recorded |

### Chipotle · South Orange

| Key | Food name | Category | Recorded positives | Explicit tracked free-from claims |
| --- | --- | --- | --- | --- |
| barbacoa | Barbacoa | Proteins | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| black-beans | Black Beans | Beans | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| brown-rice | Brown Rice | Rice | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| carnitas | Carnitas | Proteins | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| chicken | Chicken | Proteins | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| honey-vinaigrette | Chipotle Honey Vinaigrette | Sauces | Unknown / none recorded; Sulphites | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| crispy-corn-tortilla | Crispy Corn Tortilla | Tortillas | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| fajita-vegetables | Fajita Vegetables | Vegetables | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| burrito-tortilla | Flour Tortilla (Burrito) | Tortillas | Wheat; Sulphites | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| taco-tortilla | Flour Tortilla (Taco) | Tortillas | Wheat; Sulphites | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| fresh-tomato-salsa | Fresh Tomato Salsa | Salsas | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| guacamole | Guacamole | Toppings | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| cheese | Monterey Jack Cheese | Toppings | Milk | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| pinto-beans | Pinto Beans | Beans | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| queso | Queso Blanco | Toppings | Milk | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| red-chimichurri | Red Chimichurri Sauce | Sauces | Unknown / none recorded; Sulphites | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| roasted-corn-salsa | Roasted Chili-Corn Salsa | Salsas | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| romaine | Romaine Lettuce | Vegetables | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| sofritas | Sofritas | Proteins | Soy; Sulphites | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| sour-cream | Sour Cream | Toppings | Milk | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| steak | Steak | Proteins | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| supergreens | Supergreens Lettuce Blend | Vegetables | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| green-chili-salsa | Tomatillo Green-Chili Salsa | Salsas | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| red-chili-salsa | Tomatillo Red-Chili Salsa | Salsas | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| tortilla-chips | Tortilla Chips | Sides | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |
| white-rice | White Rice | Rice | Unknown / none recorded | Egg, Fish, Shellfish, Peanuts, Tree nuts, Sesame |

## Files

Machine-readable companion: `research/full-menu-data.json`. Source and scope metadata are included per restaurant; each record includes evidence notes and review date. No app or live data was changed.

Validation: all 24 prior short keys are present; all 110 records have unique keys within their restaurant; no positive allergen overlaps a recorded free-from claim. Every normalized Fresh Kitchen Milk/Soy claim was independently cross-checked against the explicit filled column dot.
