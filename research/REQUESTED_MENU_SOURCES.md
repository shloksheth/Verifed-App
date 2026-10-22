# Requested restaurant additions

Reviewed October 21, 2026. This is a source inventory for the Verifed CAC prototype, not a live ordering feed. Restaurant confirmation and current cross-contact procedures remain unknown.

| Location | Food records | Coverage |
|---|---:|---|
| Woodlands Indian Cuisine, Orlando | 100 | Every numbered food entry in the official six-page Orlando PDF; nine beverages omitted |
| Bombay Street Kitchen, Orlando | 84 | Every food tab of the official website, including desserts and shaved-ice treats; beverages and alcohol omitted |
| Yellow Dog Eats, Gotha | 57 | Main food menu, kids, sides, queso add-ons, rib sizes and all six happy-hour bites |
| Taco Bell, South Orange Avenue | 116 | Shared national published food catalog, including components, breakfast, group meals and combos |
| Taco Bell, East Colonial Drive | 116 | Same national template; this is a separate verified branch |
| Taco Bell, Orlando West Drive | 116 | Same national template; this is a separate verified branch |

There are 357 distinct food/component records across the four restaurant concepts and 589 location-linked records after copying the Taco Bell template to three selectable branches. A combined choice line is counted once. Small/large Yellow Dog Eats sides remain one record, while the two explicitly offered rib sizes have separate records.

## Woodlands: the Orlando restaurant

