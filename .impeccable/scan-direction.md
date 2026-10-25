# Scan redesign direction

Operate mode; scoped replacement of the Scan surface in the existing React Native/Expo CAC app. Keep the carrot/check logo, Clash Grotesk and five-tab navigation. No product-wide replacement.

User brief: no original-menu link or Spanish source image before a photo is chosen; richer color with less white; draw inspiration from the supplied warm brown/cream/gold menu-scanning promotion; use the supplied Sayola dinner menu after scanning. Preserve real photo capture/review, search, dietary filters, corrections and saved menus. Fixed presentation behavior is intentional and documented internally; it is not live OCR.

First viewport: a neutral code-native paper/camera geometry inside a deep brown capture panel; clear gold camera action and outlined library action. After selection: cream menu paper with burgundy Sayola name, language and dietary/category controls, followed by a tan rail containing four specifically matched generated dish illustrations and 23 readable text dishes. No unrelated image fallbacks. No actual-restaurant-photo claim for generated illustrations.

Palette: ground #EDE1CE, brown #443020, cream #FFF8EB, gold #E7BE75, muted #715E49, line #D9C7AA, burgundy #732E30, dietary green #DBE2CA. Shared Clash Grotesk aliases and Ionicons. UI controls remain native Pressable/Text/ScrollView.

Quality bar: no early known result; complete supplied content; visible source provenance; legible text and adequate touch targets; no horizontal app overflow; full food framing; functional categories/search/language/diet/save/reopen. Changes are limited to the scan flow and neutral Home scan thumbnail.

Evidence limits: Windows host, no iOS simulator. Browser captures are explicitly React Native Web at 390x700 and 320x568. Separate Android evidence was subsequently captured from the preconfigured Medium_Phone_API_36.1 emulator in Expo Go, using local Metro. See research/runtime-v24-qa.json for observed checks. The reviewer verdict stays scoped to its three browser corrections. Physical iPhone verification cannot be claimed. Native HTML/CSS detector intentionally skipped; it has no verdict on React Native styles.
