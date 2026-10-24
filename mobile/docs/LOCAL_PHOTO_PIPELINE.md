# Local menu photographs

This migration is in progress. `research/local-photo-coverage.json` is the current count, and `research/local-photo-manifest.json` records one decision for every active menu entry. A successful download is never a visual approval. Unfinished items still use the existing remote-photo behavior; the app is not yet an all-local image release.

## User clarifications, 24 October 2026

Where restaurants omit full ingredients or serving quantities, generate a realistic illustration from the published dish description. A reasonable illustrative portion is permitted; do not invent restaurant-confirmed weights or recipe details. `GENERATED_FOOD_IMAGES.txt` is the user's simple list of approved generated images. Existing internal provenance is retained.

Food chains have one shared product menu, with locations selected separately. An identical chain product can share one local image across its locations; this is an intentional reuse, unlike assigning the same photo to different dishes. Each chain should retain its own menu layout and visual styling. V16 implements shared Taco Bell product photographs, while retaining each branch's own location record. Different dishes still cannot reuse a final image.

## Featured menus for the demonstration

The immediate goal is five complete food-image menus, with three preferred menus for the video. `mobile/src/featured-menus.js` puts Fresh Kitchen Waterford Lakes, Chipotle and Loving Hut Orlando first, followed by Taco Bell and Hawkers. Home uses their stable slugs, so database UUIDs cannot reorder or break these links. The rest of the catalog remains available and unfinished image coverage is still reported honestly.

The same file maps each featured menu's banner to an existing reviewed local item image. `RestaurantPhoto` uses that bundled image on Home and restaurant pages, preserves the whole food with `contain`, and labels it as a menu example with the correct photo or illustration credit. The seven featured-location banner mappings, including the Taco Bell branches, require no additional image files or external image requests.

`mobile/src/local-photo-key.js` maps identical Taco Bell products at East Colonial and Orlando West to the South Orange product's reviewed image. It compares name, description, ingredient list and item kind. If a live product's recipe or name changes, it returns that product's original key and refuses the shared image. Both menu renderers use this resolver. `build-local-food-assets.mjs` records `sharedPhotoFrom` only when the source image is actually approved; it does not fabricate another visual review or copy another WebP file. The verifier reports individually approved images and shared menu entries separately. The original duplicate-image check still applies to different products.

`research/verify-featured-menus.mjs` checks that every imported entry in all five selected menus has an approved local image file. It writes `research/featured-menu-readiness.json`, which also reports published ingredient-text coverage and unconfirmed major-allergen coverage. The preferred three contain 122 entries; all five contain 287. Chipotle's imported menu is a standard-component inventory, not an exhaustive current ordering menu. Photo completeness is separate from ingredient completeness. `mobile/tests/featured-menus.test.js` checks all featured entries, all 232 chain aliases, refusal of changed recipes/names, stable navigation when database IDs change, and source-linked ingredient facts without unsupported allergen absence.

The V16 images complete the Diablo Ranch slider, steak curry, shrimp curry, fried egg, two Lo Mein variants and jalapeno cup. The Lo Mein images use named Hawkers chain products photographed at other branches, with source branches retained in provenance. The small official jalapeno photo retains its native detail. V17 completes Loving Hut's 12 remaining entries and Chipotle's 12 remaining components: 23 generated illustrations and one matching real green-salsa photo. Each final optimized WebP was viewed before approval. `GENERATED_FOOD_IMAGES.txt` lists all 76 approved generated illustrations.

`research/menu-sources/chipotle-featured-evidence.json` records two ingredient descriptions read from U.S. primary sources: cultured cream and the three-leaf Supergreens mix. `research/update-featured-menu-ingredients.mjs` applies only those facts to the reviewed JSON and this checkout's generated menu module. Rerunning it does not duplicate evidence notes. The photo specification was refreshed before approving those images. `local-catalog.js` passes the source URL to `Dining.js`, which offers an ingredient-source link in dish details. These facts do not establish complete ingredient lists for other components or remove unconfirmed allergens.

