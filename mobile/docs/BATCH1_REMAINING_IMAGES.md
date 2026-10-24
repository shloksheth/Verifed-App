# Batch 1 — Pizza Bruno & Winter Park Biscuit image audit (V14.7)

This batch covers **all 109 menu records** from Pizza Bruno Curry Ford (68) and Winter Park Biscuit Company (41). The machine-readable ledger is `research/batch1-pizza-wpbc-photo-audit.json`. Of these 109 items, **27 have separately sourced food images** (Pizza Bruno 16, Winter Park Biscuit 11). **82 do not yet have a trustworthy individual picture**. Missing entries intentionally remain without a dish photo to avoid showing unrelated food.

The photo reference source and alt text are stored per menu key in `mobile/src/verified-dish-photos.js`; `mobile/src/local-catalog.js` surfaces them in the app. `DishPhoto` uses an uncropped **contain** layout so the whole meal is visible. Unavailable images disappear rather than silently substituting one restaurant-wide thumbnail.

## Sourcing and checks

- Official Pizza Bruno Curry Ford menu photos were found for BIG RIG, Kbar, Lover Boy Blue, Viva Verde, and Chopped Salad, among others. Some additional Pizza Bruno photos come from its College Park/Maitland branches and are clearly labeled representative. Restaurant menus and editorial coverage were consulted for the descriptions.
- Winter Park Biscuit's official website contributed a photo of its spicy chicken sandwich. Other exact or named-item photographs were found in Orlando Weekly, Orlando Magazine, HappyCow, and ordering listings. Some of the 11 are **explicitly representative from other restaurants or recipes**, not authentic WPBC dishes.
- All 27 linked images returned image content in an automated GitHub Actions HTTP check. This confirms URL accessibility at that moment only, not a visually correct dish or permission to reuse the picture.
- All entries include `alt`, `credit`, `sourceUrl`, and `kind`. Contextual/representative images are clearly distinguished from verified item photos. No photo is evidence of ingredient safety, exact recipe, allergen clearance or stock availability.
- The current remote ordering pages frequently returned HTTP 403/anti-bot challenges when programmatically inspected. Image candidate generation was also unavailable because the connected Canva image-generation tool was disabled by the account administrator. **No AI-generated images or external image edits are claimed.**

## Before submission

Complete individually matched image sourcing or licensed realistic illustration for all remaining 82 records, verify every picture visually against the dish description, remove any off-brand photos not accurate enough, check mobile image framing, and obtain necessary commercial image permissions. A published menu entry may be seasonal, out of stock, or modified since the review. Do not represent the version as having 109 exact restaurant dish photos.

The first three Batch 1 restaurants were previously handled in Verifed V14.6 and are documented in `research/batch1-image-qa-manifest.json`. Their image choices are preserved.
