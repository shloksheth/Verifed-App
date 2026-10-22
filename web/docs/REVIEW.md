# Independent implementation review

Review date: October 19, 2026. This is a working review record, not a blanket certification.

## Research artifact verification

The design report at `outputs/verifed-design/Verifed_Design_Research.pdf` has nine pages. All nine pages were rendered with Poppler and visually inspected: no clipped text, overlapping sections, missing characters or cut-off references were observed. The report uses fourteen primary sources, a dated ranking snapshot, and clearly separates vendor capabilities, visual observations and our recommendations. Research retrieval was October 18.

## Backend review, pass one

Inspected the initial database migration, `src/domain.js`, `src/data.js`, and the API contract. Access checks use database membership/ownership rather than client role labels. Request commands lock the current row and compare meal revision; acknowledgments also compare response ID. Catalog edits lock the dish and invalidate active related requests.

### R1 - Validate snapshot field types before saving (P1, fixed and verified)

The initial SQL command accepts arbitrary JSON for `allergies`, `restrictions`, and `modifications` when creating/resubmitting a request. Request changes and menu changes also lack string-element validation. A diner could submit an object or nested object where the staff interface expects an array of strings; this can break another user's request view. Enforce bounded string arrays and strings at the command boundary, with matching demo validation.

Reproduction on the initial pure domain implementation: `makeRequest(dish, {allergies:{}}, userId)` retained `{}`; `transitionRequest(request, 'resubmit', {allergies:'Milk'})` retained a string. `assessDish(dish, {...profile, allergies:'Milk'})` throws a `filter is not a function` error. SQL insertion behavior is established by source review here; a database test is still required after the fix.

### R2 - Reject incomplete meal JSON (P2, fixed and verified)

The initial `meals.body` CHECK condition uses fields that can evaluate to SQL NULL. PostgreSQL CHECK accepts true or null, so a body missing required `dishName` or `rating` can pass. Require field presence/types explicitly, then enforce bounds. Test direct API writes, not just the frontend form.

### R3 - Keep renamed menu items consistent in demo requests (P2, fixed and verified)

Demo `saveDish` updates the catalog name but its request transition does not accept `dishName`, leaving the current request name/snapshot unchanged. Cloud `saveDish` updates both. Align demo/cloud behavior and verify that renaming a dish updates the current snapshot while retaining earlier snapshots in history.

### R8 - Distinguish committed writes from refresh failures (P2, reported)

The first API adapter awaits a full state refresh after successful mutations. If that refresh fails after the server has committed, the mutation promise rejects. Retrying a request or meal form can then duplicate the already-saved record. Return the committed result separately from the synchronization warning; retain a clear way to retry loading state. Test successful write followed by failed refresh.

## Frontend review, early pass

### R4 - Personal Home should show only the diner's open requests (P2, reported)

The initial Home filter includes all requests readable by the account, including requests from other diners that a restaurant owner may read through staff membership. Filter the personal Home card to `request.userId === state.user.id`. Also exclude `declined`, because the domain treats declined requests as closed.

### R5 - Search should include flavor tags (P3, reported)

Explore promises a flavor search, but its first implementation searches name/description/restaurant only. Include `dish.tags` so tags such as Crispy and Herby reliably match.

### R6 - Label replaced responses within the same meal revision (P2, reported)

RequestTimeline initially labels earlier responses only when their revision is lower than the current revision. The backend permits a kitchen response to be replaced before acknowledgment without changing the meal revision. Compare response IDs as well so the replaced reply is explicitly marked outdated.

### R7 - Make changed fields visible (design recommendation, reported)

The first change banner describes the reason and new revision, but does not directly compare the changed ingredients or preparation. Add a compact before/after comparison to the current detail page; this is the central Verifed interaction and lets diners identify what changed without opening multiple historical records.

### R9 - Bind staff drafts to the revision that was reviewed (P1, reported)

StaffRequest initially keeps a response draft across polling updates, but submits `request.revision` from the latest props. ChangeForm similarly initializes its fields once but receives the latest request props. A menu change during editing can therefore cause an old draft to be submitted against a fresh revision, bypassing the intended stale-screen rejection. Capture the expected revision when the form/draft opens, or reset it with an explicit changed-meal notice. Verify two clients: draft against v1, change to v2 elsewhere, then attempt to submit the original draft.

### R10 - Persist every exposed menu editor field (P2, reported)

The menu editor exposes category, price, emoji, tags and modifications, while the initial saveDish implementation persisted only a subset. Ensure all exposed fields roundtrip through demo and cloud saves, with input validation. A successful save must not silently discard edited fields.

### R11 - Identify timeline actors correctly for staff (P2, reported)

The initial timeline labels every diner event as "You", even inside a staff workspace. Use viewer-aware labels or "Diner" in staff views. Similarly distinguish "Diner question" from "Your question" when the reader is restaurant staff.

## Follow-up verification

- R1: validation wrapper rejects malformed arrays/text. Independently reran 16 domain tests, all pass; independently reran rolled-back live PostgreSQL verification, pass.
- R2: explicit meal JSON shape constraint added. Independent live verification confirms `{}` is rejected.
- R3: domain change transition accepts dishName and updates the current request name. Rename/immutable prior snapshot test passed independently.
- R4: fixed; Home filters to the current user's open requests and excludes declined. Source checked by root after redesign.
- R5: fixed; search includes dish.tags. Root source review confirms the match input.
- R6: fixed; timeline compares response ID and revision. Root browser change test shows earlier responses explicitly outdated.
- R7: implemented; before/now ingredient and allergen values verified by root in the changed-meal browser test.
- R8: fixed; finishCommittedWrite separates the committed result and refresh warning. Two automated tests pass.
- R9: fixed; staff and change drafts capture their opening revision. Stale staff drafts disable sending and require an explicit fresh review. Root source review; database and pure-domain stale-version tests pass. A two-device interactive stale-draft test was not performed.
- R10: fixed; all exposed menu editor fields are persisted by demo and SQL command. Backend agent reports live field-roundtrip verification.
- R11: fixed; staff passes viewer context to snapshots/timelines. Root browser staff test displays Diner question and Diner actor.
- Backend agent reports thirteen real HTTP/session checks passed with two disposable users, followed by verified cleanup. This is separate from the independent reviewer's earlier SQL pass.
- Root reran all twenty Node tests successfully after frontend changes.
- Root browser flow: manual menu code, dish, request submission, staff response, diner acknowledgment, ingredient/allergen change, outdated response and before/now comparison passed.
- Root browser journal flow: custom meal creation, editing, retained note and unchanged entry count passed.
- Root responsive route checks at 390 and 1440 CSS pixels found no document horizontal overflow or screen-boundary fallback on the thirteen primary routes. Screens were saved. Additional form, sharing and narrower/tablet checks are recorded in VERIFICATION.md.
- Final visual changes use the user's carrot identity, readable type, compact phone authentication, scan-first Home and fewer promotional elements. This final pass was by the implementation author, not an independent agent. A requested additional agent review was unavailable because the agent account usage limit was reached; earlier independent findings remain above.

## Review limits

This is an independent correctness and usability review. No real diner/staff usability participants or live restaurant deployment have been tested. Passing domain tests does not establish cloud access-policy correctness; those must be exercised against the database. No claim about preventing allergic reactions is made.