Screen testing found that an old cloud row's empty ingredient list hid the new facts. `mergeLocalCatalog` now fills an empty live list from reviewed bundled ingredients and carries the corresponding ingredient-source details. It preserves nonempty live ingredients, descriptions and existing source information. `local-catalog.test.js` reproduces both cases and checks that declared milk still conflicts. No database record is rewritten by this fix.

## How an image reaches the app

1. `research/prepare-local-photo-review.mjs` reads the current catalog and published menu records. It stores each item's name, description, ingredients, explicit serving size, source menu and recipe hash. A changed recipe clears its previous approval.
2. `research/discover-official-photo-candidates.py` reads official menu HTML and records images whose alternative text matches an item name. This only discovers candidates. It does not infer ingredients or approve a match.
3. `research/download-photo-candidates.py` downloads candidates, decodes them with Pillow, preserves transparency, limits dimensions to 1,200 pixels and saves WebP files in the ignored review cache. It records file and pixel hashes. An approved selected image is not silently replaced by a later download.
4. `research/photo-review-sheets.py` creates labeled contact sheets for visual comparison. Inspect the actual food, recipe, portion, framing and resolution. If no accurate real photo is immediately available, record a search and visually compare at least four actual candidates. A search result title alone is insufficient.
5. When generation or reconstruction is necessary, `research/register-generated-photos.py` accepts a JSON list with `catalogKey`, `prompt`, `sourceFile` and an optional `referenceFile`. It converts the output to WebP and records the full prompt, generator, time, original hash and reference identity. It leaves the result unapproved. Inspect the optimized WebP before entering a decision in the manifest.
6. `research/build-local-food-assets.mjs` promotes only entries with all five visual checks passed, a selected candidate, dated notes and unchanged source bytes. It rejects stale recipes, contextual/representative sources and repeated pixel content. It copies final files into `mobile/assets/food/<restaurant>/<item>.webp` and writes the two app registries.
7. `research/verify-local-food-images.py` decodes every approved final WebP again, checks dimensions, hashes and duplicate pixels, and updates the coverage report. `--require-complete` also fails if even one active entry remains unapproved.

`research/register-researched-candidates.py` accepts a JSON list of item keys, queries and source candidates. It records real downloaded search alternatives with an initial inspected count of zero. Update that count only after actually comparing them, and retain reasons for rejection.

`research/register-browser-photo-candidates.py` imports only explicitly observed item/image associations from a Browser Use asset bundle. `research/browser-photo-observations.json` stores the item name, image filename and menu page that were visible together. The importer checks the catalog name, picks the largest observed responsive image and converts it to WebP without approving it. It copies no browser history, cookies, analytics requests or raw browser bundle metadata into the repository. `research/wpbc-official-high-resolution.json` records larger image URLs read from the same menu's actual `srcset` attributes. A named link can still contain a generic or repeated photo, so visual review remains necessary.

Use `--latest-candidate` with the review-sheet tool to inspect the most recently registered image for each item. `--item` shows all downloaded alternatives for a single entry. Neither option grants approval.

## Runtime files

`mobile/src/local-food-assets.js` contains static `require` calls. Metro needs these static paths to package images on iOS, Android and web. Do not replace them with constructed strings.

`mobile/src/local-food-photo-metadata.js` contains local paths, alternative text, credits, dimensions, hashes and a generated-image flag. External source URLs and full prompts stay in the internal research manifest, rather than being requested to display an approved image.

`mobile/components/Dining.js` and `mobile/components/TacoBellMenu.js` prefer an approved local asset and its metadata. `mobile/components/MenuImage.js` uses Expo Image on native iOS/Android and React Native's browser Image on web, where browsers decode WebP directly. The native dependency is loaded lazily: Snack's web bundler otherwise fails during Expo Image asset-registry initialization. The wrapper maps `contentFit` to browser `resizeMode`, so `contain` preserves full-food framing on each platform. General menu cards identify generated illustrations. Unapproved entries retain legacy behavior until their replacements pass review; this checkpoint does not claim that those images meet the new requirements.

