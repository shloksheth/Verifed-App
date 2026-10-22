# Discovery and recommendation engine

`src/discovery.js` is a pure, client-side exploration engine. It makes no network requests, asks for no location permission and stores no data. The Explore screen supplies a chosen search center, public restaurant/menu records and the diner's current profile and actual journal history. All calculations can be explained without a trained model or a recommendation service.

## Calling the engine

`discoverRestaurants({ restaurants, dishes, profile, meals, center, radiusMiles, cuisine, dietMode, sort, query })` returns a new array of result objects. Defaults are a 25-mile radius, All cuisines, all menu evidence and recommended ordering. `center` and each `restaurant.coordinates` use `{ latitude, longitude }`. Each chain branch remains an individual restaurant with its own ID, address and coordinates; the interface can group those results for a location picker.

A result contains `restaurant`, `menuCount`, `supportedCount`, `possibleCount`, `conflictCount`, `selectedFreeCount`, `allNineCount`, `distanceMiles`, `dietaryTier`, `score`, `reasons` and `sourceReviewedAt`. The restaurant and source objects are not mutated. `sourceReviewedAt` is the restaurant record's supplied review date, not a claim that a restaurant has reconfirmed it today.

## Location and search

`validCoordinates(value)` returns a Boolean. `distanceMilesBetween(from, to)` uses the haversine formula and returns a straight-line distance in miles, or null for invalid/missing coordinates. It is not driving distance. The formula clamps rounding error before its square root and inverse sine so valid antipodal points do not produce NaN.

With a valid center, results must have known coordinates within the chosen radius. Unlocated restaurants are excluded because the app cannot honestly place them within that radius. With no valid center, no radius filter is applied and distances remain null; the interface must explain that no location-based ordering is available. An invalid or negative radius falls back to 25 miles.

Cuisine matching is case-insensitive. Query matching searches restaurant name, neighborhood, address, cuisine and published menu names, descriptions and tags. Accents are folded for text matching. Fictional sample restaurants are excluded from this public discovery engine.

## Dietary modes

The engine calls the same `dietaryMenuStatus` used by the restaurant screen. Published allergen positives and ingredient-based flags take precedence over any contradictory free-from claim. Missing evidence stays unknown.

- `all` keeps all matching restaurant records, including those with dietary flags. Badges and explanations must remain visible.
- `options` requires selected needs and at least one supported or possible food option. It excludes restaurants whose available menu items all have relevant flags.
- `reported` requires selected needs and at least one item that explicitly supports every selected allergy and dietary restriction.
- `selected-free` requires at least one selected allergy. A qualifying item must have explicit `provenance.freeFromAllergens` support for every selected allergy and must also satisfy selected dietary restrictions. No allergy selection yields an empty result; the interface should ask the diner to select allergies.
- `all-nine` requires an item with explicit ingredient-absence claims for all nine tracked major allergens, plus selected dietary restrictions. It does not substitute vegan labels, covered matrix columns, blank cells or missing ingredients for absence claims. Contradictory reported or ingredient-based flags reject the item.

`selectedFreeCount` and `allNineCount` count food records, not allergen-free kitchens or whole restaurants. A restaurant with one supported item may prepare many other allergenic foods. Source claims do not establish cross-contact control. Zero matches is a valid result when current evidence cannot support a strict filter.

## How recommendations work

Recommended ordering first uses a dietary tier: restaurants with supported items, then those with possible options, then those with only flagged items. This tier takes priority over any taste history. With no needs selected, nonempty public menus share the first tier; the app does not pretend to know allergy suitability.

Within a tier, the score rewards the proportion and count of supported food records. It adds a bounded preference bonus for actual venue journal ratings averaging at least four stars. If there is no such venue average, it can use a cuisine average of at least four stars from journal meals linked to a real catalog restaurant. It can also recognize tags shared with highly rated meals or explicit likes; dislikes prevent a tag's learned bonus and apply a small penalty. A small distance bonus favors nearer places.

History is not fabricated. A custom journal meal can inform taste tags but cannot invent a restaurant or cuisine association. A typed restaurant name is matched only when it uniquely identifies a catalog restaurant. If several Taco Bell branches share the same name, that name alone cannot establish which branch the diner visited. A stored restaurant ID resolves the branch normally. Invalid ratings are ignored; lower averages do not generate positive-history explanations.

Each result's `reasons` describes the actual signals used: supported food count, possible information requiring confirmation, a genuine venue/cuisine rating, a taste overlap or distance from the chosen search center. With no history, no profile and no center, the explanation is simply to explore the published local menu. All-conflict restaurants receive no positive taste-history bonus.

`sort: "nearest"` intentionally follows known straight-line distance; `sort: "name"` sorts names. These user-selected orders do not make a dietary judgment. The interface must continue showing the evidence counts. The default recommended order preserves the dietary tiers, then score, distance and a stable name tie-breaker.

## Verification

`tests/discovery.test.js` has 12 focused checks: known distance, zero and antipodal behavior; coordinate/radius handling; exclusion of unlocated places from a radius; dietary priority over a five-star conflicting venue; options versus explicit source support; all-nine strictness; combined allergy/dietary requirements; actual venue/cuisine history; no invented personalization; cuisine/food search and immutability; advertised sorting; separate branches; and ambiguity in a typed chain name. The parent implementation verifies the integrated UI, map, catalog and publication separately.
