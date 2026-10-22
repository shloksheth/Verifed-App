# Verifed

A responsive dining companion and restaurant workspace. The phone layout uses Home, Explore, Scan, History and Profile; the browser layout uses the same data with more room for menus and requests.

## Run locally

Use Node.js 22.12+ or 24. Install the pinned packages, then start Vite:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The existing earlier prototype remains in the sibling `verifed` directory; this directory contains the new application.

```sh
npm test
npm run build
npm run preview
```

## Two explicit data modes

**Try the demo** uses fictional data saved in this browser. The diner and restaurant views can both be explored without an account. It does not synchronize across devices and is not a real restaurant service.

**Sign in** uses the free Supabase project. The database enforces ownership and restaurant membership. Users can create a fictional restaurant workspace they own and share its menu link with another signed-in diner. The seeded example restaurants have no real employees. All restaurants in this build are fictional.

The public Supabase URL and publishable key in `src/config.js` allow source builds to run. Set the variables in `.env.example` to use your own project. Never put a service-role key into browser code. The SQL migrations define the database schema and authorized command functions.

## Core demonstration

1. Open the demo and review the active meal request.
2. Switch to the restaurant workspace and record a kitchen response with preparation details.
3. Return to the diner and acknowledge that response.
4. Report an ingredient or preparation change in the restaurant workspace.
5. The request requires review again. The old response stays in history, and the earlier acknowledgment cannot complete the current request.
6. Record a fresh kitchen response and review it as the diner.

Verifed tracks reported communication. It cannot inspect the prepared food or guarantee its contents. Taste suggestions are separate from allergy and dietary information.

## Learn the implementation

- `docs/SETUP_AND_ASSETS.md`: browser startup, libraries, configuration, icon and illustration.
- `docs/FRONTEND.md`: screens, components, routing, forms, scanning and responsive design.
- `docs/API_CONTRACT.md`: the interface shared by screens and the backend.
- `docs/BACKEND.md`: data model, permissions, database commands and tests.
- `docs/SCREEN_INVENTORY.md`: routes and states.
- `docs/REVIEW.md`: independent review findings and verification.

The consolidated code handbook and screen atlas are delivered alongside the design research PDF. This is AI-assisted code. Read, modify, test and document your own contribution before describing it in a competition submission.

## Authentication status

Google sign-in code is included, but provider setup is pending explicit approval of Google's API Services User Data Policy. The Google button remains disabled to prevent an unsupported redirect. The complete local diner/kitchen demo works without an account; real cloud authorization was verified with disposable password-session test accounts. Those tests do not establish working Google login. See docs/SETUP_AND_ASSETS.md for the exact remaining setup.
