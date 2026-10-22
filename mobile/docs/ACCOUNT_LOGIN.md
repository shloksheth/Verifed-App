# Account login

## Frontend: `components/Account.js`

The `Auth` component uses one form with four modes: sign in, sign up, request a password reset, and choose a replacement password. The initial route selects the mode. Changing tabs clears the password, notice, and error, while retaining the other fields so the user can correct them. A mode change is ignored during a pending submission.

Account creation asks for a username, a required email address, and a password. The username hint explains the 3–24 letters/numbers/underscores rule and case-insensitive matching. `validateSignup({ username, email, password })` checks and normalizes the inputs before `api.signUp(email, password, username)` runs. The UI moves home only after the API resolves. There is no verification-code or confirmation-email screen in this flow.

Sign-in asks for **Username or email** and **Password**. `validateLogin(identifier, password)` validates and normalizes the identifier before `api.signIn(identifier, password)`. The client does not try to look up another user's email address. The backend owns the username resolution and authentication decision.

The reset form still requires an email address. If the sign-in field contains an email, selecting Forgot password carries it into the reset form. A successful reset request displays the existing account-neutral notice. The recovery form calls `api.updatePassword(password)` and then returns home. Requesting a reset and delivering an email are separate operations; this UI change does not establish that email delivery was tested.

`useTask` prevents duplicate submissions and displays API or validation failures through `ErrorText`. Credential fields stop being editable while a submission is pending. Username and email fields disable capitalization and autocorrection; the password field uses secure text entry and the correct current/new-password autofill hint. Pressing the keyboard's submit control on the password field follows the same validation path as the button.

Password forms are the primary route in Snack, Expo Go and web. Google is secondary: development builds get the native button; previews link to the companion website and explain that its session stays there.

## Welcome: `components/Welcome.js`

The existing Create account, Log in, and Explore without an account actions remain. The footer now describes username, email, and password registration instead of directing all new users to Google. Guest preferences, saved dishes, and journal entries are still described as belonging to the device.

## Authentication and database

`src/account-auth.js` normalizes usernames and emails, validates form fields, and translates server failures into useful errors. Email login goes directly to Supabase Auth. Username login calls the `account-auth` Edge Function, then installs the returned access/refresh tokens using Auth's `setSession`. `src/api.js` keeps its existing account-generation guards and refreshes the signed-in profile after either route. Passwords are passed only to the authentication service and are never stored in profiles or the username table.

The migration `20261022143514_username_password_auth.sql` adds a private username registry. Its primary key enforces uniqueness after normalization, including simultaneous signups. An Auth insert trigger binds the requested username to the newly created user's UUID and creates the initial profile. Later edits to user metadata cannot rename or transfer that registry entry. Existing Google accounts can continue without usernames. Profiles retain owner-only RLS. The follow-up account_lookup_auth_columns migration grants the trusted server role SELECT on only auth.users id and email; it does not grant clients access or expose password hashes.

The private registry and attempt counters deny client access. `public.verifed_account_lookup` is an invoker function executable only by the server service role. It resolves a username to Auth's current email and limits lookups to twelve per username per minute, deleting counters older than ten minutes. No public email-lookup endpoint exists. The attempt buckets contain identifier hashes; account existence is intentionally disclosed through the username-availability response so duplicate names get a useful error.

`supabase/functions/account-auth/index.ts` validates requests and uses runtime-only server keys to call that restricted lookup. Availability requests return a boolean. Login requests pass the password to the normal Auth password endpoint and return only session tokens; those tokens naturally identify the user's own account. Missing usernames and wrong passwords use the same error. The endpoint is available before login because it performs password authentication itself; its gateway JWT check is disabled. CORS permits Snack and native/web clients, and responses disable caching. Supabase's password endpoint limits still apply in addition to the username limit.

Signup first checks availability, then calls normal Auth signup. A database collision is rechecked and shown as “Username already exists.” Duplicate email returns a separate prompt to log in. Immediate signup requires Supabase Confirm email to be off; the client never pretends an unconfirmed account is signed in. This prototype therefore does not verify ownership of a supplied email. Password reset remains dependent on an email-delivery provider; general public reset delivery has not been verified.

`tests/account-auth.test.js` covers validation, normalization, duplicate email, duplicate username, simultaneous-claim error mapping, session installation and rate-limit messages. `scripts/verify-account-auth.mjs` uses a disposable live account, keeps its random password/tokens in memory, signs out, and records only pass names and the disposable UUID in `account-auth-verification.json`. Test-account cleanup is a separate administrative step after sessions are revoked. The source publisher now includes backend migrations and functions under `web/supabase` so the released implementation is reviewable.

## Verification

91 automated mobile tests and all three platform exports pass. The phone-width browser preview renders both forms and blocks empty submissions. Live signup remains pending approval to disable Supabase email confirmation; no live account success is claimed yet.
