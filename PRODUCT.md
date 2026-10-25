# Verifed CAC mobile app

Verifed helps people compare written restaurant menu information with their selected allergies and dietary restrictions. The current app is React Native/Expo for a Congressional App Challenge demonstration, with Explore, Scan, Home, Journal and You tabs. It supports optional accounts and device-scoped guest use, saved dishes, dietary settings and a personal meal journal. The active implementation lives in mobile/.

## Scan surface

Capture or choose a menu photo, read dish names in English or their original form, search dish/ingredient text, filter hot/cold categories, compare dietary needs, correct text and save/reopen/delete a menu on the current device/account namespace. The original source page is only available once a menu exists. Before capture the page uses neutral paper/camera geometry, not a preselected restaurant menu.

The presentation is deliberately scripted: every valid selected/captured photo opens the same authored 23-dish Sayola transcript. It performs no OCR, photo recognition, live AI extraction or live translation. The source image already has English descriptions. Translation changes the Spanish dish names. Printed prices and GF/V/VG symbols are preserved without treating those symbols as full ingredient/allergen declarations. Four local generated dish illustrations are labeled as illustrations, not actual Sayola photography; provenance stays in research metadata.

## Retained interface

The carrot/check logo, Clash Grotesk, five-tab navigation and other app screens remain. Scan alone uses a warmer brown, cream and gold direction based on the supplied reference, with tan menu/photo surfaces and green dietary controls. Existing app design context is in mobile/docs/DESIGN_SYSTEM.md and TYPOGRAPHY.md. Detailed code explanation: mobile/docs/MENU_SCANNING.md.

## Verification boundary

Automated tests, platform exports and React Native Web checks are separate from native runtime checks. Never report a browser phone frame as an iPhone or Android screenshot. Native checks must name the actual emulator/device, source and behavior observed. Physical iPhone camera permissions, gestures, safe areas and enlarged type require device verification. No live scanning accuracy is claimed.
