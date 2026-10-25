---
name: Verifed — shared mobile context and Scan extension
description: Existing app primitives with a scoped warm menu-paper visual world for Scan.
colors:
  app-cream: "#F8F7F4"
  app-paper: "#FFFFFF"
  app-ink: "#22231F"
  app-muted: "#65655F"
  app-orange: "#CA4826"
  app-orange-dark: "#AD371B"
  app-coral: "#F26B4F"
  app-peach: "#FCECE5"
  app-line: "#E6E3DD"
  app-green: "#216642"
  app-pale-green: "#EDF4EE"
  app-red: "#AD302B"
  app-pale-red: "#FCECEA"
  scan-ground: "#EDE1CE"
  scan-brown: "#443020"
  scan-cream: "#FFF8EB"
  scan-gold: "#E7BE75"
  scan-muted: "#715E49"
  scan-line: "#D9C7AA"
  scan-burgundy: "#732E30"
  scan-diet-panel: "#DBE2CA"
  scan-diet-ink: "#35462B"
  scan-diet-secondary: "#415536"
  scan-capture-copy: "#EBDCC6"
  scan-tab-paper: "#F9F0E0"
  scan-gallery-tan: "#C8AC7E"
  scan-support-paper: "#E3D2B8"
typography:
  scan-display:
    fontFamily: "Clash Grotesk"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: "37px"
    letterSpacing: "-0.6px"
  scan-display-compact:
    fontFamily: "Clash Grotesk"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "31px"
    letterSpacing: "-0.6px"
  scan-page-title:
    fontFamily: "Clash Grotesk"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "-0.5px"
  scan-restaurant:
    fontFamily: "Clash Grotesk"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "38px"
    letterSpacing: "-0.5px"
  scan-category:
    fontFamily: "Clash Grotesk"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: "29px"
  scan-dish-title:
    fontFamily: "Clash Grotesk"
    fontSize: "19px"
    fontWeight: 500
    lineHeight: "24px"
  scan-description:
    fontFamily: "Clash Grotesk"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "21px"
  scan-support-body:
    fontFamily: "Clash Grotesk"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
  scan-control:
    fontFamily: "Clash Grotesk"
    fontSize: "14px"
    fontWeight: 500
  app-body:
    fontFamily: "Clash Grotesk"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "23px"
  app-input:
    fontFamily: "Clash Grotesk"
    fontSize: "16px"
    fontWeight: 400
rounded:
  scan-card: "12px"
  scan-capture: "16px"
  scan-tab: "24px"
  app-control: "12px"
  app-card: "18px"
  app-button: "28px"
spacing:
  app-small: "8px"
  app-medium: "16px"
  app-page: "20px"
  app-section: "28px"
  scan-card-padding: "17px"
  scan-capture-padding: "22px"
  scan-compact-padding: "16px"
components:
  scan-camera-button:
    backgroundColor: "{colors.scan-gold}"
    textColor: "{colors.scan-brown}"
    rounded: "{rounded.scan-card}"
    padding: "15px"
  scan-library-button:
    backgroundColor: "{colors.scan-brown}"
    textColor: "{colors.scan-cream}"
    rounded: "{rounded.scan-card}"
  scan-tab:
    backgroundColor: "{colors.scan-tab-paper}"
    textColor: "{colors.scan-brown}"
    typography: "{typography.scan-control}"
    rounded: "{rounded.scan-tab}"
    padding: "0px 16px"
  scan-tab-selected:
    backgroundColor: "{colors.scan-brown}"
    textColor: "{colors.scan-cream}"
    typography: "{typography.scan-control}"
    rounded: "{rounded.scan-tab}"
    padding: "0px 16px"
  scan-dish-card:
    backgroundColor: "{colors.scan-cream}"
    textColor: "{colors.scan-brown}"
    rounded: "{rounded.scan-card}"
    padding: "{spacing.scan-card-padding}"
  scan-diet-panel:
    backgroundColor: "{colors.scan-diet-panel}"
    textColor: "{colors.scan-diet-ink}"
    rounded: "{rounded.scan-card}"
    padding: "13px"
  app-search-input:
    backgroundColor: "{colors.app-paper}"
    textColor: "{colors.app-ink}"
    typography: "{typography.app-input}"
    rounded: "{rounded.app-control}"
    padding: "13px 14px"
  app-primary-button:
    backgroundColor: "{colors.app-orange}"
    textColor: "{colors.app-paper}"
    rounded: "{rounded.app-button}"
    padding: "14px 18px"
  scan-save-button:
    backgroundColor: "{colors.scan-brown}"
    textColor: "{colors.app-paper}"
    rounded: "{rounded.app-button}"
    padding: "14px 18px"
