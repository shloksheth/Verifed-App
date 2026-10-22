# The CAC menu catalog

The mobile app now focuses on one community problem: helping diners compare local food menus against dietary needs before ordering. The public app has 20 Orlando locations and 1,063 published food records. It does not require restaurants to purchase software or manage a workspace. Scanner and kitchen-request screens are absent from the route tree.

## Data files and build scripts

`research/full-menu-data.json` holds the original three official menu catalogs. `expanded-menu-data.json` holds the 17 additions; `restaurant-locations.json` and `expanded-restaurants.json` hold their actual addresses, contacts, cuisine and source scope. `restaurant-images.json` adds credited official imagery. These are data, not hidden prompts or executable web content.

`research/import-expanded-menus.py` parses the saved official source snapshots. It uses source-specific parsers because a Wix menu, a Toast ordering menu and a designed PDF have different structure. It normalizes food names and categories, preserves descriptions, collapses exact promotional duplicates, and distinguishes real dietary badges from ordinary ingredient text. The importer never evaluates page JavaScript: Pig Floyd's data literal is read as JSON after converting its object keys. Manually transcribed designed-menu facts remain visibly grouped in the importer and retain their source URLs.

`research/build-menu-catalog.mjs` joins the reviewed sources. It checks duplicate keys, requires a nonempty menu and scope description for each restaurant, validates canonical allergens and dietary tags, and rejects contradictory source-positive/free-from claims. It generates `src/restaurant-menus.js` and `src/restaurant-locations.js`. Edit the reviewed JSON, then rerun the generator; do not hand-edit generated modules.

`src/local-catalog.js` adapts records to the shared dish contract. Stable catalog keys preserve favorites and history while real database UUIDs replace offline text IDs. Restaurant source scope is preserved, rather than assuming every restaurant is a chain. Menu components remain explicitly identified. Missing prices stay unknown. Cloud rows recompute ingredient clues using the current dictionary, so an older derived clue cache never controls a newer release.

## How ingredient reasoning works

`src/ingredient-hints.js` is a small, readable ingredient dictionary. It reads the published name, description and ingredient text. Named cheddar, milk, egg, salmon, shrimp, almonds, peanuts, tofu and sesame produce recognizable ingredient-category clues. Common recipes such as bread, aioli or pesto produce possible flags that still need confirmation. This does not manufacture a restaurant declaration or an absence claim.

The cleaning steps handle plant substitutes, coconut/oat milk, rice flour, eggplant, buckwheat and optional additions so they do not inherit the wrong animal or wheat flag. Explicit vegan labels prevent an imitation chicken or cheese from inheriting an animal ingredient's flag. Positive reported allergens still win if a source is contradictory. The dictionary is deliberately incomplete; unfamiliar recipes stay unknown.

The return object has `allergens`, `possibleAllergens`, `restrictionConflicts` and readable `clues`. Animal ingredient clues also flag vegetarian/vegan conflicts; common flour dishes flag gluten-free conflicts unless an explicit gluten-free label is supplied. Vegan labels can satisfy Vegetarian as a logical dietary relationship. They never become Milk-free or Egg-free allergy claims.

`src/menu-filter.js` combines reported positives and ingredient flags before checking explicit absence claims. “Restaurant-reported matches” still require evidence for every selected need. “Possible options” displays foods with no identified conflict and remains expanded initially. It does not mean those foods are proven free of the selected allergen. The full menu retains every source record, including flagged items, with symbols and explanatory text.

`src/domain.js` uses the same clues for dish-detail assessment and ranking. Flavor ratings never override a dietary flag. `components/AllergenIcons.js` distinguishes restaurant declarations from ingredient clues with a dagger, and labels recipe possibilities as “Check ingredients.” The dish detail explains exactly which published word triggered each clue.

## Backend and evidence

`research/seed-orlando.mjs` writes reviewable SQL in optional per-restaurant batches. Postgres assigns real UUIDs; stable catalog keys let repeat imports update existing records. Real locations remain unconnected and unconfirmed. No schema or access-policy expansion was needed. `research/verify-orlando.mjs` pages through the public REST API and compares all 1,063 source records, UUID relationships, allergen/provenance data, addresses and image metadata. It checks beyond the API's 1,000-row response limit.

The mobile API already reads all catalog pages in stable ID order. Source snapshots, image checks and district responses support the import; none establishes current stock, cross-contact procedures or an actual meal's safety. Full published food coverage is disclosed for each restaurant, including omitted drinks, specials and modifier trees. The source table is in research/TWENTY_RESTAURANTS_SOURCES.md.
