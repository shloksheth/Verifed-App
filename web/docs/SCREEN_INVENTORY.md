# Implemented screen inventory

One responsive app supplies phone and desktop layouts. Hash routes below are real screens. Dialogs keep the underlying page, trap keyboard focus and restore it when closed.

## Diner screens

/home: scan-menu entry, sample-menu browsing, own open requests, profile summary and taste suggestions. Guest adds explicit demo access.

/explore: restaurant/dish search, flavor search, categories and known-conflict filter; no-match state and reset action.

/restaurant/:id: restaurant context, fictional/unconfirmed status and menu. Unknown ID shows an unavailable state.

/dish/:id: illustrative tile, taste explanation, reported ingredients/allergens/preparation, modifications, favorite, meal log and request entry. An unconnected sample kitchen has a truthful limitation.

/scan: camera off/running/starting/error states, manual code/menu-link input and sample shortcut. Camera permission remains a user choice.

/request/:id: submitted, clarification, responded, acknowledged, review_required, declined, completed or cancelled state. Current response, change comparison, event history and earlier snapshots. Actions depend on owner and current version.

/history: personal rated meals or requests, search, empty state and custom logging. /meal/:id shows rating, tags, notes and editing. /favorites shows saved catalog dishes or an empty state.

/profile: dining profile summary and account destinations. /onboarding edits name, allergies, restrictions and liked/disliked flavors. /settings provides account mode, sign-out, export and scoped clear/reset confirmation. /help explains process, privacy and limitations.

/auth: Google sign-in, explicit local demo, optional existing-email access and errors. /reset-password: email recovery session flow. Unknown routes provide a return home.

## Restaurant screens and dialogs

/workspace: authorized restaurant selector, real sample counts, active/changed/all request filter, request list and selected request. Staff response, decision and preparation notes; stale draft notice. Guests and users without memberships see appropriate setup paths.

Menu manager tab: owned dishes and add/edit dialog. Fields include name, category, price, emoji, description, ingredients, declared allergens, tags, modifications, preparation and information-complete flag. Menu revisions invalidate active requests.

Share menu tab: generated QR and copyable menu URL. Restaurant setup dialog: creates an owned fictional workspace and starter menu.

Request composer: visit-specific shared requirements, modifications and question. Change dialog: ingredients, allergens, preparation and change reason. Meal composer: new/custom/edit entry, stars, flavor tags and note. Destructive-action dialog: explains exact clearing scope before the action.

## Scope decisions

There is no checkout, payment, delivery map, live POS connection, medically safe badge, push notification service or offline sync claim. The mobile view is the same web application with bottom navigation. The browser view uses a sidebar and wider grids. A native app binary was not part of this implementation.

See VERIFICATION.md for tested states and limits. Screen Atlas captures show actual sample data, not a real restaurant partnership.
