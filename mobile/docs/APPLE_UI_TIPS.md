# Apple UI tips — V25

Source reviewed: https://developer.apple.com/design/tips/ (2026-10-25).

This is a limited readability/touch correction, not a new visual system or a claim of full Apple HIG compliance. Clash Grotesk, restaurant branding, Scan's scoped palette, content and navigation remain.

## Related code

- `styles.js`: increases ten small text styles from 8–10 to 11 points, including allergen labels, menu counts and photo credits. Photo-credit/caption line heights increase where needed. Cuisine-chip minimum height becomes 44 points.
- `components/Welcome.js`: badge text becomes 11 points; the guest action becomes at least 44 points tall. Carousel paging and indicators stay the same.
- `components/Journal.js`: small detail metadata becomes 11 points.
- `components/ChipotleMenu.js`: illustration/status/footer text becomes 11 points. The dietary edit action gains a 44 by 44 minimum target; the official-source link gains a 44-point minimum height; category/mode controls gain a 44-point minimum height. Layout uses minimum heights so labels can grow.
- `components/TacoBellMenu.js`: six small text styles become 11 points. Ingredient-change choices and source controls become at least 44 points tall; Close and the per-item Save heart become at least 44 by 44. The missing-photo label uses the existing darker muted color, improving contrast on its light background.

`components/UI.js` and `styles.js` give shared section actions an explicit 44 by 44 minimum instead of relying on overlapping hit slop. `App.js` gives the header Home wordmark a 44-point minimum height.

No text-scaling cap was introduced. Native text still follows the user's system font size. Existing source images remain undistorted with the current contain/cover choices; this update does not invent higher-resolution originals or upscale low-resolution provider photos. Retina source resolution still varies by restaurant.

## Review boundaries

Apple's minimum target/text-size guidance drives the changes above. Existing touch controls, image framing, nearby menu filters and shared alignment are retained. Narrow/large-text runtime checks and exports must be reported separately; a source inspection is not a runtime pass.

The separate Oliur article (https://www.oliur.com/make-ai-designs-look-less-like-ai) was reviewed. Changes to decorative borders, spacing/grouping and promotional copy are proposals awaiting the user's approval; none are included here. Taco Bell's deliberate purple identity and the user's chosen Clash Grotesk are retained.

## Observed checks

174 existing automated tests passed and all three platform exports succeeded. Android Expo Go opened Welcome, guest Home and Chipotle; the enlarged dietary Edit target opened profile settings. The emulator was inspected with font_scale configured to 1.0 and 1.3, then restored to 1.0. See `research/runtime-v25-qa.json` and its screenshot paths. This is neither an iPhone test nor a full large-text/accessibility certification.
