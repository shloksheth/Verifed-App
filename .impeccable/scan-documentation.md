# Scan design-system source record

Recorded from the current working implementation on 25 October 2026. This pass writes only root `DESIGN.md`, `.impeccable/design.json` and this record. It changes no application behavior, release metadata or existing implementation guide.

## Scope

The brown/cream/gold world is the scoped Scan extension selected in `scan-direction.md`. The document's descriptive “Warm menu paper” name summarizes that implemented material treatment; it is not an invented historical brand name or research result. `app-*` frontmatter tokens preserve the existing shared context, while `scan-*` tokens are local to Scan. This does not authorize recoloring other screens. Home's change is the neutral scan-icon thumbnail inside its existing shared-color panel.

The root `DESIGN.md` did not exist when this pass began. Neither did `.impeccable/design.json`. Existing `PRODUCT.md`, `mobile/docs/DESIGN_SYSTEM.md`, `mobile/docs/TYPOGRAPHY.md` and `mobile/docs/MENU_SCANNING.md` were read as context and left intact.

## Token evidence

| Recorded rule | Implementation checked |
| --- | --- |
| Existing shared palette, spacing and radius constants | `mobile/src/design-tokens.js` |
| Actual shared button, field, scroll-container and bottom-navigation styling | `mobile/styles.js`, `mobile/components/UI.js`, `mobile/App.js` |
| Scan ground, brown, cream, gold, muted, line and burgundy | Exported `scanColors` in `mobile/components/ScanDesign.js` |
| Capture copy, tan rail, tab paper, capture/button/tab/card geometry and pressed opacity | Styles in `mobile/components/ScanDesign.js` |
| Dietary panel and text colors, support paper, page/restaurant/category type and local action minimums | `look` styles in `mobile/components/MenuScanner.js` |
| Scan root/status/header tint only | Route-specific overrides in `mobile/App.js` |
| Neutral Home thumbnail within retained peach/coral/green context | `mobile/components/Home.js` |
| Actual bundled Clash Grotesk faces and fallback behavior | `mobile/src/use-app-fonts.js`, `mobile/src/typography.js`, `mobile/components/Typography.js` |

The typography tokens record effective font-face weight, not merely the requested style string. Native non-header styles requesting 600 resolve to `HomeMedium`, the Medium (500) face. Header-role text resolves to `HomeHeading`, the Semibold (600) face. Loaded static faces use native `fontWeight: normal`. No typography bug was repaired or hidden by documentation.

This is a compact set of reusable rules, not an exhaustive inventory of every local color/measurement. Decorative paper-sketch colors and source-label badge variants remain in component code. The seven exported `scanColors` values and the repeated/scoped surface roles are persisted. Numeric React Native lengths are expressed as CSS-equivalent `px` values in the portable frontmatter.

## Sidecar interpretation

`design.json` is schema version 2. Token primitives live only in `DESIGN.md` frontmatter. The sidecar adds color names/roles, typography context, the observed compact threshold and ten self-contained HTML/CSS specimens of existing controls. It records no Scan shadow or animation tokens because these local components declare none. Shared sheet elevation is outside this scoped extraction.

The eight-step OKLCH strips are mathematically synthesized lightness ramps for the panel. They are not app colors, approved color variants or contrast-tested combinations. The `360px` compact threshold means widths strictly below 360 in the native source.

Specimens translate native styles to ordinary browser HTML, resolving JS colors to literals. They are documentation previews, not app components or interactive replicas of its state. Text-only specimens omit Ionicons and image assets instead of inventing replacements. The navigation specimen explicitly omits central Home artwork and icons. Font declarations require Clash Grotesk to be available to the preview; the snippets do not redistribute or load font files. Ordinary browser cursor/focus affordances are adapter behavior; the native implementation has no authored hover animation or focus-ring theme. `:active` opacity mirrors the components that declare pressed styling; the dietary panel and bottom labels have no invented opacity response.

## Verification boundary

This pass checked source values, schema shape, component token references and sidecar narrative mapping. It did not execute application tests, perform a contrast audit or inspect a native runtime. The supplied finish verdict reports that three scored corrections are resolved and ships them at the React Native Web evidence scope, using 390 by 700 and 320 by 568 browser captures. This is not native certification. The parent task is performing separate Android verification; no native pass is inferred here from the presence of a screenshot. The HTML/CSS detector has no verdict on React Native styles and was intentionally not used as a native validator.

At the time of this pass, `scan-finish-verdict.md` existed but the named `scan-finish-review.md` did not. This documentation does not fabricate its contents or provenance.

## Drift and defects not canonized

- The current notices in `DESIGN_SYSTEM.md` and `TYPOGRAPHY.md` identify Clash Grotesk, while their explicitly historical V21 bodies still describe Source Serif 4/Public Sans. Current font code wins; those historical faces are not recorded as the active system.
- The “one palette for the app” comment in `src/design-tokens.js` and older global palette prose predate this scoped Scan palette. The root system now describes both scopes without changing the shared tokens.
- The direction and implementation guides still contain an earlier “no attached Android device/emulator” observation. Native work is in progress in the parent task, so that statement is not promoted into a permanent design rule or silently treated as current test evidence.
- Retained detail sheets and a legacy price-summary branch use the existing `s.eyebrow` treatment. This pass does not promote eyebrow styling into a reusable Scan rule or repair retained app code outside its boundary.
- Native focus, large-type wrapping, camera permissions and actual device interaction need their own evidence. Browser-scoped finish approval does not establish them.
