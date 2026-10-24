# Batch 2 food photography — V14.8

Batch 2 covers Tin & Taco (119 items), Mamak Asian Street Food (70), The Stubborn Mule (84), Pig Floyd's & Pigzza (43), and Lazy Moon (97): **413 menu records**.

## What is in this release

The mobile source registry includes **61 item-associated photo references**: Tin & Taco 1, Mamak 45, Stubborn Mule 3, Pig Floyd's 6 and Lazy Moon 6. Mamak accounts for most of the additions because its official online menu attaches different photographs to named dishes. Other pictures are from official order pages, historical restaurant coverage or delivery listings. Some photos depict a customisable dish or a different location; these are marked as contextual and are **not claimed to be exact product photos**.

All 413 records have an individual entry in [the audit](../../research/batch2-photo-audit.json), containing the current menu item name and description, original photo URL where found, photo type, source/credit, missing or contextual status, four **suggested** image searches, full-image `contain` fit, required rights verification and remaining quality-control task.

The GitHub Actions photo check probes live image URLs and reports failures. The app displays food inside padded, no-crop image canvases, and handles remote errors without replacing a dish with a misleading restaurant cover photograph.

## Do not confuse URL coverage with approval

- **352 items are still missing individually matched pictures.** The app does not invent images for them.
- Live URL health is not evidence that the photograph depicts the exact dish, or that reproduction is permitted.
- Manual review should check restaurant identity, ingredient/plating match, food fully visible, sharpness, suitable background, credit, and licensing. If the original is cropped or dark, correct it **only with permission to modify the image**.
- Where no photo exists, a photorealistic illustrative reconstruction may be considered, but must accurately represent all menu ingredients, be independently checked for defects, and be explicitly labeled **AI illustration**, not an official restaurant image.
- The connected image-generation service was disabled for this work, so no AI-generated images or retouches are represented as complete.
- Menu photography is independent of ingredient/allergen assessment. Never infer dietary safety from the picture.

**Release status:** Interim GitHub-only V14.8 update. The five-restaurant Batch 2 image task is **not complete or submission-ready**.
