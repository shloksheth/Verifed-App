# Native code review fixes

The API now captures the session generation, mode, and user before each mutation.
If a response arrives after sign-out or an account/demo switch, it still returns
the committed result but cannot publish that account's records or warnings into
the new session. This covers commands, profiles, meals, favorites, passwords, and
local demo edits.

Demo entry, reset, and edits share one persistence queue. Reset therefore writes
the original sample data after any already-running edit finishes. Edits still
waiting when a session changes stop before writing. Sign-in and sign-out remove
the saved demo-mode flag through that same queue, so a delayed demo entry cannot
restore the flag after sign-out.

`tests/api-session.test.js` exercises the actual API with delayed native storage
and database adapters: reset during a write, sign-out during a write, queued edit
cancellation, and late cloud command/profile/meal/favorite responses. Real device
camera, OAuth callbacks, share sheets, and keyboard behavior remain outside this
code-level verification.
