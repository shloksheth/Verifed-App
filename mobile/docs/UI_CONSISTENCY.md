# V28 exception to the V26 shared palette

V26 applied the same peach, green and orange appearance across all active screens. That is **superseded for restaurant-chain menus and onboarding/authentication**. V28 restores the independent Taco Bell and Chipotle visual systems from V25 and the dark-green V25 welcome composition. Sign-in/create-account also uses a dedicated dark-green shell. Shared colors continue on Verifed's Home, Explore, Scan, Journal, and neutral support screens. The Verifed wordmark is regular-weight without a trailing orange period.

Do not propagate global `design-tokens.js` colors into `TacoBellMenu.js`, `ChipotleMenu.js`, or `Welcome.js`; do not force generic cards, gradients, or unified headings over their historic layouts. Distinct brand presentation is a deliberate product requirement, not a styling inconsistency.

---

# Shared UI consistency (V26)

This pass uses one peach canvas, warm paper cards, pale green preference panels, green selection states and carrot-orange primary actions. Restaurant logos, food photography and welcome illustration colors remain source artwork. It supersedes older scoped Scan and brand-interface color instructions.

## Related files and how they work

- `src/design-tokens.js` exports `colors` and semantic `type` objects. Page titles are 32/38 at 700, sections 22/28 at 600, card titles 17/24 at 600, body 15/23 at 400, metadata 13/20 at 400, captions 11/16 at 500 and buttons 15/21 at 600. Components spread these roles before local layout adjustments.
- `src/typography.js` resolves a requested 600 weight to the real bundled Semibold face, rather than Medium. The existing loading fallback stays intact. `tests/typography.test.js` checks that weight resolution.
- `styles.js` applies these roles to shared headings, buttons, menu rows, cards, fields, chips and sheets. Explore, profile, authentication, settings, saved items, dining lists and dish details inherit the same colors. Selected chips use green and light text.
- `App.js` uses the shared canvas for headers and Scan instead of a Scan-only background. Welcome uses the shared green. Navigation and state handling are unchanged.
- `components/Home.js` adopts shared heading/card/body roles and adds peach cuisine tiles and a pale green dietary panel.
- `components/Journal.js` adopts shared roles, a peach summary and pale green empty state. Meal history/search behavior is unchanged.
- `components/MenuScanner.js` and `ScanDesign.js` use only shared palette roles for the app interface: green capture panel, orange camera/save actions, pale green library button and peach gallery. The original menu image is content. The fixed Sayola result still has 23 authored dishes; no live OCR/model was added.
- `components/BrandIdentity.js` lets the normal Text wrapper resolve font weights instead of forcing every brand-menu label to Bold. `ChipotleMenu.js` and `TacoBellMenu.js` share menu title/card/body roles and action/selection colors while retaining actual logos and item photos.
- `components/Welcome.js` enlarges Sign in and Explore as a guest to 17 points with 24-point line height. The surrounding account prompt is 16 points. Both retain full-width touch areas of at least 44 points. The primary button and photo caption use shared orange/green roles.
- Root `DESIGN.md` and `.impeccable/design.json` record this current shared system. Historical V23–V25 documents remain historical.

## Verification

The automated suite and platform-export results are recorded in the release metadata. Browser screenshots in `research/qa/v26/` document actual reviewed states; they are React Native Web, not physical iPhone evidence. Styling does not change account, ingredient assessment or menu data logic.
