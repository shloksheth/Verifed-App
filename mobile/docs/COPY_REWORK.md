# Interface copy rework

Reviewed 2026-10-25. This records copy decisions and source research, not user research or a measured usability improvement.

## Content guidance

- [DoorDash: Design Leadership Interview with Tae Kim](https://careersatdoordash.com/blog/design-leadership-interview-with-tae-kim/) explains content strategy as a product usability discipline and recommends identifying complexity before compensating with explanatory text. This is a first-party interview, not a published DoorDash UI-writing rulebook. Applied here by replacing metaphors with task names and reducing explanations that repeat a heading or button.
- [DoorDash: Design](https://careersatdoordash.com/career-areas/design/) describes customer needs as central to product design and places strategic content design within Design Foundations. Used as context for organizing copy around diners' actions; no claim that Verifed reproduces DoorDash's design system.
- [GOV.UK: Writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces) advises short, direct copy, descriptive headings, clear link purposes, and reducing unnecessary text. Applied to account titles, empty states, source links, and notices.
- [Office for National Statistics: Plain language](https://service-manual.ons.gov.uk/content/writing-for-users/plain-language) recommends task-focused headings, simple sentence structures, and calls to action beginning with a verb. Applied to profile actions and settings controls.

These sources informed editorial choices. They do not validate Verifed's dietary assessments, data handling, or accessibility.

## Account and Dining decisions

- `components/Account.js`: authentication titles name the task: Sign in, Create an account, Reset your password. Supporting text changes with the form rather than repeating a general dining slogan. Removed the unconditional promise of immediate signup access because the API can return `verificationRequired`.
- Profile controls use Save, Edit, and Clear instead of a browsing-preview metaphor. Guest storage remains explicitly limited to the current device; restaurant-sharing limitations remain visible.
- Settings explains account data separately from scanned menus stored on the device. Export/delete/reset notices now mention scanned menus because `src/api.js` includes them in export and clears the corresponding scan library during deletion or demo reset. Account deletion of personal app data still states that the login remains.
- Help describes menu comparison, source limitations, unknown allergen coverage, cross-contact, independent restaurant sourcing, and the absence of ordering. Project attribution to the Congressional App Challenge remains factual and separate from operational instructions.
- `components/Dining.js`: ingredient warnings use dietary needs rather than profile-conflict jargon. Missing source support appears as Needs confirmation, not a promising Possible options label. Reported dietary matches still require checking preparation and cross-contact with the restaurant.
- Source dates, scope, free-from claims, ingredient clues, and photo/illustration labels retain their distinctions. Empty allergen lists do not imply allergen-free food. Menu availability is not presented as a live branch inventory.
- Saved-items copy identifies the destination and the Save action. No new ordering, allergy-safety, scan-analysis, or live-AI capability is claimed.

## Scope and verification

This pass changes rendered text in Account and Dining. It does not change API calls, navigation, storage rules, dietary logic, styles, typography, scanning, or the Home screen. Shared Dining components can also appear on other screens, so their status text stays specific and factual.

The copy needs visual review on narrow screens and at larger text sizes. Existing navigation, state, and API checks are run by the coordinating app-update workflow; do not treat the guidance sources as evidence that those checks passed.

Existing issue flagged separately: signup currently ignores the API's `verificationRequired` result and always navigates home. The copy no longer promises immediate access, but an email-verification notice still requires a functional change outside this pass.
