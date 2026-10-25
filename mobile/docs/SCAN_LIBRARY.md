# Private saved scan storage

`src/scan-library.js` stores up to ten text menus per owner. Account IDs and
guest/demo namespaces stay separate. Temporary photo cache paths are deliberately
excluded because they cannot be relied on after restarting the app. Storage and
JSON failures are surfaced; the library does not silently overwrite broken data.

`src/device-scans.js` creates the single AsyncStorage-backed instance. The scanner
and API share this instance so saving and clearing run through the same queue.
A clear waits for already requested saves, then removes only that owner's key.
It can also clear damaged JSON because clearing does not parse the existing value.

`src/api.js` includes `scannedMenus` in personal data exports. It captures the
current state and owner before waiting for storage so another account's data
cannot be accidentally combined with the original export. Personal data deletion
and demo reset clear the captured owner's saved menus. A completed clear increments
`scanResetVersion` in published state only if the originating session is still
current; the app uses this marker to discard its in-memory scan draft. The counter
survives ordinary refreshes and is not an identity or storage key.

The library remains local even when its owner has signed in. It does not imply
cloud sync or restaurant publication. Export covers saved menu text, not cached
photos or an unsaved draft.

Tests exercise owner-specific export/deletion, demo reset, preservation of other
accounts, clear ordering after saves, and recovery from damaged saved JSON.
