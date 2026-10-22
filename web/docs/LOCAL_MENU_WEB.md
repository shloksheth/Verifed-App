# Local menu compatibility

The companion web app reads the public cloud catalog. Restaurant `details` fields are flattened during hydration so the web screens can use the address, phone, official URLs and source notes alongside the restaurant's identity and connection flags.

Real businesses (`fictional: false`) display published-menu labels instead of fictional/sample captions. They have no kitchen connection: in-app requests remain unavailable, while website, menu, allergen-source and telephone links provide direct contact. This display does not imply a partnership.

Dish provenance is shown with its review date, evidence note, covered categories and restaurant labels. A `kind: component` record is explicitly one component, not a full meal; the complete order needs separate review. Missing ingredients are stated plainly. An empty declared-allergen list does not establish absence, and source categories or restaurant labels do not resolve cross-contact.

Null, missing or invalid prices display “Price not listed.” A numeric zero still displays as a price. Local demonstration menus keep their sample labels and existing practice request flow.

Validation: run `npm test` and `npm run build` from `verifed-app`. This change does not publish the web app or alter backend policies, catalog records or the mobile app.

Checked 2026-10-21: all 20 tests pass and the production build passes (the existing large-chunk warning remains). A read-only check against the public API rendered all 3 real restaurant pages and 24 menu detail pages through React server rendering. It checked source/contact links, missing-ingredient copy, component notices, unknown-price display and the absence of request buttons for real restaurants. Numeric zero was separately checked to remain `$0.00`. Browser layout was not part of this check.
