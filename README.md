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

Application directories appear as they are introduced: `prototype/` (original JavaScript web prototype), `web/` (React companion), and `mobile/` (React Native/Expo). Every release preserves the other applications already introduced.

Native V6–V9 are new version-named copies of recovered immutable Snack snapshots. Their original snapshot IDs remain in release notes. Downloaded V6–V8 contain Expo-generated project scaffolding rather than original local lockfiles and tests. V9 also restores the archived local code, tests and documentation.

The source progression is known; exact original publication times for native V6–V8 are unavailable. V5/V6 cross-product order is the recovered checkpoint sequence, not a claim of precise wall-clock publication order. V4 changes documentation only.

Historical clients use a shared backend that may contain newer menu data. Replaying a client does not restore an old database or provider configuration. Confirm ingredients and cross-contact with restaurant staff.
