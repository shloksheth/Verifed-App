# Verifed mobile frontend

The active CAC app has five labeled tabs: Explore, Saved, Home, Journal and You. Home is the central action. The app is written in React Native, using real native views and Expo; its web preview uses React Native Web.

V18 moves Home into `components/Home.js`, with its scoped Sora/DM Sans typography, local real Hawkers/Chipotle cover photographs and solid green selected Home tab. [HOME_SCREEN.md](HOME_SCREEN.md) explains every related file, navigation change, image/font source and the explicitly planned scanning entry. Other screen designs remain unchanged.

`App.js` subscribes to the API's external store, keeps a small navigation stack, handles Android Back, source menu deep links and the personal meal-composer sheet. Its route switch contains no scanner, restaurant workspace or kitchen-request route. Saved/profile editors return to the right screen; a successful restaurant-specific profile edit unwinds the stack instead of reopening a saved form.

`components/UI.js` provides accessible buttons, fields, tabs, chips, sheets, notices and task state. `FormScrollContext` exposes the enclosing scroll view so field focus can keep a keyboard-covered control in view. Tabs and selection controls include explicit ARIA state for the web preview alongside native accessibility state.

`components/Dining.js` implements discovery, search, cuisine filters, restaurant menus, dish details and saved dishes. `RestaurantPhoto` renders official remote imagery with alternative text, a linked source on menu heroes, a contained layout for brand artwork, and a neutral fallback if loading fails. A restaurant photo never purports to identify an individual dish's recipe.

`components/AllergenIcons.js` draws the nine allergen symbols using scalable SVG and always includes readable labels. It distinguishes published declarations, recognizable ingredient clues, possible recipe flags and missing information. Full menu and For my diet retain the same category organization.

`components/Account.js` contains optional authentication, dietary-profile editing, device/account settings, export, clearing and help. `components/Journal.js` handles a personal meal form, star ratings, searchable history and meal detail. Guest users can save and journal directly on their device; these features do not require an Expo Go OAuth callback.

`styles.js` contains the shared warm cream, green and carrot palette; typography; photo crops; menu paper and dividers; selected chips; sheets; and safe-area-friendly bottom navigation. `assets/verifed-mark.png` is the carrot-check brand asset. Real restaurant imagery remains credited in the source metadata.

Older Scanner, Requests and Workspace modules remain in source history for explanation of the earlier business prototype, but the CAC app does not import them from its entry point. They are excluded from the new public Snack upload. Their earlier documentation is preserved separately. The current interface chapter, catalog chapter and device-library chapter describe this release.