---

# Design System: Verifed

## Overview

**Creative North Star: "Warm menu paper"**

This descriptive name records the implemented Scan surface: brown capture material, gold camera action, cream menu paper and a tan illustration rail. Clash Grotesk, native controls and the carrot/check identity connect it to the existing app. The requested brown, cream and gold reference governs Scan alone.

This is a scoped extension, not a replacement identity. `app-*` tokens record the existing shared palette and primitives; `scan-*` tokens govern the Scan route and its local presentation. Home keeps its existing peach/coral/green treatment, with a neutral scan-icon thumbnail. Shared sheets, fields, errors and bottom navigation retain the app palette even while opened from Scan. The frontmatter records CSS-equivalent lengths; React Native source uses numeric logical units.

**Key Characteristics:**

- Warm tonal layers for Scan capture and menu reading.
- One shared Clash Grotesk family with explicit semantic font selection.
- Full framed dish illustrations alongside readable menu text.
- Existing navigation and shared utility controls remain visually continuous.

## Colors

The Scan palette is toasted brown, cream and gold; the shared app palette remains light neutral with coral actions and green selection.

### Primary

- **Scan brown / gold:** brown anchors the capture panel, selected tabs, dish text and save action; gold identifies the camera action.
- **App orange / orange-dark / coral:** existing shared actions, links and accent surfaces. These remain appropriate outside the scoped Scan presentation and in retained utility components.

### Secondary

- **Scan burgundy:** restaurant title, source links and conflict/review text.
- **Scan dietary panel / ink / secondary:** the dietary settings panel and its text. These indicate preferences and written-menu comparison, never certified allergy safety.
- **App green / pale-green / red / pale-red:** existing selection and error/conflict roles; Scan retains shared errors and navigation.

### Neutral

- **Scan ground:** Scan root, status and header backgrounds in `App.js`.
- **Scan cream / tab-paper:** menu paper, dish cards and unselected tabs.
- **Scan gallery-tan / support-paper:** illustration rail and lower source/saved-menu panels.
- **Scan muted / line / capture-copy:** secondary labels, paper divisions and light capture guidance.
- **App cream / paper / ink / muted / peach / line:** existing canvas, working surfaces, text, muted text, Home scan panel and shared borders.

**The Scoped Palette Rule.** Apply Scan tokens to Scan presentation. Preserve shared tokens for retained app primitives and other screens.

## Typography

**Display Font:** Clash Grotesk, local static Semibold/Bold faces.
**Body Font:** Clash Grotesk, local Regular/Medium/Bold faces. Native system text is the loading/failure fallback.

`mobile/src/use-app-fonts.js` loads `HomeHeading` as Semibold, `HomeHeadingStrong` and `HomeStrong` as Bold, `HomeBody` as Regular and `HomeMedium` as Medium. `Typography.js` and `src/typography.js` select these faces; loaded text sets native `fontWeight` to `normal` because weight is supplied by the font file.

The frontmatter records effective face weights. A non-header style requesting 600 resolves to the Medium face (500); a semantic header requesting 600 resolves to Semibold (600). For example, the capture heading is Semibold while dish names and camera labels resolve to Medium. This distinction is observed behavior, not a recommendation to add synthetic weights.

### Hierarchy

- **Display:** capture heading, with the compact size below the observed narrow-width threshold.
- **Headline:** page title and restaurant name use separate roles; restaurant identity gains burgundy, not another family.
- **Title:** category headers and dish titles keep a clear size distinction.
- **Body:** dish descriptions and support text use the smaller reading roles; the existing shared body role remains in sheets.
- **Label:** Scan tabs use the control role; prices are Medium at 16 and supporting diet notes are Regular at 12/18. Sizes and line heights are native logical units.

**The Shared Face Rule.** Use the existing typography wrappers and font readiness lifecycle. Restaurant logos and Ionicons retain their own artwork.

## Layout

The shared scroll container has page padding (20), inter-section gap (20), bottom padding (36), full width and a centered maximum width (760). Scan uses a single vertical reading flow with separately horizontal language/category controls and illustration cards. Source actions and gallery headings wrap. Dish names flex while prices resist shrinking.

