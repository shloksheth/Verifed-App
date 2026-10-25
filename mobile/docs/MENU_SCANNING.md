# Menu scanning — V24

The Scan tab now has a brown capture panel, gold camera action, neutral paper/camera geometry, cream menu paper, burgundy restaurant title, green dietary panel and a tan photo rail. It uses the existing Clash Grotesk faces and five-tab navigation. There is no restaurant menu image, source-page link or known menu result before a photo is selected. Saved menus are real owner-scoped records, never example rows.

## What the app actually does

A successful camera capture or photo selection opens an authored 23-dish Sayola dinner menu. This remains a deliberately fixed presentation: **there is no OCR, AI image analysis or live translation**. Any valid photo produces the same result. The selected photo is genuinely resized to at most 2000 pixels, normalized to JPEG and retained in memory for review/rotation; it is not sent to a provider. Canceling leaves the current draft intact. No artificial scanning delay was added. The UI has no demo badge, as requested; implementation scope is documented here.

The user's supplied image is preserved at `research/menu-sources/sayola-dinner-upload.png`. `research/fixed-menu-source.json` records its hash and the optimized `assets/scan/sayola-menu.webp`. The source already contains English descriptions and Spanish/English dish names. Only the Spanish names are translated. The Original menu tab preserves the source names and English descriptions; it does not invent a Spanish original. All 23 prices and the printed GF/V/VG marks are retained. Printed symbols are not converted into complete allergen declarations.

## How the related files work

- `src/sayola-menu-data.js`: readable authored records for 19 hot tapas and four cold tapas. Each has a stable ID, original/English names, descriptions, price, category and printed labels. `research/menu-sources/sayola-transcript.json` is the reviewed data used by the transcript regression test.
- `src/fixed-spanish-menu.js`: creates a fresh Sayola object on every capture. It clones item labels and tags so correcting one draft cannot mutate another. `menuAfterPhoto(photo)` pairs that fixed object with the actual prepared photo. `src/legacy-spanish-menu.js` retains the earlier 2cero7 transcript and its historical tests; saved old menus still open with their own source page.
- `components/MenuScanner.js`: owns the picker, errors, selected language, category, search and dietary view. It loads/saves/deletes menus through the existing owner-scoped library, opens original-page and actual-photo sheets, and edits item text. Reset/new scan clears transient filters and sheets. A source link renders only when a supported menu exists. The original page has an explicit aspect ratio and 100% image dimensions to prevent native/web intrinsic-image overflow.
- `components/ScanDesign.js`: presentation-only capture panel, labeled tabs, four dish-illustration cards and readable dish rows. `scanColors` contains the scoped brown/cream/gold palette. It uses Ionicons and the existing text wrapper; no extra fonts or animation dependency.
- `src/scan-view.js`: pure helpers for stable category keys, filtering and supported original-page IDs. Category keys stay English internally so changing display language preserves the selection.
- `src/scan-dish-assets.js`: exact local image mappings for four dishes. No generic fallback or image for a different dish. The rail filters with the current results and disappears after manual menu edits, avoiding mismatched artwork after a recipe/name correction.
- `App.js`: tints only the Scan route's root/status/header surfaces. The owner-tagged draft remains above screen remounts so editing dietary settings does not discard the menu.
- `components/Home.js`: replaces the earlier Spanish-menu thumbnail with a neutral scan icon, centered in the existing paper thumbnail. Home does not expose the fixed source before capture either.
- `src/ingredient-hints.js`: adds conservative wheat-recipe clues for croquettes/empanadas. They remain possible flags, not restaurant-confirmed ingredient lists. Existing explicit egg, milk, shellfish and garlic/onion checks continue to work despite printed GF/V labels.

`For my diet` removes identified ingredient conflicts and translations awaiting review. It does not establish unlisted ingredients or cross-contact. The empty profile state directs people to settings. Written menu notes and a single filtering explanation remain near the bottom.

