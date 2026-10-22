# Verification record

Date: October 19, 2026. Scope: current responsive app, fictional menus and free Supabase backend.

## Automated and database checks

Root ran npm test after the interface changes: 20 tests passed. The production Vite build succeeds. It reports a main bundle above 500 kB; QR decoding is a separately loaded chunk. No build error is hidden by suppressing the warning.

The backend agent reported all four migrations applied, the rolled-back live SQL verification passed, and 13 actual HTTP/session checks passed using two disposable pre-confirmed users. It verified removal of the temporary users and workspace. The independent reviewer earlier reran the domain tests and the live rollback suite. See REVIEW.md for responsibility and limits; the final UI author pass is not represented as independent review.

## Browser interactions checked by root

- Manual CITRUS code opens the correct fictional restaurant. An unknown code stays on Scan and displays a useful error.
- A dish opens with reported ingredients/preparation, known-conflict or unknown/review treatment and request action where a sample kitchen is connected.
- A diner sends Milk requirements and a separate-utensils/dressing question. The staff queue receives that exact snapshot and labels the question Diner question.
- Staff response appears to the diner. Acknowledgment changes state. Recording a yogurt-dressing ingredient and Milk allergen change clears the current response/acknowledgment, requires version 2 review, shows before/now values, and labels earlier responses outdated.
- Custom meal Lemon rice was created with rating and note. Editing reopened its values, saved the new note, retained its original timestamp and kept the meal count at two.
- The profile saved an added Herby preference and displayed Fresh + Citrus + Herby afterward.
- Menu price 16.50, category Lunch bowls and an added Extra greens modification roundtripped through save/reopen. Display formatting was corrected to retain cents.
- Share menu generated a QR PNG and correct local restaurant link. This does not establish physical-camera decoding.
- Export my data downloaded a JSON file. The shared dialog trapped Shift-Tab within its last button, closed on Escape and restored focus to Log a meal.
- Guest/public catalog and account-protected backend behavior were exercised by the backend HTTP suite. Public Google OAuth remains a separate configuration/interactive check.

## Responsive layout checks

All thirteen primary routes were opened at 390x844 and 1440x1000 CSS pixels. Measured document width did not exceed viewport width and no screen error-boundary fallback appeared. Home also checked at 360x800; Explore checked at 768x1024. Screenshot files are under outputs/verifed-design/screens. A partial first desktop capture was identified and recaptured.

Visual review covered final Home, Explore, dish detail, staff workspace, authentication, narrow phone Home and tablet Explore, plus dialog and sharing captures. Other primary routes were captured and checked for overflow/errors; the screen atlas is an inspectable record. These are actual rendered app screens with fictional data, not speculative mockups. Phone authentication was reduced to the logo and actions after a clipped decorative image was found. Phone staff tabs were made three equal columns and unnecessary scrollbars removed. Typography was enlarged instead of shrinking all content to fit.

## Remaining real-world limits

No real diner/staff research participants, restaurant integration, food inspection, payment, real phone camera or push notifications were tested. Camera permission is not granted automatically. There is no offline service worker or cloud sync while disconnected. Google OAuth setup and its precise access status must be reported separately at handoff; backend password-session verification is not proof that Google works.

## Final author pass additions

New-dish creation and owned fictional workspace creation passed in the local browser. Profile persistence was confirmed by its rendered Fresh + Citrus + Herby text. The menu QR and Copy menu link control are implemented; the latter displays a clipboard fallback if permission is unavailable. No console errors were recorded during the tested local flows.

Google OAuth: consent configuration is prepared but requires policy approval. No client secret/provider is configured; VITE_GOOGLE_AUTH_ENABLED stays false and the button is disabled honestly. This is unfinished external setup, not a claim of a completed Google sign-in test.