`mobile/package.json` and its lockfile pin the Expo SDK 54 compatible `expo-image` dependency selected by `expo install`. No Expo SDK upgrade was performed. Image support is documented at https://docs.expo.dev/versions/latest/sdk/image/.

`research/native-tools/assets.mjs` recursively lists supported image assets and their MIME types. `research/native-tools/publish.mjs` uses that list to upload WebP assets to Snack and records their hashes. It previously included only the logo. Publishing is separate from visual approval.

V17 also fixes a publishing failure: Snack's SDK can finish waiting with an individual upload error, then omit that error while saving. The publisher now uploads missing assets in batches of eight with at most three attempts, rejects unfinished files or file errors, and checks uploaded bytes before saving. `research/native-tools/uploads.mjs` contains these checks and can reuse an already-uploaded content-addressed Expo object only after its SHA-256 matches the local image. A missing object follows the normal SDK upload path. The two focused regression tests reject failed uploads and an HTTP 200 response containing incorrect image bytes. These checks complement the separate download comparison; a saved ID alone is still insufficient evidence.

`research/native-tools/dependencies.mjs` preserves existing `~` or `^` ranges when preparing Snack dependencies. Numeric Expo package versions receive the expected compatible range. This avoids turning the installed `~3.0.11` Expo Image version into an invalid `~~3.0.11` range. The publication test covers this regression. Existing framing tests in `batch1-rest-photo-audit`, `official-menu-photo-expansion` and `photo-framing-coverage` now check Expo Image's `contentFit` property.

## Reproduce the checks

Run from the repository root:

```powershell
node research/prepare-local-photo-review.mjs
node research/build-local-food-assets.mjs
python research/verify-local-food-images.py
npm test --prefix mobile
python research/verify-local-food-images.py --require-complete
```

The last command is the completion gate and must fail during an incomplete migration. `mobile/tests/local-food-assets.test.js` checks inventory parity, unchanged approved bytes, provenance, uniqueness, registry consistency and renderer wiring. `mobile/tests/snack-assets.test.js` checks that Snack's upload inventory includes every final asset.

`research/verify-exported-food-assets.py <export-directory>` compares each final source image's SHA-256 with actual Android, iOS and web export files. `research/local-photo-export-validation.json` stores the result and registry hash. This checks packaging correspondence, not physical-phone behavior or unfinished catalog entries.

After saving Snack, `research/verify-snack-snapshot.py` downloads that exact published snapshot and compares every application file and image byte for byte with this checkout. It also checks the publisher's image hashes and writes `research/local-photo-snack-validation.json`. It does not treat a returned Snack URL as proof that all files uploaded correctly.

If Snack's download service is unavailable, the script records the HTTP failure and exits unsuccessfully. V15's download returned HTTP 503 twice; its saved URL is available, but byte-for-byte verification of that remote snapshot remains unconfirmed. Local exports were verified separately.

V17's final Snack is `xoqR-YOqjOb1zGRZlCfwU`. Its uploaded assets matched all 357 local image hashes, and its actual web runtime displayed Home and Loving Hut with the No errors indicator after the MenuImage compatibility fix. The final local web export loaded all 287 featured item images again with zero failures. The remote ZIP endpoint still returned HTTP 503, so the full saved-source download comparison remains unconfirmed. `research/snack-v17-publication-attempts.json` preserves the earlier failed snapshot IDs and the observed reasons for replacing them. No physical iPhone test is claimed.

For a specific review sheet:

```powershell
python research/photo-review-sheets.py loving-hut-orlando --item loving-hut-orlando-curled-island-5-pieces
```

Candidate caches and rejected generated drafts are ignored by Git. Approved outputs are committed under `mobile/assets/food/`; their source and generation records remain in the manifest. Rejected drafts must not be counted as finished images. Recipe details or serving quantities absent from a menu remain unknown; a photograph cannot prove hidden ingredients or allergen safety.
