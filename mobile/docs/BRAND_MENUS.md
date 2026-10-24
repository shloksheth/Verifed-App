# Taco Bell and Chipotle menus — V17.1

These screens use the restaurant's recognizable identity inside Verifed. They are independent dietary menus; buttons do not place an order. Menu records, food photos and source-based dietary assessment remain separate from presentation. Prices and calories absent from the imported records are not invented to fill the design.

## Files and behavior

`components/BrandIdentity.js` supplies the actual logos and one shared heading component. Taco Bell's bell PNG comes from its parent company's public media library. Chipotle's medallion SVG comes from Chipotle's own header. `src/brand-assets.js` preserves that SVG as a string for React Native SVG; its paths are restaurant-provided art. Both render from bundled data without a logo network request.

`BrandProvider` loads two bundled open fonts through Expo Font. Anton gives Taco Bell its tall, condensed category and product headings. Barlow Condensed supplies a similar heading hierarchy to Chipotle's proprietary Trade Gothic. These are substitutes, not the original licensed brand fonts. Their SIL Open Font Licenses are stored beside the TTF files under `assets/fonts/`. The provider uses a system font while loading or if loading fails, and makes the loaded family available through React context. `BrandHeading` applies that family without synthetic bold.

`components/TacoBellMenu.js` retains its existing search, full/diet views, favorites and customization draft. Its new presentation follows the supplied product-menu screenshot: a white logo header, uppercase horizontal category navigation with a purple underline, light gray page, square white product cards, uncropped item images, and stacked solid/outlined purple actions. The solid action opens actual ingredient details. The outline action opens the customization sheet. Two columns fit normal phones; a narrow screen uses one, and a wider layout uses three. The promotional collage is a visual reference only; its unverified or future items are not added to the data.

`components/ChipotleMenu.js` replaces the generic Chipotle restaurant screen with a dedicated component builder. The official medallion, white space, dark brown headings/actions, red accents, large ingredient photos and Protein or Veggie sections follow the current official ordering interface. Search, category tabs and the dietary view filter existing components. Select toggles a component; Review opens a sheet with each selected component's allergen flags and a Remove control. This is a local draft, not an ordering integration. On compact screens the extra guacamole hero image is hidden to bring the actual components closer to the top.

`src/chipotle-draft.js` keeps selection IDs in memory, keyed by diner mode/account plus restaurant. This lets a person inspect an ingredient or edit dietary needs and return without losing their draft. It copies arrays on read/write so UI code cannot change another stored value by reference. It does not write a database, persist after the app process closes, or share a guest draft with a signed-in account. `tests/chipotle-draft.test.js` checks restoration, isolation and copy behavior.

`components/Dining.js` routes Taco Bell and Chipotle to their respective components. Every other restaurant keeps its existing screen. Existing dish-detail navigation, source links and dietary assessment functions are reused.

`research/native-tools/assets.mjs` now includes TTF files with `font/ttf` MIME type. The Snack publisher uploads these alongside images, verifies all source hashes and reports image/font counts separately. `research/verify-snack-snapshot.py` includes fonts when comparing the downloadable saved project. `tests/snack-assets.test.js` checks that both fonts and the Taco Bell logo are in the upload inventory. No restaurant food-image approval or allergen evidence is inferred from these brand assets.

## References

- [Taco Bell U.S. menu](https://www.tacobell.com/food), plus the user's uploaded product-grid screenshot.
- [Yum! Brands media library](https://www.yum.com/wps/portal/yumbrands/Yumbrands/media-library), source of the official Taco Bell bell image.
- [Chipotle's ingredient builder](https://www.chipotle.com/order/build/burrito-bowl), visually reviewed for the logo, white layout, brown typography and ingredient-selection structure.
- `research/chain-design-sources.json` records exact asset URLs, font sources, local paths and hashes.

The Explore ordering change is explained in `LOCAL_PHOTO_PIPELINE.md`. The same five featured menus appear first in Recommended after filters are applied.
