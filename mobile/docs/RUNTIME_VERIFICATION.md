# V22 runtime and release checks

V22 keeps V21's interface and fixed Spanish-menu presentation. It updates
`package.json` and `package-lock.json` to Expo 54.0.38, expo-font 14.0.12 and
expo-image-picker 17.0.11. These are SDK 54 patches. The published V21 editor
reported the older font and photo-picker versions as incompatible recommendations.
`expo install --check` now reports that dependencies are up to date.

`src/use-app-fonts.js` still loads the same five local font files. The photo
capture and image preparation code in `components/MenuScanner.js` is unchanged.
No authentication, database schema or backend deployment is part of this update.

`research/verify-design-assets.py` now names its report from `release.json`, so
checking a later release does not overwrite V21's report.
`research/verify-snack-snapshot.py` records Expo's public error code when a ZIP
request fails. This distinguishes `SNACK_DOWNLOAD_TOO_LARGE` from a transient
server failure; it never treats a failed comparison as a pass.

The native test target is the existing Medium_Phone_API_36.1 Android emulator,
using official Expo Go 54.0.8. The longer smoke checks load this checkout through local Metro with
ADB reverse forwarding. This is Android native evidence, not physical iPhone
verification. The published V22 Snack also opened onboarding and guest Home directly in Expo Go. Test data uses only a disposable guest profile on the emulator.

The fixed scan takes any successful photo and displays the same published
2cero7 menu. No live OCR or translation provider is configured. Native photo
selection and translation display tests verify that presentation, not AI accuracy.

The complete observed checks and remaining platform limits are recorded in
`research/runtime-v22-qa.json` and the numbered release record.
