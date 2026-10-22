# Food chains and active menus

Tako Cheena is retired from browsing by explicit user request. Hawkers, Chipotle and Pizza Bruno are retained by the user's later instruction. `src/local-catalog.js` filters retired restaurant slugs from bundled menus and cloud results, and removes their linked dishes. Historical source JSON and saved meal notes are retained, so removal is reversible without deleting personal history.

`src/chain-brand.js` keeps brand presentation separate from food facts. It defines brand-inspired menu colors and headings for McDonald's, Taco Bell, Pizza Hut, Domino's, Wendy's and the existing Chipotle. These styles are independent Verifed views and do not imply a brand partnership. `components/Dining.js` uses the brand accent, background and wordmark for the menu header, category headings and dietary tabs. Allergen icons and navigation stay consistent across brands.

`components/Explore.js` adds All places, Restaurants and Food Chains tabs. The selected collection filters restaurants before dietary ranking, map rendering and branch grouping, so pins and cards show the same collection. Changing collection clears the cuisine selection to avoid an unrelated old cuisine hiding results. Current imported chain menus are Taco Bell and Chipotle; the four other requested chains still require menu import and source verification. Defining a visual theme does not claim a menu has been added.

Ingredient audit: the prior catalog had named ingredient descriptions for 0/49 Hawkers items, 0/26 Chipotle items and 32/68 Pizza Bruno items; these three exceptions are retained as requested. Most other menus exceed half their entries with source-reported descriptions. Named ingredients are partial descriptions, not complete recipe formulas or proof of allergen absence.

Research started with the U.S. McDonald's product/menu pages, Domino's U.S. ingredient page, Wendy's U.S. menu and Pizza Hut's U.S. nutrition/ingredient portal. McDonald's direct download returned 403 while the web reader worked. Pizza Hut's nutrition page redirected the reader to India, and the Nutritionix ingredient tool returned an access error. No overseas ingredient data was substituted. Source links are in research/FOOD_CHAINS_RESEARCH.md. Additional chain import is unfinished in this checkpoint.

The retirement regression test feeds old cloud restaurant and dish rows into the real merger and checks they cannot reappear. Existing tests still verify profile, discovery and dietary behavior. Current release evidence lists actual checks and remaining work.

V13 checkpoint: 92 tests and web/Android/iOS exports pass. Browser verified 25 active locations, the three retained venues, Food Chains yielding two brands/four locations, the Taco Bell branch picker and the purple menu header. Four new chain imports are unfinished because the five-hour usage remaining reached 4%, triggering the user stop rule.