## The four pictures

The rail uses four **generated recipe illustrations**, not actual restaurant photos: patatas bravas, garlic shrimp, ham croquettes and Spanish omelet. `docs/SAYOLA_GENERATED_IMAGES.txt` lists them for the owner. Full prompts, original/optimized hashes, portion assumptions and visual-review notes are in `research/sayola-illustration-provenance.json`. The UI calls this rail “Dish illustrations.” All four are local optimized WebP files in `assets/scan/sayola/`; other dishes keep their full menu text without unrelated photo fallbacks.

## Checks and limits

`tests/sayola-menu.test.js` checks the 23-record transcript, independent copies, category/language/search behavior, named ingredient exclusions, corrected prices and the four distinct WebP/provenance hashes. Existing library/correction tests remain. `research/verify-fixed-menu-assets.py` verifies the supplied menu's exact bytes in all exports; `research/verify-scan-illustrations.py` does the same for the four illustrations. Existing food/font/Home asset validators are retained.

Browser testing and iOS/Android exports do not prove camera permissions, native gestures or physical iPhone rendering. No iOS simulator is available on this Windows host. The existing Medium_Phone_API_36.1 Android emulator was booted with Expo Go and the local checkout: the capture page, supplied-photo picker, 23-dish result, card rendering, category/original-name switching and save to My menus passed. Details: `research/runtime-v24-qa.json`. Physical iPhone camera/permissions, enlarged type and remote Snack runtime remain separate checks.

---

## Historical implementation notes (through V20)

# Menu scanning screen — V20

## Current fixed-menu presentation

At the user's request, any successful camera capture or photo selection opens the same 15-dish English translation of the real 2cero7 Spanish menu. There is no live OCR, AI extraction, image recognition or translation request. The interface has no sample/demo badges; this document and source metadata retain the actual implementation scope. Canceling the picker preserves the existing draft; invalid images and permission failures still produce errors.

`src/fixed-spanish-menu.js` contains the Spanish transcription, reviewed English translation, categories, set-menu offer, drink/bread/coffee notes and general allergen symbol key. `fixedSpanishMenu()` makes a fresh object each time. `menuAfterPhoto(photo)` retains the actual normalized photo alongside that fixed object. These functions never derive text from the photo. A new scan resets search, language and diet view, discards earlier corrections and opens English. Save/reopen keeps corrections. The legacy V19 `spanishSample()` remains for its existing tests and saved data compatibility; the current UI does not open it.

