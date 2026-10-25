# Approved copy and icon update — V25.5

Only proposals 3 and 4 were approved. Border removal and Scan layout/grouping remain unimplemented.

`components/MenuScanner.js` replaces the secondary slogan “Read it. Compare it. Keep it.” with the direct heading “Read and save menus.” Supporting explanation, camera behavior, filtering and saved-menu storage remain.

`components/TacoBellMenu.js` imports the existing `Icon` wrapper from `UI.js`. Missing photographs use Ionicons `image-outline` with the existing readable label. Favorite controls use `heart-outline` when unsaved and `heart` when saved. Purple/rose colors, accessible Save/Unsave labels, the 44-point target and the existing save handler are preserved. Obsolete text-symbol styles are removed. There is no new icon package or generated artwork.

This update does not change any card borders, page grouping, menu data, ingredient assessment, fonts or brand colors.

## Verification

174 existing automated tests passed; iOS, Android and web exports succeeded. The installed Ionicons glyph map contains all three names. Snack verified all 379 uploaded assets. Fresh UI checks were attempted but blocked by a browser automation timeout and an Android automation daemon startup stall; no new favorite-toggle interaction pass is claimed. The bundled image-placeholder branch compiled but was not visually inspected in this update. No new native/device test is claimed.
