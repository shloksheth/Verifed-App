# Menu photography and sources — Verifed V14.3

Food photography is for visual identification only. It is never used to infer ingredients, allergen absence, preparation methods, or dietary safety.

## Fix for repeated generic photos

V14 had a restaurant-wide fallback: the same general food image was displayed beside every item in that restaurant's menu, even though it did not depict those dishes. V14.1 removes that fallback completely.

An image can now appear beside a dish only when there is an exact product match from a reviewed source. If a photograph is missing or fails to load, the generic Verifed menu shows the item's text with no misleading image; the Taco Bell-specific menu displays a clearly labeled unavailable-photo tile. Restaurant-wide food images may still appear in a **restaurant header**, not as individual dish photos.

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

The catalog includes roughly 1,630 menu entries across 25 active restaurants. As of V14.2, the source registry covers **267 of 1,630 active menu entries** (162 Taco Bell, 53 Loving Hut, 43 Hawkers, 2 Chipotle and 7 additional items across four other restaurants). The other **1,363 menu entries still need individually matched photographs**. The updated source URL health probe confirmed that all **51 new photo references** returned an image in GitHub Actions on 2026-10-23. Availability can still change or vary on mobile devices. The probe reports URL health separately from dish identity; editorial or cross-branch photo use may require permission and further checks before public commercial deployment.

To add a photo, verify that the public source describes the same named item and that the image actually depicts it. Record a stable menu item key, image URL, accessible description, credit, and source page. Then update `verified-dish-photos.js` and extend regression coverage. A generic restaurant image is not acceptable evidence for another dish.


## V14.3 expanded official item photographs

New item-linked records were researched from Fresh Kitchen's official menu: 29 pictures for its actual named build-your-bowl bases, toppings, proteins, sauces and bowl sizes. They use the provider's AVIF URLs; supported image rendering can vary by device and the UI will show a neutral fallback on failure. Additional individually named photographs include Reyes' Tuna Tostada, Monroe fried chicken, Strand Burger, Osprey Lobster Roll, Stubborn Mule Burger, Lazy Moon 20-inch tomato-and-mozzarella pizza, Pig Floyd's Big Floyd, Woodlands' Masala Dosai, Winter Park Biscuit's The OG, Bombay Street Kitchen's Pani Puri and Tin & Taco's Mac Attack (pictured alongside other tacos at its Lake Mary location). Editorial and cross-location sources disclose this in their alt text.

This increases catalog records with item-specific source images from 267 to **307 of 1,630 active entries**. The remaining **1,323** entries have no independently matched product photograph. All 25 restaurants still have restaurant-level imagery in their menu header, but restaurant-level photography is never automatically assigned to individual items. The three venues currently lacking any verified menu-item photograph remain Seito Sushi Baldwin Park, Sparrow, and Osteria Ester. All three still have restaurant-level hero images.

No automatically generated or generic stock food photograph is represented as an official product. Photo attribution is not a redistribution license; publishing externally hosted editorial photos commercially may require permission. Source URL checks only verify that an image responds, not copyright ownership, exact restaurant branch availability, or whether the product photo still matches the current recipe.
