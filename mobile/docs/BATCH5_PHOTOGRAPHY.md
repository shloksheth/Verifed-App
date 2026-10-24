# Verifed Batch 5 food photography

This update is based on **V14.8** and covers the remaining active Batch 5 restaurants: Hawkers Orlando, Loving Hut Orlando, and three Taco Bell locations. Tako Cheena remains retired and is deliberately excluded.

## Coverage

| Venue | Live menu entries | Entries with an image | Official or brand-specific | Representative |
| --- | ---: | ---: | ---: | ---: |
| Hawkers Orlando | 49 | 49 | 46 | 3 |
| Loving Hut Orlando | 61 | 61 | 53 | 8 |
| Taco Bell South Orange | 116 | 116 | 116 | 0 |
| Taco Bell East Colonial | 116 | 116 | 116 | 0 |
| Taco Bell Orlando West | 116 | 116 | 116 | 0 |
| **Total** | **458** | **458** | **447** | **11** |

The Taco Bell locations share the same 63 newly keyed branded product references, while retaining 53 preexisting inline photos each. We matched the **product name and original image alt text** on Taco Bell's own breakfast, nachos, quesadilla, combo, party-pack, bowl and snacks/sweets pages. A limited-time celebrity combo was matched from its official JSON product record.

Hawkers photos include 43 original official menu photos and three newly matched Lo Mein variations. Chicken is sourced from Hawkers' own page; the steak and shrimp variants come from Hawkers' menu images for other cities. Three protein variants/toppings without an authenticated image use **clearly labeled representative** photography.

Loving Hut includes 53 original photos from the Orlando restaurant's menu and eight **clearly labeled representative side-dish images**, including one public-domain yellow-rice image. They are not photographs of the restaurant's specific side portions.

## QA and limitations

- A GitHub Actions probe checked 226 unique URLs for the 458 menu entries. All **226/226 URLs** returned image content at validation time, though external hosts can change.
- Product tiles show complete images using the app's existing `resizeMode="contain"` image presentation, not destructive center crops.
- The menu may include representative imagery from other restaurants or editorial sources. This must not be represented as the exact restaurant dish, and all third-party imagery needs publication-rights review before wider release.
- We compared official Taco Bell product names with matching alt text but did **not** complete manual high-resolution visual inspection and retouching of every photograph.
- A generated Loving Hut salad study exists as a separate design asset, but it is **not part of this app build**. No AI-generated image has been substituted into the deployed menu without a reliable bundled asset.
- Neither photography nor menu text certifies ingredients, allergy safety, cross-contact prevention, or current stock. A user should still confirm needs with restaurant staff.

See `research/batch5-photo-qa-manifest.json` for every item, source, credit, illustrative status and outstanding rights review.
