# Explore review and location lookup

Reviewed Explore, discovery ranking, location lookup, the Leaflet frame and the journal-to-recommendation contract on October 21–22, 2026. This is a record of checks and their limits, not a claim that every phone was tested.

## Fixed in this review

Explore now clears the active request reference before aborting on unmount. A cancelled request's catch/finally handlers check ownership before updating state, so leaving Explore no longer lets that request update the departed screen. Starting another search already transfers ownership to the new controller; showing the whole catalog already clears it.

## Confirmed behavior

- The 12 discovery tests pass. They cover real distance calculations, radius exclusion, missing coordinates, source-backed absence claims, ingredient contradictions, dietary priority over taste, positive history, ambiguous chain names, cuisines and sort orders.
- Recommendations use the actual journal fields `restaurantId`, `restaurantName`, `rating` and `tags`. Only valid 1–5 ratings contribute; anonymous or ambiguous venue names do not invent a branch visit. Source-supported and possible options retain priority over a favorite with conflicts.
- An all-nine-free filter requires nine explicit source declarations; an empty allergen list, coverage list or vegan tag cannot establish that claim.
- Live Open-Meteo calls returned real results for Winter Park, Orlando, FL and 32801. Local ZIP/neighborhood choices clearly describe their approximate catalog-point center.
- In Chrome at localhost:8083, Explore → Indian → Map loaded the actual OSM basemap. Clicking the accessible Woodlands marker opened its actual 100-item restaurant screen at 6040 S Orange Blossom Trail. The screenshot is `outputs/verifed-map-pin-opens-menu.png` in the workspace root. This confirms navigation, beyond a loading message or tooltip. The parent's in-app browser produced focus/tooltip without navigation; that was not reproduced in Chrome, so no speculative duplicate click handler was added.

## Source data findings sent to the main agent

The ingredient dictionary initially omitted paneer, ghee, curd, soya sauce and breadcrumbs. These occur explicitly in the new Woodlands menu and should contribute Milk/Soy/Wheat clues before being offered as possible options. The main agent added those dictionary entries, plus related Indian ingredient terms, during this review. The final file now contains the relevant patterns; the main agent owns its regression tests.

A chain card initially used the nearest branch as its displayed representative while the group position came from the first ranked branch. With branch-specific meal history, that could produce an ordering whose displayed reasons did not fully explain its position. The main agent fixed this by displaying the first ranked branch; nearest sorting already makes that branch the nearest. Map pins and branch menus retain individual IDs.

## Address lookup implementation

`searchPlaces(query, restaurants, { mode: "address", signal })` delegates to `searchAddresses`. The ordinary area mode still uses existing local/Open-Meteo lookups. Address mode requires a U.S. street number and street, with enough location text to identify the place; unsupported or unmatched input returns an error instead of a city center.

The free U.S. Census Bureau onelineaddress service supplies matched addresses and numeric coordinates. Census calculates points along address ranges, so results are labeled `address-range estimate` and include `precision: "address-range"`; these are not rooftop measurements. The URL is fixed to the official HTTPS Census endpoint and the query is encoded with URLSearchParams. No API key, account, paid service, GPS access or backend is required.

Native makes a normal JSON fetch. Census explicitly documents that its service lacks CORS and supports JSONP for browser clients. Browser code therefore creates one script to that fixed service using an app-generated callback name. Success, error, timeout and abort all remove the script, callback and abort listener. No arbitrary URL or user-provided JavaScript is executed. The user must press Search; typing does not submit addresses. The UI should disclose that the submitted address goes to Census and show Census credits. Returned coordinates, results and up to 20 search keys are cached in memory only; this module does not save an address to disk, cloud profile or analytics.

The nine location tests pass, including transport choice, invalid coordinates, unmatched addresses, cancelled requests, cache copy isolation and JSONP callback/script cleanup. Together with discovery, all 21 focused tests pass. A real native-style fetch for public Orlando City Hall returned `400 S ORANGE AVE, ORLANDO, FL, 32801` at latitude 28.538315907505, longitude -81.378959733629.

The integrated browser JSONP flow also passed in Chrome at localhost:8084: Home's Change location → Street address → enter that public City Hall address → Find address. The completed screen displayed the matched Census label and recalculated restaurant distances. Proof is `outputs/verifed-census-address-search.png` in the workspace root. A fresh session showed the welcome choices; Create an account opened its selected account tab, Continue without an account opened Home, and About Verifed opened and closed its information sheet correctly. No Google OAuth flow was triggered during this review. No native map/address runtime validation was performed by this reviewer.

## Remaining native checks

On iPhone/Expo Go, verify map tile loading, pinch/pan, pin-to-menu navigation, search keyboard dismissal, scrolling below the map, filter-sheet scrolling, address search success and cancellation, and OpenStreetMap/Census attribution links. Repeat a failed network search and map retry to ensure the list remains usable. Platform exports are valuable but do not establish successful native interaction.

## Official references

- Census Geocoder API and its JSONP/CORS guidance: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
- Census Geocoder overview: https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/census-geocoder.html
- Open-Meteo geocoding: https://open-meteo.com/en/docs/geocoding-api
- OpenStreetMap tile usage: https://operations.osmfoundation.org/policies/tiles/
- Leaflet pinned assets and map API: https://leafletjs.com/examples/quick-start/
