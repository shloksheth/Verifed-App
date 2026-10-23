# Menu photography and sources — Verifed V14.1

Food photography is for visual identification only. It is never used to infer ingredients, allergen absence, preparation methods, or dietary safety.

## Fix for repeated generic photos

V14 had a restaurant-wide fallback: the same general food image was displayed beside every item in that restaurant's menu, even though it did not depict those dishes. V14.1 removes that fallback completely.

An image can now appear beside a dish only when there is an exact product match from a reviewed source. If a photograph is missing or fails to load, the generic Verifed menu shows the item's text with no misleading image; the Taco Bell-specific menu displays a clearly labeled unavailable-photo tile. Restaurant-wide food images may still appear in a **restaurant header**, not as individual dish photos.

## Source registry

`src/verified-dish-photos.js` stores photos keyed by stable restaurant slug and stable item key.

- Taco Bell: 53 original verified product images in the source menu plus one official Cantina Chicken Bowl photo, for 54 unique items copied across all three Orlando branches (162 menu entries).
- Loving Hut Orlando: 53 uniquely matched named dish images from the official restaurant web menu saved under `research/menu-sources/loving.html`. The remaining eight sides/components lack exact pictures.
- Chipotle: the official side-of-guacamole image; other components do not inherit the same general bowl image.
- Other venues: restaurant hero photographs remain. Product photos must be independently researched and matched before they are attached to a dish.

Exact-product image matching is based on the item's published menu name and source and is not a representation of whether that item is currently available at a particular branch.

## Authenticity and image generation

Do not replace exact restaurant photography with AI-generated images while continuing to label them official or exact. Generated food art requires an explicit **Illustration** label and accurate descriptive source metadata. This avoids inventing ingredient or presentation details for people who are using menu images to recognize a particular product.

Some source images have low resolution. These should be replaced with a higher-resolution copy of the **same actual item** where one is verifiable, rather than a generic upscale or synthetic substitute presented as official.

## Remaining work

The catalog includes roughly 1,630 menu entries across 25 active restaurants. As of V14.1, 216 entries have specifically sourced item photography (162 Taco Bell, 53 Loving Hut, and 1 Chipotle). The remaining menu entries still need individual verification.

To add a photo, verify that the public source describes the same named item and that the image actually depicts it. Record a stable menu item key, image URL, accessible description, credit, and source page. Then update `verified-dish-photos.js` and extend regression coverage. A generic restaurant image is not acceptable evidence for another dish.
