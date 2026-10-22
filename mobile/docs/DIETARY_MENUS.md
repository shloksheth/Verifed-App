# Two restaurant menus

## What the two views mean

The restaurant screen has Full menu and For my diet views. Full menu preserves the restaurant's food categories and includes labeled allergen icons. For my diet uses the person's selected allergies and dietary restrictions. It does not require every item to exclude all nine major allergens.

The personalized view separates restaurant-reported matches from items needing confirmation. Reported and ingredient-based dietary flags are excluded from that view's matching section. Possible options remain visible initially, so incomplete source labels do not leave the personalized menu blank. If a restaurant has no supported matches, the app explains the evidence gap instead of filling the menu with guesses. With no needs selected, it asks the diner to choose them.

This is ingredient-source matching, not a certification of an actual prepared meal. Cross-contact, substitutions and branch availability still require restaurant confirmation. Components remain individually labeled; a qualifying rice or sauce is not a qualifying complete bowl.

## Following the code

`src/menu-filter.js` contains the pure matching rule. First it reads selected allergies and restrictions. It finds reported positives and ingredient-based flags before checking any absence claims, so a contradictory free-from label can never override a reported allergen. Then it checks every selected allergy against `provenance.freeFromAllergens` and every selected restriction against the item's dietary tags. A Vegan tag can also satisfy Vegetarian; this logical dietary relationship never creates an allergy-absence claim. Missing support yields unknown; complete support yields a restaurant-reported match. Empty needs yield unset. Taste preferences do not affect this decision.

`provenance.coverage` describes the categories a source discusses. It is deliberately different from `freeFromAllergens`, which contains only explicit ingredient-absence claims. A blank matrix cell, a missing ingredient list or a vegan tag never becomes a milk-free claim. Generic nut-free wording is retained as source wording rather than silently expanded into separate peanut and tree-nut guarantees. Gluten-free remains a dietary tag and does not automatically mean wheat-free.

For example, a component explicitly labeled dairy-free and soy-free can match Milk + Soy requirements. Adding Sesame requires separate supporting evidence. A positive Soy declaration would instead make the same request a conflict, regardless of an inconsistent soy-free field. Tests exercise each of these branches.

`groupMenu` preserves the original section and item order. It returns category/dishes pairs without changing the input array. `components/Dining.js` uses these groups for the restaurant menu and keeps the full catalog available alongside the personalized view. `components/AllergenIcons.js` supplies the shared visual labels and legend; the icons have readable names and accessibility labels so color or shape alone is never required.

Ingredient-derived tokens have a dagger and separate explanatory legend; common recipe possibilities say Check ingredients. The CAC catalog chapter explains the ingredient dictionary.

`AllergenGlyph` chooses a small drawing with a switch on the canonical allergen name. SVG uses a 24-by-24 coordinate space; paths describe moves, lines and curves, while Circle, Ellipse and Rect provide simple shapes. A shared group applies the outline color and stroke style. This is scalable native drawing code, not a font character or downloaded allergen image. `AllergenToken` pairs that drawing with text and an accessibility label. Source-worded declarations outside the nine categories use a separate generic declaration symbol. `hasUnknownAllergenCoverage` checks which tracked categories the source covers; it never interprets blank cells as absence.

Restaurant themes change the accent color and wordmark while keeping the same menu structure. `MenuSections` renders category headings, fine dividers, prices when known and tappable item rows. Full menu and Possible options show unknown coverage. The strictly matched section instead lists exactly which selected needs the restaurant supports, retaining any other positively declared allergens. Its section note makes clear that the match only covers the selected needs; missing information about other allergens is not a failure of the selected-needs match. This keeps the two kinds of uncertainty distinct without claiming food is certified safe.

`App.js` passes an optional returnTo query value into `ProfileEditor`. `components/Account.js` accepts only a restaurant route matching the internal route pattern, then returns there after a successful profile save. Navigation's unwind option removes the saved editor and duplicate restaurant routes from the back stack. Back then returns to the screen before the restaurant, rather than reopening the saved form. Other entry points still return to the profile page.

## Source and backend updates

The published food catalogs are built from official menus and their linked allergen documents. Missing branch-specific prices remain null. Menu formats such as a customizable bowl cannot inherit the absence claims of one component. Published-source coverage and omitted sections are disclosed beside the menu; an unavailable item or an entire local branch menu is never invented.

Stable catalog keys preserve existing database UUIDs, favorites and history. The source import updates public records, while restaurant connection flags remain false. The existing seed and REST verification scripts apply and check the source-backed facts. Current app docs record the exact included menus and verification results.

## Verification

`tests/menu-filter.test.js` covers all-selected-needs matching, contradictory claims, unknown evidence, unset requirements and section ordering. Catalog tests check that source declarations, ingredient evidence and current district records stay intact. Browser checks exercise both menu tabs, preference editing/return, the unknown section, allergen legends and small-screen layout. Native bundle export and a published simulator launch supplement these checks.


V11 removes repeated warning paragraphs and per-row missing-needs prose. The compact Details badge and Possible options group remain; source evidence is available through the dish’s collapsed Source details section.
