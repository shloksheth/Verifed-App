# Welcome, accounts and Home info

`components/Welcome.js` contains the opening welcome screen and the Home information sheet. App.js checks the initialized session before presenting welcome: a signed-in user goes straight to the app; a guest gets Create an account, Log in and Explore without an account. A session-local boolean dismisses welcome, so it does not interrupt ordinary navigation. A new launch/reload prompts a guest again. No session or password is invented by the welcome UI. Password-recovery links retain priority.

The Create an account button opens `auth?mode=signup`; Log in opens `auth`. Account.js uses the mode to show the relevant title and Google action. The first successful Google login creates a Supabase identity; returning logins use that account. No new email-registration flow was enabled because email delivery is not configured. Existing email accounts retain their password/reset forms.

Google OAuth on mobile still requires a development build using the registered app callback. Expo Go/Snack cannot receive that callback. The UI explains this and offers the companion website. Signing into the website does not secretly create a native session. Guest browsing remains functional in Snack. Browser Google auth uses the existing configured provider, without broader Gmail or Drive scopes.

The Home header information-circle opens HomeInfo as a sheet. It explains the purpose, navigation, personalized recommendations and evidence labels. The location label in the header opens Explore with its location editor expanded. Explore reports a chosen center back to App so the compact header label reflects the current search; it is memory-only and no GPS permission is requested.

The app remains usable when signed out. Favorites, needs and journal entries belong to the device until an actual signed-in account is used; switching account does not merge guest records into someone else’s account.
