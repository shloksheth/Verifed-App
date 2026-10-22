# Verifed version recovery

Audited 21 October 2026; authorized numbered publications completed 22 October. This report records recovered source, not a claim that every past editing session was saved. Recovery itself used read-only source downloads; the separately authorized publications are recorded below.

All paths below are relative to `C:/Users/shlok/Documents/ChatGPT/CAC/` unless stated otherwise. `tmp/version-recovery/` is a preservation area; it does not replace the working application.

## Exact saved web revisions

These directories were exported directly with `git archive` from the original nested repositories. The original commit IDs and dates remain available in those repositories. No commit dates were invented or rewritten.

| Original saved date | Repository / commit | Recovered directory | What changed |
| --- | --- | --- | --- |
| 9 October, 21:27:23 EDT | `verifed`, `d11f09306c24a45743653e06fdb87ec4fe465e69` | `tmp/version-recovery/web-snapshots/prototype-20261009` | Initial browser prototype: menu/profile assessment and diner/kitchen demonstration. Plain browser JavaScript, stylesheet, server and state tests. |
| 19 October, 19:56:57 EDT | `verifed-app`, `77baf4750636a3ee5f10c81d4d1684ccef788511` | `tmp/version-recovery/web-snapshots/companion-initial-20261019` | Full React/Vite companion app, responsive screens, Supabase-backed data and authorization, local demo, documented engine and tests. |
| 19 October, 20:23:18 EDT | `verifed-app`, `a01b40b8f6b51f7ce963023da111e9cef9ef98ce` | `tmp/version-recovery/web-snapshots/companion-google-20261019` | Enabled configured Google sign-in, explicit account chooser, cancelled-sign-in error handling and callback URL cleanup. |
| 19 October, 20:33:09 EDT | `verifed-app`, `424db28c63673ae293ce347798e4be36007ec394` | `tmp/version-recovery/web-snapshots/companion-verified-docs-20261019` | Documentation recorded successful localhost/hosted Google sign-in and native-app testing limits. This commit changes documentation only; application behavior is the same as the preceding revision. |
| 21 October, 06:34:43 EDT | `verifed-app`, `a4a2f593ed1df85a069a188ed0a0512a1e97c397` | `tmp/version-recovery/web-snapshots/companion-orlando-20261021` | Added public Orlando menus/catalog integration, guest dietary preferences and journal behavior, directory UI and the local-catalog database migration. |

Machine-readable export records: `tmp/version-recovery/web-snapshots/recovery-manifest.json`. These revisions have no corresponding historical Expo Snack: they are browser applications. A newly ported Snack would be a new adaptation, not an original historical publication.

The nine entries in `outputs/verifed-prototype-code.zip` also match their clean `verifed/` source files byte for byte. The Git export includes the original tracked hidden configuration files that the delivery ZIP omitted.

## Exact published native source recovered

Expo's installed `snack-sdk` documents its public download URL in `getDownloadURLAsync`: `https://exp.host/--/api/v2/snack/download/{id}`. Recovery used **GET downloads only**, with no account, `saveAsync`, source update or publication mutation. Every ZIP was extracted with path traversal checks. The raw ZIPs, normalized source directories and SHA-256 manifests are preserved.

The rows are in the progression established by local verification records and source differences. Downloaded ZIP timestamps identify the recovery request, not the original publication date, and must not be used as historical release dates.

