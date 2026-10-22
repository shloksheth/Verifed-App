# Verifed V10 verification

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
