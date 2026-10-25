# Verifed mobile frontend

V25.5 applies only the approved slogan and Taco Bell icon changes. [OLIUR_APPROVED_CHANGES.md](OLIUR_APPROVED_CHANGES.md) explains the related files.

V25 applies Apple UI tips to small text, touch targets and a low-contrast menu label. [APPLE_UI_TIPS.md](APPLE_UI_TIPS.md) explains all related files and the separate pending Oliur proposals.

V24 redesigns Scan with the supplied Sayola menu, a capture-first screen and a brown/cream/gold result layout. [MENU_SCANNING.md](MENU_SCANNING.md) explains every related file, the fixed presentation behavior and four generated dish illustrations.

V23 adds the photo-carousel welcome screen. [WELCOME_SCREEN.md](WELCOME_SCREEN.md) explains its layout, navigation, image sources and controls.

V22.1 uses Clash Grotesk throughout the active interface. [TYPOGRAPHY.md](TYPOGRAPHY.md) explains the four bundled faces, their official source/license, loading aliases and verification.

V22 updates SDK 54 patch dependencies and adds Android Expo Go verification. [RUNTIME_VERIFICATION.md](RUNTIME_VERIFICATION.md) explains the related manifest, verifier and device-test files.

The active CAC app has five labeled tabs: Explore, Scan, Home, Journal and You. Home is the central action. The app is written in React Native, using real native views and Expo; its web preview uses React Native Web.

V21 updates the active interface with Source Serif 4/Public Sans, one shared palette, photo-led Home, real Home ingredient search, a clearer Journal and a shorter copy system. [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) explains every related file and research source; [COPY_REWORK.md](COPY_REWORK.md), [JOURNAL_DESIGN.md](JOURNAL_DESIGN.md) and [TYPOGRAPHY.md](TYPOGRAPHY.md) cover the detailed changes. The V20 fixed-menu scan behavior remains a scripted presentation, with updated styling.

The following V18/V19 notes describe earlier checkpoints; V21's design guide supersedes their visual system.

V18 moves Home into `components/Home.js`, with its scoped Sora/DM Sans typography, local real Hawkers/Chipotle cover photographs and solid green selected Home tab. [HOME_SCREEN.md](HOME_SCREEN.md) explains every related file, navigation change, image/font source and the explicitly planned scanning entry. Other screen designs remain unchanged.

The scanning update extends the approved Sora/DM Sans typography to every active
screen, including restaurant menus, sheets and input fields. Shared text wrappers
preserve readable system fallbacks while fonts load; [TYPOGRAPHY.md](TYPOGRAPHY.md)
explains the files, face selection, accessibility and tests. Brand logos and
Ionicons keep their original artwork and symbol fonts.

`App.js` subscribes to the API's external store, keeps a small navigation stack, handles Android Back, source menu deep links and the personal meal-composer sheet. The MenuScanner route supports photo review and, in V20, a deliberately fixed translation of the printed 2cero7 menu for the presentation. Any successful photo opens that same text; no live OCR/model is connected. [MENU_SCANNING.md](MENU_SCANNING.md) explains its source, code and scope. It does not restore the retired business QR scanner, workspace or kitchen-request routes. Saved dishes remain behind the header heart. Saved/profile editors return to the right screen; a successful restaurant-specific profile edit unwinds the stack instead of reopening a saved form.

`components/UI.js` provides accessible buttons, fields, tabs, chips, sheets, notices and task state. `FormScrollContext` exposes the enclosing scroll view so field focus can keep a keyboard-covered control in view. Tabs and selection controls include explicit ARIA state for the web preview alongside native accessibility state.

`components/Dining.js` implements discovery, search, cuisine filters, restaurant menus, dish details and saved dishes. `RestaurantPhoto` renders official remote imagery with alternative text, a linked source on menu heroes, a contained layout for brand artwork, and a neutral fallback if loading fails. A restaurant photo never purports to identify an individual dish's recipe.

`components/AllergenIcons.js` draws the nine allergen symbols using scalable SVG and always includes readable labels. It distinguishes published declarations, recognizable ingredient clues, possible recipe flags and missing information. Full menu and For my diet retain the same category organization.

`components/Account.js` contains optional authentication, dietary-profile editing, device/account settings, export, clearing and help. `components/Journal.js` handles a personal meal form, star ratings, searchable history and meal detail. Guest users can save and journal directly on their device; these features do not require an Expo Go OAuth callback.

`styles.js` contains the shared warm cream, green and carrot palette; typography; photo crops; menu paper and dividers; selected chips; sheets; and safe-area-friendly bottom navigation. `assets/verifed-mark.png` is the carrot-check brand asset. Real restaurant imagery remains credited in the source metadata.

Older Scanner, Requests and Workspace modules remain in source history for explanation of the earlier business prototype, but the CAC app does not import them from its entry point. They are excluded from the new public Snack upload. Their earlier documentation is preserved separately. The current interface chapter, catalog chapter and device-library chapter describe this release.
