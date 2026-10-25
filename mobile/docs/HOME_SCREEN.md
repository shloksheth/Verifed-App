# Home screen — Verifed V18

This update implements the approved scan-first Home concept in native React Native views. It retains the existing Explore, Saved, Home, Journal and You routes. Restaurant menus, authentication, journal layout, dietary assessment and backend schema are unchanged.

## Files and decisions

- `components/Home.js` owns the new Home layout and its local styles. The small `Copy` component applies Sora SemiBold to headings and DM Sans Regular/Medium to other text after Expo Font finishes loading. System text remains readable if font loading fails. `HomeHeader` is used only on Home; `HomeTab` supplies the solid green selected Home button and muted unselected state. The camera/menu sketch is code-native SVG, not a generated UI image.
- `src/home-content.js` selects the current, non-fictional Hawkers and Chipotle records by stable slug. Navigation uses their actual IDs, including cloud UUIDs. It turns only the person's selected dietary needs into chips and resolves cuisine shortcuts against the actual catalog. No menu is marked safe by this code.
- `App.js` loads the three bundled font files once, passes the selected search location into Home, uses the Home-specific header and keeps the existing navigation stack and other tabs. It forwards an optional cuisine route parameter into Explore. Leaving the welcome screen resets the shared scroll view, even though both screens use the Home route; tapping the already-selected Home tab scrolls back to the top.
- `components/Explore.js` accepts the Home cuisine shortcut, clears a stale text search/collection filter, and selects the matching existing cuisine. Other discovery filters retain their existing behavior.
- `components/Account.js` allows `home` as an explicit dietary-editor return target, alongside the existing restaurant-specific allowlist. Saving from Home unwinds to Home instead of leaving the person in their profile.
- `components/Dining.js` no longer contains the superseded Home implementation. Its menu/detail/saved components remain in place.
- `tests/home-content.test.js` checks live IDs, unavailable/fictional restaurant handling, genuine selected needs, nonmutation and catalog-grounded cuisine shortcuts.

## Real photographs and fonts

Hawkers uses the already reviewed local official Roti Canai image at `assets/food/hawkers-orlando/roti-canai.webp`. Chipotle uses a real vegetarian bowl photograph at `assets/home/chipotle-vegetarian-bowl.webp`. It is a restaurant cover, not a substitute photo for individual ingredient records. The image was cropped by the UI and optimized to WebP without generative alteration. Credit: Chipotle Mexican Grill, Inc., via Food Business News, March 4, 2019. Source: https://www.foodbusinessnews.net/articles/13410-chipotle-serving-new-plant-powered-lifestyle-bowls . Original: https://www.foodbusinessnews.net/ext/resources/2019/3/ChipotleVegetarianBowl_Lead.webp?t=1551716338&width=900 . This cover does not claim a current preset is offered or matches the user's allergies.

Sora and DM Sans come from the Google Fonts repository (`ofl/sora` and `ofl/dmsans`). Their OFL licenses are bundled in `assets/fonts/`. For reliable native rendering, static instances were produced with fontTools: Sora weight 600; DM Sans optical size 14, weights 400 and 500. Existing restaurant-specific typefaces stay confined to their menu screens.

## Functional differences from the mockup

The mockup's example recent scan is omitted because no scan exists. Upload/OCR/translation remain a separate planned update; the scan entry visibly says “Coming next” and opens a truthful explanatory sheet with a working Browse restaurant menus action. Saved remains in the navigation until scanning is built. The card arrows open menus; the existing header heart opens saved dishes rather than pretending to save whole restaurants. “Explore Orlando” avoids inventing a nearby or dietary-safety ranking. The scan button orange is slightly darker than the concept for readable white text (4.70:1 contrast).

The layout scrolls above a fixed bottom navigation and respects the existing native safe areas. It wraps long location labels, scrolls dietary chips horizontally, and uses flexible two-column cards and wrapping cuisine chips. Principal buttons have at least 44-point targets. Restaurant/menu/profile/location actions use existing functionality; there are no fake progress indicators or sample meal histories.

Each cover image fills an aspect-ratio View. This prevents React Native Web's bundled Image metadata from inserting the original photograph's 450/600-pixel height and stretching the restaurant cards. The photo uses an absolute fill inside that frame on both web and native.

`research/verify-home-assets.py` reads an actual Expo export and compares the Home photographs/font hashes with native asset metadata and web asset files. It writes `research/home-v18-asset-verification.json`, including the real Chipotle photo provenance. This complements the existing full-menu photo export checker; it does not claim native device testing.
