V22.1 typography update: the current app uses Clash Grotesk for headings, body and controls. [TYPOGRAPHY.md](TYPOGRAPHY.md) describes the implementation and source. The V21 design research below remains historical.

# Verifed interface redesign

Reviewed 25 October 2026. This is a design rationale and code guide, not evidence of user testing or a claim that the app was designed without AI assistance.

## Research and direction

The current [Uber Eats App Store screenshots](https://apps.apple.com/us/app/uber-eats-food-groceries/id1058959277) and [DoorDash App Store screenshots](https://apps.apple.com/us/app/doordash-food-grocery-more/id719972451) were downloaded through Apple's public lookup API and visually inspected. Both put location and search early in the flow, with horizontal categories, prominent food photography, compact metadata and quiet surfaces. Their promotional screenshots do not establish exact in-app measurements. Reference images and URL metadata are in the workspace's `outputs/design-v21/references` folder.

The user's reference contributes expressive serif titles, a warm neutral background and coral accents. Verifed pairs that heading treatment with compact utility text and existing food photographs. No fictional delivery times, public ratings, discounts or checkout controls were added to imitate a delivery app's features.

[DoorDash's design-language-system article](https://careersatdoordash.com/blog/design-language-system-theming/) explains semantic typography, color and component tokens. Applied here through a shared palette and font resolver. [DoorDash's design team](https://about.doordash.com/en-us/design) identifies content design as part of product communication. These are references, not copied implementation or proprietary font assets.

[NN/g's research on product-specific AI writing](https://www.nngroup.com/articles/genai-write-for-the-web/) supports concise language, useful headings and putting needed information first. This informed replacing repeated dining metaphors with task names. [Sami Hedhli's design commentary](https://samihedhli.com/articles/ai-generated-design-tells/) discusses recurring patterns such as decorative gradients, identical card treatments and generic copy. Those are editorial heuristics, not proof of whether a person or AI authored a screen. Verifed addresses the usability of those patterns.

## Visual rules

`src/design-tokens.js` owns the palette: warm off-white canvas, white working surfaces, charcoal text, dark coral primary actions, green selection states and red conflicts/errors. Green indicates selection or a text match, not certified allergy safety. The brighter coral is a background accent. `tests/design-tokens.test.js` checks normal-text contrast for the primary combinations; this is not a complete accessibility audit.

Source Serif 4 is used for page and section headings. Public Sans is used for dishes, prices, fields, navigation and controls. [TYPOGRAPHY.md](TYPOGRAPHY.md) records the licensed static font files, pinned official sources, hashes and system fallback. These are open fonts selected for the direction, not Uber or DoorDash's proprietary fonts.

`styles.js` applies 20px page padding, readable body text, interactive chips of at least 44px, 52px buttons, quieter surfaces and larger menu prices. Lists use spacing and dividers instead of boxing every row. Home's horizontal cards scroll on narrow screens. Existing restaurant logos retain their artwork.

## Related code

- `components/Home.js`: location, real search input, cuisine links, Hawkers/Chipotle photo cards, actual dish counts, dietary settings and Scan. The compatibility export `useHomeFonts` now aliases the shared `useAppFonts` hook.
- `components/Welcome.js`: real food photo, direct explanation, account/guest actions and a storage notice. The About sheet explains existing tasks and source limitations.
- `App.js`: passes and clears Home search/cuisine intent, retains navigation and owner-scoped scan drafts, uses green selection, and lets the compact brand/location header shrink. Loading and error copy names the state.
- `components/Explore.js`: consumes the initial Home filters once, preserving later changes after opening a restaurant and returning. Location/map, cuisine, chains and dietary evidence filters remain available. Branch selection works for all chains.
- `src/discovery.js`: indexes published ingredient strings alongside names, descriptions and tags. `tests/discovery.test.js` verifies ingredient-only matches and an absent query.
- `components/MenuScanner.js`: preserves the fixed Spanish scan presentation from V20 while improving capture instructions, source-page preview, offer hierarchy, compact photo access and text-first dish rows. `src/fixed-spanish-menu.js` adds structured printed offer values; the full bilingual summary remains for old saved records. This is still a fixed response after any successful photo, not live OCR or AI translation. See [MENU_SCANNING.md](MENU_SCANNING.md).
- `components/BrandIdentity.js`: true restaurant-menu headers use serif; controls and dish names use Public Sans. It no longer forces every brand wrapper into a heading face.
- `components/ChipotleMenu.js`: the hero names its ingredient-selection task directly. Selection remains a personal comparison, not an order sent to Chipotle.
- `components/Journal.js`: actual counts, rating filters, photo-supported rows and clearer meal detail/editor hierarchy. [JOURNAL_DESIGN.md](JOURNAL_DESIGN.md) explains the unchanged save payload and persistence.
- `components/Account.js`, `components/Dining.js`, `components/RestaurantMap.js`: direct task labels, shorter descriptions and specific empty states. [COPY_REWORK.md](COPY_REWORK.md) records the copy sources and preserved source/safety/privacy meaning. Published restaurant ingredient descriptions are not rewritten for tone.

Archived business Scanner, Requests and Workspace modules remain historical source and are excluded from the active Snack. Old font files remain for historical provenance; active screens load only the new five faces.

## Review and scope

Independent review caught Home search being reapplied after returning from a restaurant, ingredient-search text promising an index that omitted ingredients, chain wrappers forcing serif on controls, and a fixed-width compact header. These issues were corrected. Browser layout/interaction evidence is recorded in release QA. Native exports verify bundling, not physical iPhone camera behavior.

V20 was already published. This update uses the next unused V21 and preserves the earlier tag and Snack.

`research/verify-design-assets.py <export-directory>` checks the five new font files against their pinned source hashes and verifies those fonts plus both Home photos in every platform export. It writes `research/design-v21-asset-validation.json`. Separate fixed-menu and food-image validators continue to check the source page and catalog imagery.

`research/native-tools/publish.mjs` now includes the font folder's license and provenance text files alongside its font binaries in Snack. `research/verify-snack-snapshot.py` expects those same files when comparing downloaded source. Publishing them does not load them as app modules or reveal credentials.
