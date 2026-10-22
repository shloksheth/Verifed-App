# Backend and data guide

## The reason for this structure

A menu description can change after a diner has read a kitchen response. Verifed therefore stores a request as a versioned conversation rather than a single editable message. A response belongs to one version and has its own ID. Completion requires acknowledgment of that exact current response. A changed ingredient or preparation invalidates both response and acknowledgment while retaining earlier events.

The browser calls Supabase directly with a public publishable key and the signed-in user's session. PostgreSQL controls which rows and actions that user may access. No service-role key or custom API server belongs in the browser. The free project is in the shloksheth organization, region us-east-1. The project reference is dpcxzqovrxvxeladucuz.

## src/data.js: reproducible fixtures

ALLERGENS, RESTRICTIONS and TASTE_TAGS provide bounded choices for forms. defaultProfile is the empty starting profile. restaurants and dishes describe three fictional restaurants and twelve dishes. The menu array is converted into named objects with stable demonstration IDs, prices, reported ingredients, tags, preparation details and revision 1. makeDemoState copies these objects, so editing or resetting a demonstration does not mutate the imported fixture.

The first demo restaurant has a local kitchen membership so one browser can demonstrate both roles. Cloud seed restaurants have no real staff connection. An authenticated user must create an owned fictional workspace to test staff actions in the cloud.

## src/domain.js: meal rules without React or a database

validatePayload checks array shapes, bounded string elements and text sizes before a request is created or changed. Helpers create UUIDs, timestamps, deep copies and case-insensitive comparisons. Keeping these functions independent lets the Node test runner exercise the important rules without loading the interface.

assessDish compares declared allergens with the profile, then checks whether requested dietary tags are present. It returns conflict, unknown or review. None is a safety certification. Explicit likes add two points per matching tag; dislikes subtract ten. Ratings add a small bounded adjustment from the average rating of meals sharing each tag. A dislike is not overridden by learned positive ratings. Explanations are returned alongside scores.

rankDishes copies the input menu and sorts by information category first, taste score second. Known conflicts always rank after entries without a known conflict, even when the conflicting dish is a strong taste match. The optional meals argument supplies journal feedback.

makeRequest copies the dish and the requirements the diner chose to share into a snapshot. Its initial event includes a separate copy of that snapshot. Later catalog or profile edits cannot silently rewrite that event.

transitionRequest first rejects stale revisions and closed requests, then authorizes each action for diner or staff. respond requires a decision and message; clarify and decline have different resulting states. acknowledge checks both revision and response ID. change and resubmit increment the request revision, clear the response and acknowledgment, and append an event. complete requires a current acknowledgment. cancel closes the request. Events retain earlier snapshots rather than overwriting them.

makeDemoState returns one fictional diner, a dining profile, an active request, a sample journal entry, saved dishes and a membership in Citrus & Table. It supplies the explicitly labeled local demonstration.

## src/api.js: one adapter for the screens

The module holds a single state snapshot and a set of subscribers. publish replaces the snapshot and notifies subscribers; React observes it through useSyncExternalStore. Components own temporary drafts, not a second database. requireUser and requireCloud give readable errors at the operation boundary; result converts Supabase errors into Error objects for the interface.

init reads the selected local mode, attaches the auth listener, starts visible-tab polling every fifteen seconds, and subscribes to local-storage changes from other tabs. Auth refresh calls are deferred outside the Supabase auth callback to avoid its session lock. refreshCloud reads public catalog data and, when authenticated, rows allowed by the user's policies. readAll requests ordered pages of one thousand rows. Generation and request-sequence checks prevent obsolete successful reads from replacing a newer session or mode.

Guest mode browses public menus. enterDemo and resetDemo explicitly select local mode; a failed cloud request never silently becomes a demonstration. loadDemo parses the stored demo or makes fresh fixtures. editDemo takes a deep copy, applies a change, saves it and publishes it. Web Locks serialize local writes across supporting browser tabs. That local mechanism does not replace database locking for cloud users.

signInWithGoogle starts Supabase's Google OAuth flow and returns to the current app origin. Supabase exchanges provider credentials. signIn, signUp, resetPassword, updatePassword and signOut wrap Supabase Auth. The visible default sign-in choice is Google; existing email accounts can use the secondary email form. General email registration is not advertised because custom SMTP is not configured. Email confirmation has not been disabled.

saveProfile writes only the signed-in profile. createRequest and actOnRequest use pure domain transitions in demo and verifed_command in cloud. toggleFavorite writes an owned favorite. saveMeal inserts a new journal row or updates an existing owned row while retaining its creation time. Custom meals may omit catalog references.

