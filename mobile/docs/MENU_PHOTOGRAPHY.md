# Food photography and image provenance (V14)

The active mobile catalog has 25 restaurants and 1,630 published menu entries. Tako Cheena remains retired. Images are part of presentation and are never used to infer ingredients, allergens, dietary matches, or food safety.

## How an image is chosen

1. A dish with a sourced `imageUrl` takes precedence and is labeled **Menu item**. This currently covers 53 Taco Bell products repeated across three Orlando branch menus, or 159 menu entries, plus the separately sourced Chipotle guacamole component. Official product photos are not inferred from similar dish names.
2. Otherwise, `src/menu-photos.js` selects a sourced restaurant-specific image. These images are labeled **Restaurant photo** because the item pictured may be different.
3. If an image fails to load, the interface falls back to a neutral restaurant icon. It does not silently substitute an unrelated dish.
4. The restaurant menu hero prefers a food photo to a venue interior where a sourced food photograph was identified.

Images are identified via `imageUrl`, `imageAlt`, `imageCredit`, or the reviewed source registry. Product-level images from the published source catalog are copied into `localDishes` and persist through public cloud-row merging. This means Taco Bell menu photos show in the app, rather than being discarded by the existing local catalog transformation.

**Image sources:** existing reviewed `research/restaurant-images.json` URLs, product URLs from `research/requested-menu-data.json` and the generated `restaurant-menus.js`, plus restaurant-specific food image URLs documented in `src/menu-photos.js`. Some representative images are credited to restaurant ordering pages or editorial coverage rather than the restaurant's own server. Image providers can remove URLs, block hotlinking or change assets over time. The application therefore includes `onError` fallbacks. A loaded photo is not proof that a listed product is stocked by an Orlando branch.

## User experience

Both **Full menu** and **For my diet** now show consistent food thumbnails beside menu records and continue to show allergen flags, dietary statuses and source links. Dish detail has a large photo with the same provenance label. The restaurant header displays a sourced food photograph where available.

Exact product photos and representative images have different captions and accessible descriptions. A disclaimer above each menu states that restaurant photos might not depict the named item. No image is a statement of dietary safety. Restaurant menu styling and dietary assessment logic are unchanged.

The current source catalog does **not** provide a verified exact dish image for every individual menu entry. This release makes food imagery available throughout all active restaurant menus without inventing or mislabeling exact dish photos. Replacing representative photos with exact official images can continue as additional verifiable assets become available.
