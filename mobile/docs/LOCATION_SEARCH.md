# Explore and location search

`components/Explore.js` combines discovery rules, map and restaurant rows. It stores a small set of filter choices in module memory so opening a menu and returning preserves the area. A fresh app session starts at Orlando city center with a 25-mile radius. Cuisine, dietary mode, search text and sort determine one result array; both map pins and list cards use it.

`src/location-search.js` resolves exact catalog restaurant names/addresses locally. Known ZIP codes and neighborhoods use the arithmetic center of matching catalog address coordinates, explicitly labeled approximate. This is not a ZIP boundary or the person’s actual location. Other city/ZIP searches call the public Open-Meteo geocoding API, based on GeoNames, only when Find area is pressed. No GPS permission or background location requests occur. The request contains the submitted query, not the dietary profile or meal journal. Six validated place choices at most are returned, with a small memory cache; errors never substitute invented places.

Explore uses AbortController and a 12-second timeout. Starting another search cancels the earlier one; unmount invalidates its controller so a late response cannot update a different screen. Clear area cancels requests and shows the entire catalog. Distances use the Haversine formula and are straight-line estimates, not routes.

The list groups Taco Bell branches under chainId. A picker shows the actual included branch addresses; selecting one opens that branch’s menu. Filtered-out branches stay out of the picker and map. The national food inventory is a chain template; local availability, prices and breakfast service are not verified.

Recommended order prioritizes dietary evidence before taste history. It learns only from actual rated journal records; ambiguous chain names cannot prove a visit to one branch. Dietary fit sorting ignores taste scores. The strict absence filters require explicit source claims for qualifying items, and never certify an entire restaurant or kitchen. Current sources may honestly produce zero all-nine-free results.

Sources: https://open-meteo.com/en/docs/geocoding-api and https://www.geonames.org/ . The current free geocoding service is for noncommercial use; revisit provider terms before a commercial release.


## Street-address entry

Street address mode calls the official U.S.Census Geocoder only after Find address. It requires a U.S. street number and street, and returns actual matched addresses with finite bounded coordinates. These are address-range estimates, not roof-level GPS. No city-center fallback substitutes for an unmatched street address. The UI discloses Census transmission before search. Results and search keys stay in memory only; they are not written to the user profile, journal, disk or analytics.

Census does not support CORS on this endpoint and documents browser JSONP. The browser creates a script for the fixed official HTTPS endpoint with an app-generated callback; native uses fetch. Success, failure, abort and 11-second timeout clean up the script and callback. The parent 12-second timeout and request ownership prevent late results updating an unmounted screen. Query mode changes cancel prior searches. Tests verify invalid data, no-match behavior and cleanup. Source: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html .
