# Verifed

Recovered development checkpoints, followed by current work. Each numbered release contains its exact recovered application source and a description of its changes.

The import commits were created when the history was recovered. Original saved dates, commit references and Snack IDs are recorded in `versions/`; no historical commit dates or authorship were fabricated.

| Version | Change | Expo Snack |
| --- | --- | --- |
| [Verifed V1](https://github.com/shloksheth/Verifed-App/releases/tag/v1) | Initial browser prototype with dietary menu assessment and a local diner/kitchen demonstration. | Browser application |
| [Verifed V2](https://github.com/shloksheth/Verifed-App/releases/tag/v2) | Full React/Vite companion app with responsive screens, Supabase data, local demo, tests and code documentation. | Browser application |
| [Verifed V3](https://github.com/shloksheth/Verifed-App/releases/tag/v3) | Configured Google sign-in, explicit account selection, cancelled-login error messages and callback URL cleanup. | Browser application |
| [Verifed V4](https://github.com/shloksheth/Verifed-App/releases/tag/v4) | Documentation-only checkpoint recording verified browser Google sign-in and native authentication limits; app behavior matches V3. | Browser application |
| [Verifed V5](https://github.com/shloksheth/Verifed-App/releases/tag/v5) | Public Orlando restaurant catalog, guest dietary preferences and journal integration in the companion browser app. | Browser application |
| [Verifed V6](https://github.com/shloksheth/Verifed-App/releases/tag/v6) | First recovered native Orlando version: three locations, 24 compact food records and the scan/request/workspace demonstration. | [Verifed V6](https://snack.expo.dev/E4i_8YfuODHbAhEpNVhF-) |
| [Verifed V7](https://github.com/shloksheth/Verifed-App/releases/tag/v7) | Three-location catalog expanded to 110 food entries with full-menu and personalized-menu tabs, dietary evidence and allergen icons. | [Verifed V7](https://snack.expo.dev/36-7tJZ_5Jo7qZ_DErC1x) |
| [Verifed V8](https://github.com/shloksheth/Verifed-App/releases/tag/v8) | Clear supported-requirements labels, improved uncertainty copy, fewer misleading empty badges and corrected navigation after saving dietary needs. | [Verifed V8](https://snack.expo.dev/OkbEhpvUOY-OAFIOQDsMM) |
| [Verifed V9](https://github.com/shloksheth/Verifed-App/releases/tag/v9) | CAC community edition: 20 restaurants and 1,063 food records, real credited photographs, ingredient clues, Home navigation, Saved and Journal. | [Verifed V9](https://snack.expo.dev/oeTbv0DbuNC2iNBQuhzlW) |
| [Verifed V10](https://github.com/shloksheth/Verifed-App/releases/tag/v10) | Orlando discovery: 26 locations, 1,652 published food records, Woodlands, Bombay Street Kitchen, Yellow Dog Eats and three selectable Taco Bell branches. Interactive map, typed city/ZIP/address search, cuisine and dietary evidence filters, recommendations from rated meals, Home info and an opening account prompt. Guest browsing remains available. Google accounts require the companion website or a native development build. | [Verifed V10](https://snack.expo.dev/qEw0A9vgOiKizDke66XQZ) |

Application directories appear as they are introduced: `prototype/` (original JavaScript web prototype), `web/` (React companion), and `mobile/` (React Native/Expo). Every release preserves the other applications already introduced.

Native V6–V9 are new version-named copies of recovered immutable Snack snapshots. Their original snapshot IDs remain in release notes. Downloaded V6–V8 contain Expo-generated project scaffolding rather than original local lockfiles and tests. V9 also restores the archived local code, tests and documentation.

The source progression is known; exact original publication times for native V6–V8 are unavailable. V5/V6 cross-product order is the recovered checkpoint sequence, not a claim of precise wall-clock publication order. V4 changes documentation only.

Historical clients use a shared backend that may contain newer menu data. Replaying a client does not restore an old database or provider configuration. Confirm ingredients and cross-contact with restaurant staff.
