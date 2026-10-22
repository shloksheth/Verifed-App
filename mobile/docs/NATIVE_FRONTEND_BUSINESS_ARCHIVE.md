# Verifed native frontend

The interface uses React Native views, text, inputs, pressable controls, native sheets, and safe areas. It has no embedded website or HTML wrapper. The palette pairs carrot orange, ivory, warm brown, and leaf green with the existing carrot checkmark asset.

## Files

- `App.js`: app startup, external store subscription, screen stack, Android back handling, incoming restaurant routes, shared modal composition, bottom navigation, and recoverable rendering errors.
- `styles.js`: shared colors, typography, layout, cards, controls, scanner framing, and safe-area shell styles.
- `components/UI.js`: accessible reusable controls, form fields, sheets, status labels, notices, formatting, and promise/error handling.
- `components/Dining.js`: scan-first home, menu exploration/search/category and conflict filters, restaurant menu, dish ingredients and preparation, favorites, and diner request shortcuts.
- `components/Scanner.js`: camera permission requested only after Open camera, native QR scanning, manual code and link resolution, and permission/error fallbacks.
- `components/Requests.js`: requirement composition/resubmission, current kitchen response acknowledgment, completion/cancellation, immutable reported snapshot, and event history.
- `components/Journal.js`: searchable meal/request history, custom and dish-linked meals, rating/tag/note editing, and meal details.
- `components/Account.js`: Google and existing-email sign-in, password reset, explicit local demo entry, profile editing, settings, data export/deletion, and help. New public email signup is not advertised without email delivery setup.
- `components/Workspace.js`: membership-restricted kitchen queue/detail, accommodate/clarify/decline response, stale draft detection, meal changes, dish creation/revision, workspace setup, and QR sharing.

## State and mutations

The existing `src/api.js` engine owns application data. Components subscribe with `useSyncExternalStore` and keep only routes, selected filters, form drafts, and modal state locally. Writes await the API and display actual errors. Failed cloud operations never enter the demo automatically. The user must explicitly select the local demo.

Request and kitchen form drafts retain the revision that was originally read. Stale drafts go through the engine's revision checks. Kitchen responses have three distinct decisions; acknowledgment applies to the current response ID and meal version. Changes and menu revisions require renewed review. Taste ranking never establishes food safety.

## Expo and sharing behavior

The app targets Expo SDK 54 and React Native 0.81. Camera support uses `expo-camera` with `CameraView` and `useCameraPermissions`; permissions are never requested on initial navigation. QR generation uses `react-native-qrcode-svg`. No custom native modules are needed for browsing and local demo flows in Expo Go.

`FormScrollContext` gives reusable fields the enclosing screen/sheet's ScrollView ref. On native keyboard opening and focus, the field asks React Native to scroll it above the keyboard. KeyboardAvoidingView adjusts the remaining height on Android and padding on iOS. Browser fields retain normal browser scrolling. Listener cleanup prevents navigation from retaining field subscriptions.

Google OAuth cannot complete inside the native Expo Go/Snack container. The sign-in UI explains that a development build is needed; the API returns the actual environment/provider error. Email account operations use the configured backend and show verification/reset notices only after a successful API result.

Shared QR codes contain restaurant IDs and are decoded by the app's Scan tab. They are not advertised as operating-system universal links. Plain CITRUS opens the fictional Citrus & Table sample. Local demo workspace codes are only available on devices that have that local data; signed-in workspaces use the shared backend.

Data export opens selectable JSON and offers React Native Share. If the platform cannot share, the text remains selectable and the error remains visible. Menu-code sharing uses the same native Share API. Restaurant and menu prices remain clearly identified as fictional sample data.

## Verification boundary

Bundling and web browser checks can validate JavaScript, native-web rendering, and local engine flows. Native camera permissions, physical QR scanning, device share sheets, and the development-build OAuth callback require physical-device testing; a browser preview cannot establish those outcomes.
