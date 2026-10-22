# Restaurant map

## Public component contract

`components/RestaurantMap.js` exports a default React Native component. It accepts `results`, `center` and `onSelect`. Each result contains a public restaurant with an ID, name and numeric `coordinates: { latitude, longitude }`, plus `supportedCount` and `possibleCount`. Center is optional and uses the same numeric coordinate fields with an optional label. Pressing a numbered pin calls `onSelect(restaurant.id)` so the parent opens the restaurant menu.

The parent Explore screen owns location entry, geocoding, filters, ranking and the accessible restaurant list. The map performs none of those searches and never requests GPS permission. It only displays valid coordinates supplied to it. Restaurants without valid coordinates remain available in the parent list and are not plotted at a fabricated point.

## One real map on both platforms

`src/map-html.js` builds an inline Leaflet 1.9.4 document using the official pinned JavaScript and CSS assets with their documented subresource-integrity hashes. The basemap is the standard OpenStreetMap tile layer. It supports touch dragging, pinch interaction and visible +/− zoom controls; mouse-wheel zoom is disabled so the app's enclosing page can scroll. All plotted restaurants and the optional search-area point determine the initial bounds. Without a center or marker it opens at Orlando, the catalog's documented starting area.

Web renders the document as a sandboxed iframe with scripts and external attribution popups permitted. Native renders the same document through `react-native-webview`, which is included in Expo Go. The project’s Expo SDK 54 bundled-native manifest specifies WebView 13.15.0; use that SDK-compatible version rather than the current latest documentation's newer recommendation. Only native platforms require the native module at runtime.

Numbered pins are forest green when source-supported matches exist, orange when possible options exist, and gray for a menu with no such count. Those colors summarize available evidence, not an allergy-safety certification. Names and counts appear in text tooltips, and the surrounding legend explains the colors. The parent list remains the accessible alternative to spatial navigation.

## Safe data and navigation

Restaurant names and public coordinates are JSON data. Before insertion into the inline document, the serializer escapes less-than characters and Unicode line separators so a name cannot close a script element. Tooltip content uses DOM `textContent`; untrusted names never become popup HTML. Marker icon HTML contains only a generated numeric index.

The frame sends a short JSON message containing its channel, event type and optional restaurant ID. Web accepts messages only when `event.source` is the current iframe's content window. Both platforms validate the channel and require selected IDs to be in the current marker set before calling the parent. Malformed or oversized messages are ignored. The channel includes the component instance, retry revision and a dataset fingerprint so late messages from an older dataset do not mark a replacement map ready. The fingerprint is a stale-message guard, not a credential.

Native top-level navigation is restricted to its initial inline-document base URL and about:blank. Attribution links for OpenStreetMap open in the normal browser instead of replacing the map bridge. Other external navigation is rejected. Geolocation and automatic JavaScript windows are disabled; no native location permission is requested.

## Loading, failure and cleanup

The map is considered ready only after at least one real basemap tile loads. Script/style failures and a tile-loading timeout lead to a visible fallback with a retry button and a reminder that the list still works. A parent timeout handles a document that never reports. Retrying changes the frame key and message channel. React removes message listeners and clears its timeout when unmounting; the document removes its Leaflet map on page hide.

The native WebView uses an identifying Verifed user-agent and normal caching. The browser iframe preserves normal referrer behavior. Both use HTTPS, visible OpenStreetMap attribution and ordinary viewport tile loading; there is no bulk download, offline tile package or map prefetch. Public tile availability is best-effort. A high-volume public release would need to revisit provider capacity and usage policy; the current CAC prototype has a graceful failure state.

## Verification boundary

Formatting parsed the JSX and generated HTML source. The parent is responsible for integrated platform exports and actual map/marker checks in the web and native previews. A document or loading spinner is not evidence that map tiles or marker navigation worked.

## Official references

- Leaflet quick start and pinned assets: https://leafletjs.com/examples/quick-start/
- React Native WebView inline HTML, messaging and navigation properties: https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md
- Expo WebView (currently redirects versioned docs to latest): https://docs.expo.dev/versions/v54.0.0/sdk/webview/
- OpenStreetMap tile policy: https://operations.osmfoundation.org/policies/tiles/


## Trusted document and actual checks

The web frame uses scripts and same-origin together because an opaque srcdoc origin stripped the genuine referrer required by OpenStreetMap, yielding policy-blocked tiles. This is trusted generated application code, not a sandbox for arbitrary user HTML. Menu names are escaped in JSON and inserted as text; Leaflet assets retain integrity hashes, and a restrictive document CSP permits only the required script/style/tile resources. Same-origin scripts can access their parent; the sandbox must not be described as isolation from hostile HTML.

Actual web tiles and map-pin-to-menu navigation were verified in Chrome. A matching preview rendered at 390 x 844. Native V10 interaction remains unverified because the Snack editor hung before the simulator was available.