saveDish checks the original menu revision, saves every exposed editor field, and invalidates active related requests. addDish creates a new entry. createRestaurant creates an owned fictional workspace with a starter menu. The cloud command adds membership atomically; it never trusts a role supplied by a browser. exportData returns the current personal data for a JSON download. deleteMyData clears personal dining records and the profile while retaining the authentication account and business workspace records; the settings dialog explains this scope.

command invokes public.verifed_command with action and payload arguments. After a successful write, locally known records are published immediately where possible and the store is refreshed. synchronizeWrite uses the helper below so a committed operation is not reported as failed merely because the following read lost connection.

## src/write-sync.js: distinguish saving from refreshing

finishCommittedWrite receives an already committed result and a refresh function. If refresh succeeds, it returns that result. If refresh fails, it reports a synchronization warning and still returns the committed result. This prevents users retrying a successful request as though it had never saved, which could create duplicates. The warning offers a refresh retry instead.

## Database tables and access

profiles: one row per authenticated user, with display name, allergies, restrictions, likes and dislikes. Only its owner can read or change it.

restaurants and dishes: public fictional catalog. Dishes have a JSON body with the same camelCase fields used by the app. Direct catalog writes are denied to browser roles; commands enforce staff membership.

memberships: connects a user to an owned restaurant workspace. Users may read their own membership rows. They cannot insert themselves into another workspace through the REST API.

requests: identity and relationship columns plus a versioned JSON conversation. The diner and members of that request's restaurant may read it. Browser roles cannot directly rewrite its history; mutations go through commands.

meals and favorites: personal journal records and saved dish relationships. Row-level security limits all writes and reads to the owner. Foreign keys and indexes support user, restaurant and dish lookups.

## SQL migration files, applied in order

20261019034650_verifed_initial.sql creates the tables, indexes, row-level policies, grants, fictional seed catalog, private command implementation and public wrapper. The command implementation uses SECURITY DEFINER with an empty search path and fully qualified tables, so it explicitly verifies auth.uid and membership before accessing protected rows. Request and catalog rows are locked during related mutations.

20261019070645_validate_payloads.sql adds explicit bounded JSON validation and a stricter journal-body constraint. PostgreSQL CHECK accepts NULL, so required field presence and types must be checked explicitly. Its wrapper rejects malformed payloads before the command implementation consumes them.

20261019070942_add_dish.sql adds authorized catalog creation. It reuses the existing command implementation rather than granting unrestricted table inserts.

20261019124854_complete_menu_edit.sql replaces the command implementation with complete menu editing. Price, category, emoji, tags, modifications and informationComplete now roundtrip alongside ingredients, allergens and preparation. It checks stale menu revisions, changes active requests in the same transaction, and preserves their earlier events. All four migrations are required on a fresh project.

Use migrations to reproduce the schema in another Supabase project, then set src/config.js environment variables and that project's Auth redirects. Do not run migrations as ordinary diner accounts. Google provider configuration is separate from SQL.

## Tests and verification files

tests/domain.test.js exercises immutable snapshots, valid acknowledgment/completion, ingredient change invalidation, stale versions and response IDs, clarification/resubmission, declined and closed states, roles, validation, catalog renaming, taste ordering and rating feedback. tests/write-sync.test.js checks successful writes followed by both successful and failed refreshes. Run npm test. The current suite has twenty passing tests.

supabase/verify.sql creates isolated fixtures inside a transaction, impersonates database browser roles, and verifies cross-user isolation, denied self-membership/direct writes, payload checks, stale revision/response rejection, menu invalidation, history, clarification, cancellation, deletion and anonymous grants. Its final ROLLBACK removes its fixtures. The backend agent and independent reviewer ran the suite successfully; the final editor-field checks were also run by the backend agent.

supabase/verify-http.mjs is an opt-in real REST/session integration check using two disposable pre-confirmed test users. Credentials are supplied temporarily, never committed. It exercises anonymous reads/denials, distinct authenticated sessions, owned workspace/dish creation, cross-user isolation, profile and journal writes, diner/staff communication, invalidation and stale acknowledgment rejection. The backend agent reported thirteen passing checks and confirmed removal of those temporary users and their workspace. This was not an email-delivery or Google OAuth test.

## Practical limits

All current restaurants and prices are fictional. No restaurant POS, real kitchen, payments or real-world allergy outcomes have been tested. Polling is adequate for a demonstration but is not an instant notification service. The app requires a connection for cloud operations, has no service worker, and does not claim offline cloud synchronization. Browser camera behavior depends on the device and permission. The rule system suggests tastes; it is not a trained medical or food-analysis model.