The menu comes from page 1 of [the restaurant's published PDF](https://www.2cero7restaurant.com/wp-content/uploads/cartas/carta-menu-2cero7-restaurant.pdf). Page 2 is Catalan and is not used. `research/menu-sources/2cero7-spanish-page.txt` is extracted source text. `research/fixed-menu-source.json` records the original PDF hash and deterministic rendering/conversion. `assets/scan/2cero7-spanish-menu.webp` is the bundled black-and-white source-page preview. It is not generated artwork. The separate high-resolution PNG in the workspace's `outputs/spanish-menu-print` folder is the printable handout.

The printed prices are a 25€ set menu reduced to 20€ with a promotion, 18€ when selecting a single dish, and a 5€ beef-entrecôte supplement. Individual dish prices are not invented. Language toggling changes the supplement's wording, not its currency or amount. A manual price correction replaces both language versions. The printed “½ water / ½ house wine” drink shorthand stays literal because no unit is specified. The general 14-allergen symbol legend is displayed as a key only; it is never assigned to dishes as an ingredient declaration. Dietary matches use recognizable English text and do not establish unlisted ingredients or cross-contact.

`components/MenuScanner.js` contains the actual photo picker, normalized JPEG preview/rotation sheet, original-page sheet, English/Spanish toggle, category list, search, dietary-profile return path, item corrections, and local save/reopen/delete. The fixed response is immediate after genuine image preparation; there is no fake AI delay. Original-page images use a fixed aspect-ratio container so the web preview and native layout do not expand to the image's intrinsic height. Previously saved V19 menus do not receive the new source-page image.

`tests/fixed-spanish-menu.test.js` checks all 15 Spanish dish lines against the extracted source, category counts, photo-independent fixed results, independent copies, price preservation/corrections, and separation of the general allergen legend from dish assessment. `tests/menu-scan.test.js` retains correction, bilingual search, diet and persistence coverage. [SCAN_LIBRARY.md](SCAN_LIBRARY.md) explains owner-scoped storage, export and deletion; [TYPOGRAPHY.md](TYPOGRAPHY.md) explains the shared Sora/DM Sans system.

`research/verify-fixed-menu-assets.py <export-directory>` verifies the source-page WebP against its provenance hash and checks that the same bytes exist in each native export and the web export. Its output is `research/fixed-menu-asset-validation.json`. The ingredient dictionary adds possible recipe clues for cannelloni, béchamel, vichyssoise, custard and molluscs; the fixed-menu tests verify these dietary exclusions while keeping creamy rice texture from becoming an invented dairy ingredient. Opening saved menus or completing a photo scrolls the enclosing app view back to its heading.

Physical iPhone camera/Expo Go behavior still requires a device check. Browser photo selection and cross-platform JavaScript exports are different checks and do not substitute for it. A future live implementation needs a private authenticated model endpoint, validated extraction and real-photo testing; no provider key belongs in Snack.

## Historical V19 behavior

The Scan tab replaces Saved. Saved dishes remain in the header heart and keep their existing persistence. Home's Scan button opens the same new route. This is a functional photo-review and prepared-example interface; no OCR/model service is connected or claimed in this version.

`components/MenuScanner.js` uses the Expo SDK 54 ImagePicker to take/select a photo and ImageManipulator to normalize it to JPEG, limit its longest edge to 2000 pixels, preview the whole page and rotate it. Capture permission is requested only after the person's tap. Canceling preserves the draft. No photo is transmitted. A chosen photo is explicitly marked unanalyzed, and the unavailable AI action says a connection is required. Camera behavior on a physical iPhone still needs testing.

The separate Spanish example is authored fictional content, visibly marked “Prepared bilingual example · not a live AI scan.” It opens immediately without a fake processing animation. It has eight Spanish/English dish names and descriptions, original printed euro prices, a complete source-text preview, language toggling, search, profile comparison, item corrections, and save/reopen/delete controls. It is not substituted for a person's uploaded photo. Dietary text clues use the existing rules and never create allergen-absence declarations. For my diet excludes identified conflicts and items awaiting translation review; it does not certify allergy safety.

`src/menu-scan.js` holds independent sample copies, bilingual search/grouping, conservative ingredient-text assessment, owner keys and item correction. Changing Spanish without corresponding English changes marks an item as needing translation review and excludes it from the dietary view. Changing English triggers fresh text assessment and removes stale dietary tags. `tests/menu-scan.test.js` covers those cases, original prices, mutation, owner isolation, sequential storage and failure recovery.

`App.js` keeps the draft above screen remounts so visiting dietary settings does not discard it. Drafts are tagged with the account/device owner and hidden immediately for another owner. `Account.js` permits an explicit return to Scan. `scanResetVersion` discards the draft after settings clears the current owner's personal data. The separate [SCAN_LIBRARY.md](SCAN_LIBRARY.md) explains shared local storage, export and deletion; [TYPOGRAPHY.md](TYPOGRAPHY.md) explains the common two-font system.

To enable real AI scanning later, configure a private, authenticated, rate-limited server endpoint and a model-provider secret, validate its extracted bilingual menu output, and test genuine menu photos before enabling the UI action. Never embed a provider key in Expo Snack. No Supabase/provider configuration, external image upload, or paid service was created for this screen update.
