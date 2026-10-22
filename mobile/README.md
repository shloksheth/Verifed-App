# Verifed for iOS and Android

This is the React Native / Expo application. `../verifed-app` is the companion browser application. Both use the same Supabase project. The CAC mobile app includes 26 real Orlando-area locations and 1,652 published food records. The public flow focuses on diners; scanner and business-workspace routes are removed. Each real restaurant has Full menu and For my diet views, with labeled allergen icons and explicit evidence matching. Published-source coverage is disclosed; a complete live branch inventory is not claimed.

## Try the published app

The current verified Snack link and Expo Go deep link are recorded in `publication.json`. Open the editor URL, choose **Android** or **iOS**, then **Launch Snack**. Explore, choose dietary needs, save dishes and log meals without an account. These personal records stay on the device. The **Run on device** button displays the Expo Go QR code.

Snack targets Expo SDK 54. Use an Expo Go version that supports SDK 54; a newer incompatible Expo Go cannot open an older runtime. Snack's browser emulator includes the matching client. A Snack upload is not an App Store / Play Store release.

## Run locally

From this directory:

```sh
npm ci
npm start
```

Expo prints a local QR code. The phone and computer must be able to reach each other. `npm run web` opens the React Native web preview. `npm test` runs domain, persistence and delayed-session tests. `npx expo export --platform web --platform android --platform ios` validates all JavaScript bundles; it does not produce signed store binaries.

## Publish the next Snack

The official Snack SDK publisher lives in `../research/native-tools`. Install its pinned dependencies once with `npm ci` in that directory. Then run `npm run publish:snack` here. It uploads only the application code and carrot asset, resolves peers, saves a public anonymous Snack and records the actual returned IDs in `publication.json`. Anonymous snapshots get a new link when source changes. No Expo password or persistent credential is embedded.

## Google sign-in

Google is connected to Supabase with basic identity scopes. The companion website has been tested with the intended Google account. Google OAuth requires a development build with the `verifed` scheme on native devices; Expo Go's shared container cannot receive this app's OAuth callback. The app explains this and lets you open the companion website. Google sign-in inside the Snack web iframe is deliberately unavailable because that iframe is not the configured companion origin.

The exact native redirect `verifed://auth/callback` is allowlisted in Supabase. The code implements the development-build callback, but no signed development binary or device OAuth test is claimed. Google is currently in Testing and the owner's requested account is added as a tester. Public email signup requires an email delivery provider; the existing email-account path is secondary.

## Read the code

`docs/CAC_INTERFACE.md`, `docs/CAC_CATALOG.md` and `docs/DEVICE_LIBRARY.md` explain this release; `docs/NATIVE_FRONTEND.md` covers the active screen modules. `docs/NATIVE_ENGINE.md` explains API, storage, auth, rules, configuration and publishing. `docs/LOCAL_CATALOG_ENGINE.md` explains source records, allergy matching, district evidence, import scripts and offline merging; `docs/LOCAL_MENU_UI.md` covers the directory screens. `docs/NATIVE_REVIEW.md` records independent review fixes. `docs/VERIFICATION.md` records what was tested and what still needs a physical device. AI assistance is disclosed; use these guides to learn and explain the code accurately.


Current release numbering and publication are documented in docs/GITHUB_RELEASES.md. Discovery, map, address entry and welcome screens are explained in docs/LOCATION_SEARCH.md, DISCOVERY_ENGINE.md, MAP_VIEW.md and ONBOARDING.md.
