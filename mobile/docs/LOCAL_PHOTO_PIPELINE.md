# Local menu photographs

This migration is in progress. `research/local-photo-coverage.json` is the current count, and `research/local-photo-manifest.json` records one decision for every active menu entry. A successful download is never a visual approval. Unfinished items still use the existing remote-photo behavior; the app is not yet an all-local image release.

## How an image reaches the app

1. `research/prepare-local-photo-review.mjs` reads the current catalog and published menu records. It stores each item's name, description, ingredients, explicit serving size, source menu and recipe hash. A changed recipe clears its previous approval.
2. `research/discover-official-photo-candidates.py` reads official menu HTML and records images whose alternative text matches an item name. This only discovers candidates. It does not infer ingredients or approve a match.
3. `research/download-photo-candidates.py` downloads candidates, decodes them with Pillow, preserves transparency, limits dimensions to 1,200 pixels and saves WebP files in the ignored review cache. It records file and pixel hashes. An approved selected image is not silently replaced by a later download.
4. `research/photo-review-sheets.py` creates labeled contact sheets for visual comparison. Inspect the actual food, recipe, portion, framing and resolution. If no accurate real photo is immediately available, record a search and visually compare at least four actual candidates. A search result title alone is insufficient.
5. When generation or reconstruction is necessary, `research/register-generated-photos.py` accepts a JSON list with `catalogKey`, `prompt`, `sourceFile` and an optional `referenceFile`. It converts the output to WebP and records the full prompt, generator, time, original hash and reference identity. It leaves the result unapproved. Inspect the optimized WebP before entering a decision in the manifest.
6. `research/build-local-food-assets.mjs` promotes only entries with all five visual checks passed, a selected candidate, dated notes and unchanged source bytes. It rejects stale recipes, contextual/representative sources and repeated pixel content. It copies final files into `mobile/assets/food/<restaurant>/<item>.webp` and writes the two app registries.
7. `research/verify-local-food-images.py` decodes every approved final WebP again, checks dimensions, hashes and duplicate pixels, and updates the coverage report. `--require-complete` also fails if even one active entry remains unapproved.

`research/register-researched-candidates.py` accepts a JSON list of item keys, queries and source candidates. It records real downloaded search alternatives with an initial inspected count of zero. Update that count only after actually comparing them, and retain reasons for rejection.

## Runtime files

`mobile/src/local-food-assets.js` contains static `require` calls. Metro needs these static paths to package images on iOS, Android and web. Do not replace them with constructed strings.

`mobile/src/local-food-photo-metadata.js` contains local paths, alternative text, credits, dimensions, hashes and a generated-image flag. External source URLs and full prompts stay in the internal research manifest, rather than being requested to display an approved image.

`mobile/components/Dining.js` and `mobile/components/TacoBellMenu.js` prefer an approved local asset and its metadata. Their `contain` sizing keeps the food visible. General menu cards identify generated illustrations. Unapproved entries retain legacy behavior until their replacements pass review; this checkpoint does not claim that those images meet the new requirements.

`research/native-tools/assets.mjs` recursively lists supported image assets and their MIME types. `research/native-tools/publish.mjs` uses that list to upload WebP assets to Snack and records their hashes. It previously included only the logo. Publishing is separate from visual approval.

## Reproduce the checks

Run from the repository root:

```powershell
node research/prepare-local-photo-review.mjs
node research/build-local-food-assets.mjs
python research/verify-local-food-images.py
npm test --prefix mobile
python research/verify-local-food-images.py --require-complete
```

The last command is the completion gate and must fail during an incomplete migration. `mobile/tests/local-food-assets.test.js` checks inventory parity, unchanged approved bytes, provenance, uniqueness, registry consistency and renderer wiring. `mobile/tests/snack-assets.test.js` checks that Snack's upload inventory includes every final asset.

For a specific review sheet:

```powershell
python research/photo-review-sheets.py loving-hut-orlando --item loving-hut-orlando-curled-island-5-pieces
```

Candidate caches and rejected generated drafts are ignored by Git. Approved outputs are committed under `mobile/assets/food/`; their source and generation records remain in the manifest. Rejected drafts must not be counted as finished images. Recipe details or serving quantities absent from a menu remain unknown; a photograph cannot prove hidden ingredients or allergen safety.
