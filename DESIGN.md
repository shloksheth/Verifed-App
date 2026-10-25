---
name: Verifed shared mobile design
description: One palette and Clash Grotesk type scale across all active screens.
colors:
  cream: "#FFF0E2"
  paper: "#FFF9F2"
  ink: "#292E25"
  muted: "#5E6759"
  orange: "#BD4220"
  orangeDark: "#AD371B"
  coral: "#F26B4F"
  peach: "#F6D9C4"
  line: "#E3CAB5"
  green: "#216642"
  paleGreen: "#DCEBD8"
  red: "#AD302B"
  paleRed: "#FCECEA"
  surface: "#FAE6D5"
  onGreen: "#FFF9F2"
typography:
  family: "Clash Grotesk"
  page: "32px / 38px, 700"
  section: "22px / 28px, 600"
  card: "17px / 24px, 600"
  body: "15px / 23px, 400"
  meta: "13px / 20px, 400"
  caption: "11px / 16px, 500"
  button: "15px / 21px, 600"
---

# Verifed V26

`mobile/src/design-tokens.js` is the implementation source for color and type roles. This shared system supersedes V24's separate brown/gold Scan palette.

Use peach canvas, warm paper for readable cards, and pale green for preference panels. Orange is the primary action color; green identifies selection and supporting actions. Red signals dietary conflicts or destructive actions. Keep actual restaurant logos, food photos, and the four authored welcome-art backgrounds.

Use the shared page, section, card, body and control roles through the existing Typography wrappers. Regular, Medium, Semibold and Bold are separate bundled Clash Grotesk faces. Welcome artwork can use a larger display heading. Welcome guest and sign-in links use 17-point text and at least 44-point touch areas.

Scan uses the same green, orange, peach and warm paper as every other screen. Its source photograph keeps the original restaurant colors as content. The scan result is still an authored Sayola presentation, not live OCR or AI.

See `mobile/docs/UI_CONSISTENCY.md` for the code map and verification limits.
