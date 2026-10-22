# Native engine and build guide

## Start with the data

`src/data.js` contains the fictional restaurant catalog, dishes, selectable requirements and default profile. `src/domain.js` implements dish assessment, bounded taste ranking, independent demo fixtures, immutable request snapshots, request revisions, staff responses, diner acknowledgment and completion. It uses the same rules as the browser app. Ingredient conflicts always remain visible; taste scores do not establish suitability.

`src/model-utils.js` copies JSON domain objects and accepts an ID factory. The native API installs Expo Crypto's UUID generator. This avoids relying on browser-only `structuredClone` or a missing Hermes crypto global. Tests use Node's UUID generator. `src/storage-queue.js` serializes asynchronous storage writes and releases the queue after failures so another tap can proceed.

## One external store

`src/api.js` owns ready/mode/user/profile/catalog/request/meal/favorite/membership state. `subscribe`, `getState` and `init` connect to React's external-store subscription. Screens keep form drafts and navigation locally; they do not mutate shared arrays directly.

Guest mode loads the public catalog and retains device-only preferences, saved dishes and journal records, as explained in DEVICE_LIBRARY.md. The legacy demo/request methods below remain for compatibility and are not exposed by the CAC public routes. Demo mode loads local activity from AsyncStorage, with fictional sample kitchens and the reviewed real catalog kept distinct. Cloud mode uses Supabase sessions, database row-level security, and the existing `verifed_command` database function. A failed cloud read shows an error; it does not silently turn cloud data into a demo. Bundled real menus remain browsable with their original review dates.

Demo edits read the latest stored draft inside a serial queue, validate changes, persist the whole JSON state, then publish it. Reset and demo entry use the same queue. Every mutation captures generation, mode and identity. If the user signs out or changes modes while a save is pending, that save cannot publish old records into the next session. A save already committed still returns its actual result.

Cloud reads fetch all pages of public catalog and authorized user rows. Refresh generation/sequence guards discard stale responses. AppState starts token auto-refresh when native is active and stops it in the background. A 15-second foreground refresh picks up kitchen changes. The database, rather than this polling interval, enforces ownership and revision conflicts.

## Mutations and committed writes

The API exposes profile save, request creation/actions, meal create/edit, favorite toggle, menu create/edit, workspace creation, export and personal-data deletion. Menu revisions invalidate active meal responses through the same protocol as the web app. Staff drafts send the revision they originally read. Request acknowledgment also carries the response ID, preventing an earlier response from being accepted accidentally.

`src/write-sync.js` separates a successful database commit from a failed follow-up refresh. A saved request stays successful if the subsequent read loses connection; the UI receives a refresh warning rather than encouraging a duplicate submission. Exports include only the current diner's personal records. Personal-data deletion preserves restaurant-owned business records and account identity, as explained in the UI.

## Native adapters and auth

AsyncStorage persists local demo data and Supabase sessions. Supabase uses `processLock` and disables automatic URL-session detection. `src/native-globals.js` installs URL and URLSearchParams before Supabase loads. Version 4 of the maintained polyfill avoids an older punycode dependency that crashed in Snack's Android runtime. Browser previews retain the browser URL implementation. Startup validates that native URL parsing works before creating the client and reports the actual cause if it fails.

Expo Crypto supplies UUIDs. The mobile app authenticates with username/email and password through Supabase and its restricted username lookup function; Google sign-in, its callback flow, and development-build warnings have been removed from the mobile user interface and API. Previously authenticated user sessions still use standard Supabase session refresh handling. `src/config.js` contains the public API URL, publishable key and a website URL still required by the map origin filter. Database policies enforce account access.

## Build, assets and publication

`index.js` registers the app with Expo. `App.js` is also Snack's entry point. `app.json` names the app, declares portrait/light mode, IDs, the `verifed` deep-link scheme and deep-link settings. The scanner camera plugin is removed from the CAC configuration. `assets/verifed-mark.png` is the refined carrot/checkmark from the user's logo direction. `package.json` pins SDK-compatible dependencies; `package-lock.json` records the installed graph. `.gitignore` excludes generated builds, modules and environment files.

`../research/native-tools/publish.mjs` uses Expo's official `snack-sdk`. It reads the application code directories and carrot asset, excluding Scanner, Workspace and Requests from the CAC snapshot, rejects known secret markers, resolves package/peer dependencies, uploads the asset and saves an anonymous public snapshot. It records the returned publication IDs, URL, file list, date and code hash in `publication.json`. Snack's recommended version ranges are used in its manifest while the local project keeps exact dependency pins. The SDK publisher package and lockfile make this reproducible. A new anonymous snapshot has a new URL.

## Tests and evidence

`tests/domain.test.js` exercises immutable snapshots, transitions, stale revisions/response IDs, ownership roles, malformed payloads and ranking constraints. `tests/write-sync.test.js` verifies successful writes survive a failed refresh. `tests/storage-queue.test.js` checks rapid writes and recovery after failed persistence. `tests/api-session.test.js` executes the actual API with delayed storage/network adapters to test reset, sign-out and late cloud responses. These checks supplement real Snack interaction; they do not replace camera, keyboard or sign-in testing on a phone.

## Official references

Expo authentication: https://docs.expo.dev/guides/authentication/

Supabase React Native setup: https://supabase.com/docs/guides/auth/quickstarts/react-native

Snack SDK publishing: https://github.com/expo/snack/blob/main/docs/snack-sdk.md
