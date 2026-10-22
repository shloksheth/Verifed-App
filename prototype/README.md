# Verifed prototype

A small, app-only demo of allergy meal requests that stay connected to a kitchen response. Everything is fictional. There are no physical passes, scanners, order tags, accounts, or paid services.

## Run it

Install Node.js 20 or newer, then run these commands in this folder:

```sh
npm start
```

Open http://127.0.0.1:4173. No dependencies or installation step are needed. Keep the terminal running while you use the app. Use `npm test` to check the revision rules and `npm run check` to check JavaScript syntax. Do not open index.html directly: browsers need HTTP to load the JavaScript modules.

## Try the main flow

1. Click **Load example**. Order 24 requests a chicken bowl without cheese, with a milk-allergy requirement and a preparation question.
2. In the kitchen view, record a **Can accommodate** response. For example: “We can omit the cheese, use the lemon dressing, and prepare it with clean utensils.” This is a fictional staff statement, not an automated safety verdict.
3. In the diner view, click **I've read this response**. The review-complete button becomes available.
4. Before completing the review, open **Something changed?** in the kitchen. Click **Fill example: dressing now contains milk**, then **Save change & require new review**.
5. Both views now show that another review is needed. The previous response remains in request history, but the diner cannot acknowledge it as current and the kitchen cannot complete the review.
6. Record **Cannot accommodate** with a note explaining the dressing substitution. The diner sees that response. A decline or clarification can be acknowledged, but cannot complete an accommodation review.

To demonstrate recovery, edit the meal details again to remove the milk-containing dressing, record a new accommodation response, have the diner read it, then complete the review. New meal requests can be sent after completion, or reset the demo to start again.

Use **Open view** to put the diner and kitchen in two tabs on the same browser and origin. Changes synchronize between those tabs. They do not synchronize between separate computers or browsers. Closing and reopening the site retains data in browser storage. **Reset demo** clears the app's stored demo state.

## A short demo video

- Explain the problem: a kitchen response can become outdated if a meal changes.
- Show a request, a kitchen response, and the diner reading it.
- Change the dressing to a milk-containing one. Show the visible withdrawal of the earlier response and the disabled review-complete action.
- Show a new kitchen response and the version history. Finish by explaining that the app tracks reported communication; it cannot detect allergens in food.

## How the code works

- `dist/index.html`: page structure and the two workspaces.
- `dist/styles.css`: colors, ticket layout, mobile styles, focus states, reduced motion.
- `dist/state.js`: menu fixtures and the state transitions. A change creates a new meal snapshot. Responses refer to a snapshot version, and acknowledgements refer to an exact response.
- `dist/app.js`: forms, rendering, browser persistence, tab synchronization. User-entered text is escaped before display. Dirty kitchen forms retain their original version during updates, so an outdated submission is rejected rather than silently applied to a newer meal.
- `tests/state.test.js`: meaningful checks for change invalidation, stale submissions, declined requests, response replacement, and completion rules.
- `server.mjs`: a dependency-free local static server.

The app re-reads stored state before each action. In browsers supporting Web Locks, writes from tabs are serialized. Without that API, use one tab; concurrent edits are not transactionally protected. This is a **browser-local prototype**: the diner and kitchen views are demonstration roles, not authenticated users. The browser data can be edited by its owner and is not an authoritative restaurant record.

A real multi-user version would put state transitions in a server transaction, add authenticated diner/staff roles and authorization, record an audit trail, and validate restaurant-entered ingredient data. A production service would also need careful privacy and reliability work. The app cannot detect allergens, verify what staff actually prepared, or guarantee a safe meal.

## Contest authorship

This initial prototype was generated with AI assistance. Read, understand, customize, and document your own contributions before submitting it, and disclose AI assistance according to the challenge's requirements. The simple structure is intended to make that work approachable.

## Hosting

The site is buildless. Its static assets live in `dist/`; `.openai/hosting.json` identifies the private Sites project. The deployed demo is private by default. Local development does not require a Sites account.

## Prototype verification

All 13 state tests pass. Browser checks covered sending a request, recording and reading responses, withdrawing a response after an ingredient change, rejecting a stale form in another tab, a current decline, completion, and persistence after reload. The layout was inspected at desktop, 820 px, and 390 px viewport widths, with no horizontal overflow at the smaller widths. These checks verify the demo workflow, not food safety or production readiness.