At widths below 360, `CaptureMenu` reduces its panel padding to 16, gap to 10, headline to the compact role, geometry to 64 by 72, body copy to 14/20 and camera minimum height to 48. The normal capture panel uses padding 22, gap 17 and a camera minimum height of 54. The library action and tabs have minimum heights of 48 and 44 respectively. These are component minimums, not a completed touch-target audit of every screen.

The illustration rail extends 12 beyond its local content edge, has 14 horizontal inner padding and 12 card gaps. Each card is 192 wide, with a 192 by 160 image frame. `contentFit="contain"` preserves whole plated dishes. The original source page also uses containment inside an explicit aspect-ratio frame. These intentional horizontal scrollers do not justify page-level overflow.

## Elevation & Depth

The Scan-specific presentation has no shadow or native elevation declarations. Brown capture material, cream cards, tan rails, subtle borders and the rotated paper sketch provide depth through tone and shape. Shared sheet presentation remains governed by the existing shared styles; this scoped document does not redefine its elevation.

**The Tonal Paper Rule.** Use the existing Scan surface colors and borders to separate capture, controls, illustrations and reading text.

## Shapes

Scan cards, fields and camera/library actions use gently rounded corners. The capture panel is slightly rounder; language and category tabs are pills. The neutral capture sketch rotates 9 degrees. Home's retained neutral thumbnail rotates 8 degrees inside its existing peach panel. Rounded illustration frames clip artwork while containment preserves the full food framing.

## Components

### Buttons

The Scan camera action is solid gold with brown text and Ionicons; the library action is an outlined action on the brown panel (border `#897253`). Scan-specific Pressables reduce opacity to 0.65 when pressed; the two capture actions use the same treatment while busy and are disabled during picker work. There is no authored hover animation or focus-ring theme in these components.

The save action reuses the shared pill button with a brown background override and shared white text. Shared buttons retain their minimum height of 52, app colors and 0.45 pressed/busy/disabled opacity in the retained utility flows.

### Chips

ScanTabs are native tab-role Pressables in a horizontal ScrollView. Unselected tabs use warm paper and a Scan line border; selection uses brown with cream text and the same brown border. Selection is also exposed through accessibility state. Printed source labels are compact green badges, not interactive tabs.

### Cards / Containers

The capture panel contains neutral paper/camera geometry. Menu paper groups the restaurant, source, count and source actions. Text dish cards preserve a name/price row, description and dietary/source notes. Illustration cards show one matched dish with its name, price and detail affordance; the rail explicitly calls them “Dish illustrations.” The rail disappears for edited menus to avoid mismatched artwork.

### Inputs / Fields

Scan search and correction fields reuse `UI.Field` and the existing app input: white, app line border, rounded corners and a minimum height of 52. Labels, error treatment, keyboard reveal behavior and text wrappers stay shared. No separate Scan input focus/error theme is implemented.

### Navigation

Explore, Scan, Home, Journal and You remain the five bottom destinations. Existing white navigation, green selection, central Home treatment, logo and header controls retain the shared app palette. Only the Scan route's outer root/status/header background is tinted with Scan ground.

## Do's and Don'ts

### Do:

- **Do** keep Scan palette changes scoped to its route and local presentation.
- **Do** use the shared Clash Grotesk wrappers and their native font-loading fallback.
- **Do** contain source pages and dish illustrations so full content remains visible.
- **Do** label generated dish artwork as illustrations and retain readable text for all menu dishes.
- **Do** keep dietary colors tied to preferences and written-menu comparison.

### Don't:

- **Don't** propagate Scan brown/gold tokens across existing screens as a global redesign.
- **Don't** show a preselected restaurant menu or original-page link before a menu exists.
- **Don't** replace absent dish artwork with an unrelated dish image.
- **Don't** infer native rendering, camera behavior or allergy safety from browser captures or token values.

Source evidence and verification boundaries are recorded in [.impeccable/scan-documentation.md](.impeccable/scan-documentation.md). Existing app rationale remains in [mobile/docs/DESIGN_SYSTEM.md](mobile/docs/DESIGN_SYSTEM.md), current font context in [mobile/docs/TYPOGRAPHY.md](mobile/docs/TYPOGRAPHY.md), and implementation details in [mobile/docs/MENU_SCANNING.md](mobile/docs/MENU_SCANNING.md).
