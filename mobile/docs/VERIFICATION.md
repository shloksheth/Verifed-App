# CAC mobile release verification

## Release and automated checks

Reviewed 21 October 2026. Current published snapshot: https://snack.expo.dev/ukhSZ6WA-IvmhsyPKL5JH. Source hash: 2e7c37f35f332e85680792d0ec37b42b65bab6ecb50b95a9b07d534af78838d5.

54 mobile tests pass. These include the twenty-location catalog, unique stable keys, saved Census district evidence, source claims, ingredient clues, plant substitutes, oyster mushrooms, rice flour, optional additions, vegetarian/vegan filtering, device persistence, account separation, delayed writes, ranking and the retained legacy request protocol. The API adapter harness supports formatted multiline imports.

Web, Android and iOS Metro exports succeeded after the final ingredient-clue fixes. Export checks JavaScript and platform dependencies; it does not produce signed store binaries or establish physical-device behavior. This project remains on Expo SDK 54; the matching Snack emulator can run it, while physical Expo Go requires a compatible installed runtime.

## Actual integrated browser checks

The actual React Native web app was exercised at http://localhost:8083/ at 390 by 844 pixels. The directory showed 20 real restaurants. Nineteen image elements loaded with nonzero image dimensions; Tako Cheena's blocked official image uses an intentional fallback. Document width equaled viewport width. The bottom bar contained Explore, Saved, Home, Journal and You, with Home in the center and no Scan tab.

Black Rooster's Full menu rendered all 27 records. With Milk + Soy + Vegan selected, the app displayed five possible options, including guacamole and salsa, while excluding Crispy Fish and other ingredient-flagged items. Recipe clues and source declarations stayed visually distinct. Tin & Taco's full menu rendered all 119 records. The dictionary's complete Loving Hut source supports 61 Vegan matches; this does not establish allergy absence.

Saving a Black Rooster dish worked as a guest. A journal record named Interface test — not a real meal was created with a four-star taste rating and an explicit testing note. After a full page reload, both the saved dish and journal record persisted. No cloud account or restaurant request was used for this check. The deliberately labeled test record remains only in this development preview's device library.

Actual screenshots are in research/previews/cac-mobile. They are React Native web screenshots, not generated design images or physical iPhone captures.

## Backend and source verification

Public Supabase REST reads matched all 1,063 source records across 20 restaurants, including UUID associations, source-positive allergens, provenance, addresses and image metadata. The verifier paginates beyond the 1,000-row API limit. Real restaurants remain fictional=false and confirmed=false; they have no staff connection or simulated requests. No new schema or access policy was introduced for this release.

Census ACS2025 responses place all 20 selected addresses in FL-10 for the 119th Congress. Each raw response and exact source URL is retained. These checks do not establish the student's personal congressional district or contest eligibility.

Official-source review corrected duplicated image text, missing descriptions and non-food bar rows. Published menu scope, omitted drinks/modifiers/catering, unknown availability and evidence gaps remain explicit. Photos are credited to official pages; reuse permission is not claimed.

## Native and external boundaries

The current ukhSZ6WA-IvmhsyPKL5JH snapshot launched in the actual iPhone 16 Pro / Expo Go simulator. Home displayed 20 restaurants and 1,063 menu entries with the official food photo. Native Explore displayed the 20-location directory and restaurant images; opening Fresh Kitchen rendered its credited photo, source links and both menu tabs without the error screen. Screenshots are saved as verification/cac-ios-home.png, cac-ios-explore.png and cac-ios-menu.png. This native check covers launch and those screens; the detailed dietary and persistence interactions were checked in the mobile-width React Native web app and API tests. Current Android/iOS exports passed. A physical iPhone, native keyboard behavior, dialer and share-sheet behavior have not been tested.

Google OAuth on native devices still requires a development build. Expo Go cannot receive the app-specific callback. Core guest discovery, dietary preferences, favorites and journaling do not depend on sign-in. No successful native OAuth callback, restaurant partnership, order placement, live availability, meal safety certification or store release is claimed. The companion website remains the earlier separate browser implementation; its interface was not redesigned in this mobile release.
