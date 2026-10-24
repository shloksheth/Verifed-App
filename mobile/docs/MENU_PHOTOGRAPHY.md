# Menu photography and sources — Verifed V14.5

Food photography is for visual identification only. It is never used to infer ingredients, allergen absence, preparation methods, or dietary safety.

## Fix for repeated generic photos

V14 had a restaurant-wide fallback: the same general food image was displayed beside every item in that restaurant's menu, even though it did not depict those dishes. V14.1 removes that fallback completely.

An image can now appear beside a dish only when there is an exact product match from a reviewed source. If a photograph is missing or fails to load, the generic Verifed menu shows the item's text with no misleading image; the Taco Bell-specific menu displays a clearly labeled unavailable-photo tile. Restaurant-wide food images may still appear in a **restaurant header**, not as individual dish photos.

## V14.4 covers and visual consistency

Each active restaurant's discovery card and menu header now prioritizes a **sourced food photograph**, not a logo, dining room or indiscriminate generic food image. The cover resolver searches the individually reviewed `verified-dish-photos.js` registry first, then a credited restaurant-specific food photograph from `menu-photos.js`. An original restaurant image is retained as a fallback if the selected remote photo fails.

This food-cover photo identifies the restaurant but **does not depict every listed menu item**. A menu row still receives a photo only when its own item key has an independently sourced exact photo; the earlier repeated-default bug is not reintroduced.

The catalog includes **25 active restaurants, all with food covers**, including the previously item-photo-empty Seito Sushi and Sparrow venues, which have credited restaurant food photography but no independently verified item-specific photo yet. Osteria Ester now has its own photographed Spaghetti alle Vongole from the MICHELIN Guide. The individual item-photo count has increased from V14.3's 307 to **308/1,630 active menu entries**. Another **1,322 entries** still need original dish-specific photographs, quality evaluation, and permission checks.

No AI-generated food is represented as a real dish and no dietary claims are inferred from photography.

## Source registry

`src/verified-dish-photos.js` stores photos keyed by stable restaurant slug and stable item key.

- Taco Bell: 53 original verified product images in the source menu plus one official Cantina Chicken Bowl photo, for 54 unique items copied across all three Orlando branches (162 menu entries).
- Loving Hut Orlando: 53 uniquely matched named dish images from the official restaurant web menu saved under `research/menu-sources/loving.html`. The remaining eight sides/components lack exact pictures.
- Chipotle: the official side-of-guacamole image; other components do not inherit the same general bowl image.
- V14.2 adds **43 product-specific images from Hawkers' own published dining menu**, replacing an inaccessible editorial wings URL and an older third-party Pad Thai URL. The images match the named menu items. It also adds eight images across Chipotle, Black Rooster, Pizza Bruno, Mamak and Yellow Dog Eats, keyed to their named dishes. This avoids reusing generic restaurant photos for unrelated menu entries. Individual sources, attribution and accessible descriptions are recorded per key in `verified-dish-photos.js`.
- Third-party editorial photos may show an older presentation, portion or a related location. This is disclosed in their item alt text; the image is not evidence of current stock or exact recipe.
- Other venues: restaurant hero photographs remain, but item images must be independently sourced before appearing beside a particular dish.

Exact-product image matching is based on the item's published menu name and source and is not a representation of whether that item is currently available at a particular branch.

## Authenticity and image generation

Do not replace exact restaurant photography with AI-generated images while continuing to label them official or exact. Generated food art requires an explicit **Illustration** label and accurate descriptive source metadata. This avoids inventing ingredient or presentation details for people who are using menu images to recognize a particular product.

Some source images have low resolution. These should be replaced with a higher-resolution copy of the **same actual item** where one is verifiable, rather than a generic upscale or synthetic substitute presented as official.

## Remaining work

As of V14.4, 308 of 1,630 active menu entries have independently mapped food images. The remaining 1,322 items retain neutral placeholders. Restaurant-level food covers exist for all 25 active venues; these do not count as exact item photographs. The updated source URL health probe confirmed that all **51 new photo references** returned an image in GitHub Actions on 2026-10-23. Availability can still change or vary on mobile devices. The probe reports URL health separately from dish identity; editorial or cross-branch photo use may require permission and further checks before public commercial deployment.

To add a photo, verify that the public source describes the same named item and that the image actually depicts it. Record a stable menu item key, image URL, accessible description, credit, and source page. Then update `verified-dish-photos.js` and extend regression coverage. A generic restaurant image is not acceptable evidence for another dish.


## V14.3 expanded official item photographs

New item-linked records were researched from Fresh Kitchen's official menu: 29 pictures for its actual named build-your-bowl bases, toppings, proteins, sauces and bowl sizes. They use the provider's AVIF URLs; supported image rendering can vary by device and the UI will show a neutral fallback on failure. Additional individually named photographs include Reyes' Tuna Tostada, Monroe fried chicken, Strand Burger, Osprey Lobster Roll, Stubborn Mule Burger, Lazy Moon 20-inch tomato-and-mozzarella pizza, Pig Floyd's Big Floyd, Woodlands' Masala Dosai, Winter Park Biscuit's The OG, Bombay Street Kitchen's Pani Puri and Tin & Taco's Mac Attack (pictured alongside other tacos at its Lake Mary location). Editorial and cross-location sources disclose this in their alt text.

This increases catalog records with item-specific source images from 267 to **307 of 1,630 active entries**. The remaining **1,323** entries have no independently matched product photograph. All 25 restaurants still have restaurant-level imagery in their menu header, but restaurant-level photography is never automatically assigned to individual items. The three venues currently lacking any verified menu-item photograph remain Seito Sushi Baldwin Park, Sparrow, and Osteria Ester. All three still have restaurant-level hero images.

No automatically generated or generic stock food photograph is represented as an official product. Photo attribution is not a redistribution license; publishing externally hosted editorial photos commercially may require permission. Source URL checks only verify that an image responds, not copyright ownership, exact restaurant branch availability, or whether the product photo still matches the current recipe.


## V14.5 — Full-photo framing and menu-item audit

- All individually sourced menu photos now use `resizeMode="contain"` in the shared menu component; Taco Bell also uses it in its custom ordering-style menu. Menu images are displayed on white backgrounds with taller image frames so pizzas, bowls and tall food products remain fully visible rather than being cropped.
- Seven new dish-photo matches have source URLs and image credits for Seito Sushi Baldwin Park (hand-made dumplings), Sparrow (Say Cheese), Reyes Mezcaleria (guacamole), Winter Park Biscuit Company (WPBC Box, pictured without every part of the combo), Mamak (Nasi Goreng Indonesia and Pad Thai), and Lazy Moon Mills 50 (Garden Grazer slice).
- `research/menu-image-coverage-v14.5.csv` enumerates **all 1,630 active menu records**, including image status and source page. Only **314 entries currently have individually matched photos**; **1,316 still need their own verified image**. The registry contains at least one per-item image for all 25 active venues. No existing images were duplicated to conceal gaps.
- Third-party URLs and historical photos remain subject to availability and permission. A network health test probes newly added URLs, but photo matches still require human visual verification before a claim of complete catalog coverage.
- The source registry has no property or transformation implying that edited/generated photos are official products. Synthetic restaurant depictions must be clearly labeled as illustrations and not used as evidence of exact ingredient combinations.