- [Official Orlando PDF](https://www.woodlandsusa.com/images/Orlando.pdf)
- [Official public HTTP copy actually read](http://www.woodlandsusa.com/images/Orlando.pdf)
- [Official contact page](https://www.woodlandsusa.com/contact-us.php)
- [Official homepage, public HTTP](http://www.woodlandsusa.com/)

Address: **6040 S Orange Blossom Trail, Orlando, FL 32809**. Phone: **407-854-3330**.

The PDF is a six-page scanned image menu. Its text was OCRed locally, then all six rendered pages were visually checked. The inventory includes appetizers 1-16, soups 17-19, dosai 20-34, uthappam 35-40, house specialties 41-46, thali 47-49, curry plates 50-65, pullavs 66-73, Chinese specialty 74-80, breads 81-87, sides 88-92 and desserts 93-100. The dosai category's samber and chutney accompaniment is retained. The restaurant explicitly describes its food as vegetarian and asks guests to tell the server about allergies.

The HTTPS endpoint has an expired/untrusted certificate in this environment. No certificate validation was disabled. The restaurant's public HTTP URL served the PDF successfully, so the primary menu link in metadata and all food records uses that actual public HTTP URL. It is a plaintext public menu source, not a place to send passwords, account credentials or private customer information. The failed HTTPS URL is retained in the source list for provenance; it may still fail until the restaurant repairs its certificate.

**Disambiguation:** `woodlandskitchen.com` belongs to a Chatsworth, California restaurant. None of that menu was imported into Orlando. No vegan, gluten-free or allergen-free declaration is inferred from Woodlands being vegetarian.

Official image: [Masala dosai](http://www.woodlandsusa.com/images/slider_04.jpg), identified by the homepage image's alt text. Credit: Woodlands USA. The HTTP restriction also applies to this source image; a local app asset is preferable to an insecure remote image request.

## Bombay Street Kitchen

- [Official menu](https://bombaykitchenorlando.com/menu/)
- [Official contact and embedded business map](https://bombaykitchenorlando.com/contact/)
- [Official homepage](https://bombaykitchenorlando.com/)

Address: **6215 S Orange Blossom Trail, Orlando, FL 32809**. Phone: **407-240-5151**, from the contact page's telephone link.

Food tabs captured: Halka Phulka, Asian, Tandoor, Dakshin Se, Bigger Plates, Vegetarian Curry, Bread, Non-Vegetarian Curry, Biryani, Dessert and Gola Station. The Gola Station's Kachi Keri Margarita is explicitly described as a **virgin** shaved-ice item. No alcoholic cocktail inventory is included.

The website combines some breads or protein choices on a single line. Those choices are retained as published, rather than inventing separate ingredient formulas. Examples include “Naan/Butter Naan,” “Garlic Naan Chili Naan,” “Chicken Tikka Masala/Butter Chicken,” and “Shrimp/Fish Malabari.” A user must clarify their exact choice with the restaurant. The Vegetarian Curry category and the explicitly described vegetarian Himalayan soup receive a source-backed Vegetarian tag. Other classifications remain available to the app's separately labeled ingredient reasoning.

The contact page embeds Google Maps for this exact business. Its embedded map response pairs **28.4668339, -81.3962492** with the restaurant's exact address and telephone. This is recorded as `coordinates` with `coordinatesSource` pointing to the restaurant's contact page. It is not evidence of a Congressional district assignment.

Official image: [Menu photograph](https://bombaykitchenorlando.com/wp-content/uploads/2025/10/RG32209-scaled.jpg). The website's image metadata credits **Roberto Gonzalez**. The record retains that credit. The image is a restaurant menu photo; it is not assigned to an unverified individual dish.

## Yellow Dog Eats: Gotha only

- [Official lunch/dinner page](https://yellowdogeats.com/lunch-dinner-menu/)
- [Gotha main menu PDF, revision 090925](https://yellowdogeats.com/wp-content/uploads/2025/10/YDE_Gotha_Main_Menu_090925.pdf)
- [Gotha happy-hour PDF, revision 11-25](https://yellowdogeats.com/wp-content/uploads/2025/11/YDE_Gotha_Menu_Happy_Hour_Menu-11-25.pdf)
- [Official contact page](https://yellowdogeats.com/contact/)

Address: **1236 Hempel Avenue, Gotha, FL 34786**. Phone: **407-296-0609**.

The original Gotha menu is distinct from New Smyrna Beach. The two-column main PDF was read by category, preserving its dish/ingredient relationships. Its food record includes the full main food inventory, three queso Flavor Bomb add-ons, six Scooby Snacks sides and all five kids entries. An explicitly offered **“Vegan without the chicken”** version of Are You Chicken? is its own record. The fruit and nut blend remains in that version; vegan does not mean nut-free. The three dishes under the menu's Vegetarian heading receive Vegetarian tags.

Happy-hour bites are **Monday-Friday, 3-6pm only**: Tika Bites, Pimento Spread, Cheesy Jalapeno Bread, Mini Nachos, Bacon Cheese Burger Dip and Slider Trio. This time limitation is carried in each description. Daily social-media specials, drinks and New Smyrna dishes are excluded. The presence of “Fish's Gold” in a sauce name is a brand/person name and does not by itself establish a fish ingredient.

Official image: [Gotha logo](https://yellowdogeats.com/wp-content/uploads/2026/07/yde-gotha-logo.webp). This is explicitly a logo, not a fabricated food or exterior photo. The homepage's New Smyrna Beach hero photo was not mislabeled as Gotha.

## Taco Bell: national template and three real branches

| Branch | Official address | Official telephone | Locator |
|---|---|---|---|
| South Orange | 2474 S Orange Ave, Orlando, FL 32806 | 407-481-9341 | [Official branch](https://locations.tacobell.com/fl/orlando/2474-s-orange-ave-.html) |
| East Colonial | 4225 E Colonial Drive, Orlando, FL 32803 | 407-487-4197 | [Official branch](https://locations.tacobell.com/fl/orlando/4225-e-colonial-drive.html) |
| Orlando West | 2600 Orlando West Dr, Orlando, FL 32808 | 407-292-6072 | [Official branch](https://locations.tacobell.com/fl/orlando/2600-orlando-west-dr.html) |

These branch addresses and phones are official locator facts. All three use `chainId: "taco-bell"` and `chainName: "Taco Bell"`. **The food menu is the national template, not a verified live branch inventory.** No branch order was placed. Breakfast, limited-time promotions, stock, pricing and participation can differ.

Menu sources:

- [Main menu](https://www.tacobell.com/food)
- [Tacos](https://www.tacobell.com/food/tacos), [burritos](https://www.tacobell.com/food/burritos), [specialties](https://www.tacobell.com/food/specialties)
- [Vegetarian catalog](https://www.tacobell.com/food/vegetarian)
- [Breakfast](https://www.tacobell.com/food/breakfast), [quesadillas](https://www.tacobell.com/food/quesadillas), [nachos](https://www.tacobell.com/food/nachos), [bowls](https://www.tacobell.com/food/bowls)
- [Snacks, sweets and sauce components](https://www.tacobell.com/food/snacks-sweets)
- [Cantina Chicken](https://www.tacobell.com/food/cantina-chicken-menu), [boxes/combos](https://www.tacobell.com/food/boxes-and-combos), [groups](https://www.tacobell.com/food/party-packs)
- [Featured](https://www.tacobell.com/food/featured), [online exclusives](https://www.tacobell.com/food/online-exclusives), [Luxe Value Menu](https://www.tacobell.com/food/luxe-value-menu)
- [Official allergen-information page](https://www.tacobell.com/nutrition/allergen-info)

The category pages' published server-rendered product data provided product codes, names, URLs, official images and the `hasAVA` vegetarian marker. Product codes were deduplicated across categories. Other category cards were verified through the web reader. Drinks and drink-only kits are excluded. Menu cards are used as the inventory authority; older editorial examples that are absent from the actual cards are not added as current available products.

Ingredient-bearing product-detail pages supplement the inventory. Their “What's Included” components are **positive evidence only**; some omit the shell or bread, and none provide a complete supplier-level recipe here. Captured component phrases and descriptions remain incomplete. Customizable combo names are retained without inventing the user's drink, side or protein choice.

AVA vegetarian permits dairy and eggs. Taco Bell states that vegetarian/meat ingredients share preparation areas and may share frying oil. It also warns that cross-contact with allergens can occur. The dynamic allergen page did not expose a complete matrix that could be reliably transcribed, so the inventory **does not declare allergens absent**. Product photos are Taco Bell's official national product images and are not presented as branch photos.

## How the files work

`requested-restaurants.json` supplies six real location records. The `key` joins each location to `requested-menu-data.json`. `chainId` groups the Taco Bell choices while preserving distinct addresses. `fictional: false` means the restaurant exists; `confirmed: false` means the restaurant has not personally verified this prototype's dataset.

`requested-menu-data.json` contains the source inventory. Every item carries its category, menu-listed ingredient phrases, source URL, review date and evidence note. Unknown allergen absence is represented by empty `coverage` and `freeFromAllergens` arrays, **never by a claim that the dish is safe**. `informationComplete` and `availabilityVerified` remain false. Explicit Vegetarian/Vegan tags are distinct from the app's inferred ingredient clues.

The review snapshots and readable inventory-builder script are in `research/menu-sources/`. The builder first reads the reviewed food sources, then normalizes item keys, then deduplicates the Taco Bell template, then checks key joins and duplicate item keys before writing the JSON. It does not call a backend, change customer data or query a hidden ordering API.

Validation performed: all six metadata keys match menu keys; every item key is unique within its location; Woodlands has exactly 100 food entries; no item receives invented allergen-absence coverage; all three Taco Bell copies share the same item inventory; source URLs and credits are retained.
