# V12 account checkpoint

91 mobile tests and web/Android/iOS exports pass. At 390x844, the new signup and username-or-email login forms render and block empty submission. The deployed Edge Function returns username availability; server SQL grants only id/email columns to its trusted service role. Private tables deny client access by design (the RLS-no-policy advisor notices are expected). The existing leaked-password-protection warning remains; see https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

Live signup and round-trip login tests are pending approval to turn off Supabase Confirm email. The test script is prepared; no signup success, public reset delivery or current native-device interaction is claimed. The account implementation is documented in ACCOUNT_LOGIN.md. Earlier verification follows as historical evidence.

# Verifed V11 verification

Current Snack: https://snack.expo.dev/msDt7qbzQwjSPeyM3zH3O. Source hash: 56db082e21a94bcc100fb8b343fd62e87b0b4712335111b6dc3885acf050b775.

83 tests pass, including a lexical binding check for all published modules and six new dietary/profile tests. Final web, Android and iOS exports pass. No database schema or menu-fact changes were needed; source-derived ingredient hints are recomputed by the client.

At 390x844, Honey, Vegetarian (no eggs) and No garlic or onion appeared as selectable choices, saved to the device and remained selected after reload. A real Black Rooster Guacamole detail screen rendered, showed its actual onion conflict, toggled Saved off/on, opened and closed the meal composer, and returned to its restaurant through the repaired button. No meal was submitted. Source details are collapsed; generic repeated warnings are absent from the main menu/detail journey. Compact ingredient and missing-data labels remain.

The user's iPhone photo established the original undefined onPress crash. It was traced to DishDetail referring to a callback only defined in RestaurantRow. The fixed button calls navigate directly. The new binding test detects unbound identifiers that Metro exports do not reject. No successful physical-iPhone retest of the repaired version is claimed.

The V10 browser/backend checks below remain historical evidence for unchanged location, map and menu facts. Their screenshots are not a V11 native run. Google OAuth still needs a native development build.

# Prior V10 verification

Reviewed 22 October 2026. Current source publication: https://snack.expo.dev/qEw0A9vgOiKizDke66XQZ, named Verifed V10. Source hash b16c1cc14abff97dc1e7757ff8ccb6a85680441f0ed352395381fd392aa3621b. V1-V9 were recovered and pushed sequentially with exact provenance; browser-only V1-V5 have no invented native Snack.

## Automated and backend checks

76 mobile tests pass. They cover dietary evidence, ingredient clues including Indian dairy/soy/bread terms, all-nine absence rules, recommendation ranking, radius geometry, real and ambiguous history, address parsing, browser JSONP cancellation/cleanup, device persistence and account isolation. Tests do not establish the safety of real meals.

Web, Android and iOS Metro exports passed. The final small Home label and web-auth message edits were parsed by Snack publication and exercised in the browser. Exports do not produce signed store binaries. The app uses Expo SDK54 and react-native-webview13.15.0, its matching bundled version.

Public Supabase REST verification matched all 1,652 source food/component records across 26 locations, including real UUID associations, provenance, source-positive allergens, menu counts, images, coordinates, chain IDs and district facts. The verifier paginates beyond 1,000 rows. No schema or access-policy changes were needed.

Woodlands has 100 food entries; Bombay Street Kitchen 84; Yellow Dog Eats Gotha 57; three Taco Bell branches each share a 116-entry national template. This is 589 added location-linked rows, not589 unique recipes. Unknown availability and omitted drink/modifier scope remain explicit. Woodlands uses its actual public HTTP source because its HTTPS certificate failed; no TLS validation was bypassed.

Census source responses identify24 locations as FL-10 and Yellow Dog Eats Gotha as FL-11 for the 119th Congress. Bombay’s district remains unknown after no address match; its coordinates come from its official business-map embed. These labels do not establish contestant eligibility.

## Actual browser verification

Chrome: map markers opened the correct restaurant menu; city/ZIP and U.S. street-address controls work. Searching the public City Hall address 400 S Orange Ave, Orlando, FL 32801 used real Census JSONP and updated the selected center, header and distances. The opening welcome offers Create an account, Log in and guest browsing. Account creation selects the Google route. Home’s information button opens and closes its sheet.

The390 x 844 React Native web preview showed24places/26 locations and both Indian menus. Taco Bell’s picker showed three actual addresses; selecting East Colonial opened that branch’s116-entry menu. List and map use the same filtered result set. All-nine-free mode correctly returned zero matches with an evidence explanation. Milk+Soy+Vegan excludes Taco Bell’s meat/cheese standards from possible options after published ingredient enrichment. OpenStreetMaptiles rendered after restoring a genuine referrer; missing images retain neutral fallbacks.

The existing local development library includes a deliberately labeled Interface test - not a real meal journal entry from previous verification. Its 4-star rating produces a real history signal in this device-only test context. No real dining experience is claimed. Earlier guest saving and reload tests remain covered by the API harness.

Current web screenshots: research/previews/cac-mobile/{home,explore,map,welcome,info}.png. The full-menu and diet-menu screenshots retain the prior release’s unchanged Black Rooster menu presentation. They are working React Native web captures, not generated mockups or physical-device photos.

## Native and account limits

V10’s Snack editor was reached by title in both browser inventories, but hung before Appetize controls appeared; subsequent DOM/screenshot operations timed out. No V10 native simulator success is claimed. V9’s earlier iPhone 16 Pro/Expo Go screenshots are historical only. New map WebView gestures, native keyboard/address interaction and pin navigation still need a working simulator or physical-device test.

Google OAuth still needs a native development build; Expo Go cannot receive the app callback. The opening prompt is implemented, but a native Googlecallback was not tested. Browser sign-in uses the already configured provider and website. No email-registration service, restaurant ordering, live inventory or meal certification was introduced. The companion browser interface remains its earlier separate version.