| Native progression | Original Snack | Exact recovered source | Supported description |
| --- | --- | --- | --- |
| Compact Orlando menus | [AvnMStCTzlt43hff6KgO4](https://snack.expo.dev/AvnMStCTzlt43hff6KgO4) | `tmp/version-recovery/snacks/AvnMStCTzlt43hff6KgO4/source` | Three public locations and 24 compact food records, guest needs, full menu/detail flows, plus the older scan/request/workspace demo. The original native simulator check was recorded at `2026-10-21T10:44:32.026Z`. |
| Two menu views | [2nqxVa20Ck2ca3u1opcBZ](https://snack.expo.dev/2nqxVa20Ck2ca3u1opcBZ) | `tmp/version-recovery/snacks/2nqxVa20Ck2ca3u1opcBZ/source` | Expanded three-location catalog to 110 food entries; added full-menu and personalized-menu tabs, explicit dietary evidence, allergen icons and a select-needs prompt. |
| Personalized-menu refinements | [f9qoilOrNLsSvoBIO-GL0](https://snack.expo.dev/f9qoilOrNLsSvoBIO-GL0) | `tmp/version-recovery/snacks/f9qoilOrNLsSvoBIO-GL0/source` | Same 110 food entries; shows the selected requirements supported by each reported match, reduces misleading empty/unknown badges on matching rows, explains remaining preparation uncertainty and returns from a saved profile editor without leaving duplicate menus in navigation history. |
| CAC community edition | [ukhSZ6WA-IvmhsyPKL5JH](https://snack.expo.dev/ukhSZ6WA-IvmhsyPKL5JH) | `tmp/version-recovery/snacks/ukhSZ6WA-IvmhsyPKL5JH/source` | Twenty restaurants, 1,063 published food records, real credited photographs, separate ingredient clues, central Home navigation and public Saved/Journal flows. The business Scanner/Workspace/Requests modules were excluded from the actual Snack. Original publication record: `2026-10-21T23:39:16.666Z`. |

The first two-mode snapshot and the CAC edition have actual iPhone 16 Pro / Expo Go simulator evidence. The compact-menu snapshot has its own native verification evidence. The later 110-entry refinement was tested in the rendered web UI and exported for native platforms; do not attribute the preceding snapshot's simulator screenshots to that later exact revision. No historical physical-iPhone test is established by these records.

Download manifest, source file hashes and ZIP hashes: `tmp/version-recovery/snacks/recovery-manifest.json`. Each `{id}.zip` is alongside its extracted directory. The downloaded packages contain the **published code and asset**, plus Expo-generated `package.json`, `app.json`, `index.js` and default icon scaffolding. The generated package currently selects Expo `~54.0.37`; this is not proof the original local project's lockfile used that patch. Historical original local tests, documentation, importer scripts and lockfiles are not part of a Snack download unless separately archived.

## Preserved full CAC development source

Before any delivery ZIP regeneration, all 189 archive entries were preserved at:

`tmp/version-recovery/pre-discovery/`

This is the pre-map, pre-additional-restaurants development snapshot from `outputs/verifed-design/Verifed_Source.zip`, saved locally on 21 October at 19:44:48 EDT. It contains `verifed-mobile/`, the companion browser app, tests, documentation, source research and importer/publisher tools. Its mobile `publication.json` records `ukhSZ6WA-IvmhsyPKL5JH` and source hash `2e7c37f35f332e85680792d0ec37b42b65bab6ecb50b95a9b07d534af78838d5`.

Every published JavaScript code file recovered from that Snack, excluding Expo-generated `index.js`, matches the corresponding archived mobile source byte for byte. This confirms the archive's published app code association without claiming the Snack contains the archive's extra tests/research/legacy components.

## Publication boundaries

- Number versions only after choosing a consistent sequence. It is reasonable to combine the documentation-only web commit with its preceding Google sign-in release, while preserving the exact original commit separately.
- Old web revisions cannot have historically matching Snack IDs because their implementations were browser-only. Label that fact; do not fabricate an original native publication.
- The four recovered native Snack IDs are public immutable snapshot references. Renaming a recovered version and saving it to Snack creates a **new** snapshot; preserve the original ID in its release notes and recovery metadata.
- Current discovery/map/additional-restaurant work is later than the archived 20-restaurant snapshot. A stale `verifed-mobile/publication.json` alone does not establish that newer workspace source was published or tested under the old ID.
- No earlier exact native snapshot was found beyond these four public sources. Earlier screenshots, PDF mockups, generated bundles and menu data files alone do not establish a complete editable app revision. Do not reconstruct a guessed historical version and call it recovered.
- These source exports do not restore historical database contents or provider settings. Old clients may read today's shared backend catalog. Replaying a client does not recreate the database state it originally saw.
- Keep environment files, credentials, modules, browser authentication captures and private account details out of publication. Recovery manifests contain source hashes and paths, not secrets.

## Completed numbered publications

The recovered checkpoints were imported as new commits into the private [Verifed-App repository](https://github.com/shloksheth/Verifed-App). Releases and tags run sequentially from [Verifed V1](https://github.com/shloksheth/Verifed-App/releases/tag/v1) through [Verifed V9](https://github.com/shloksheth/Verifed-App/releases/tag/v9). V1–V5 correspond to the five web rows above, including the explicitly documentation-only V4; V6–V9 correspond to the four native rows.

| Version | Version-named Snack copy | Original snapshot |
| --- | --- | --- |
| V6 | [Verifed V6](https://snack.expo.dev/E4i_8YfuODHbAhEpNVhF-) | `AvnMStCTzlt43hff6KgO4` |
| V7 | [Verifed V7](https://snack.expo.dev/36-7tJZ_5Jo7qZ_DErC1x) | `2nqxVa20Ck2ca3u1opcBZ` |
| V8 | [Verifed V8](https://snack.expo.dev/OkbEhpvUOY-OAFIOQDsMM) | `f9qoilOrNLsSvoBIO-GL0` |
| V9 | [Verifed V9](https://snack.expo.dev/oeTbv0DbuNC2iNBQuhzlW) | `ukhSZ6WA-IvmhsyPKL5JH` |

Each copy was downloaded after publication. Its generated app name matched its numbered name, and every published application code file and carrot asset matched the original recovered source byte for byte. This verifies source publication, not a new native runtime test. Results are in `tmp/version-recovery/snacks/versioned-publication-verification.json`.

The isolated publishing checkout is `tmp/version-recovery/repository`; its historical import ends at commit `77be107ca88bb6b29158e726ebdced24f7df0e0b` and tag `v9`. `prototype/`, `web/` and `mobile/` preserve the introduced project types. The current work should become V10 only after its own completion and verification. Original history was not rewritten. Release URLs and next-version metadata are in `tmp/version-recovery/published-history.json`. The reproducible import tool and numbered-Snack publisher are `tmp/version-recovery/complete_history.py` and `tmp/version-recovery/publish-historical.mjs`.

## Map-provider review requested during recovery

The [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/) requires a genuine browser Referer and normal caching. An opaque-origin sandboxed `srcdoc` map can suppress that identification. Restoring the real origin can resolve that integration defect, but [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) warns that `allow-scripts` plus `allow-same-origin` gives same-origin embedded script access to its parent. Treat the generated map as trusted application code, maintain escaped data insertion, script integrity and message-source validation; do not claim those sandbox flags isolate an untrusted page.

[CARTO's current official key page](https://www.carto.com/basemaps/apikey/index.html) requires an issued key; its present free noncommercial quota is five million monthly requests. Replacing the OSM URL with an unkeyed CARTO URL is not an adequate fix. No provider account or credential was created during this review.
