V13.1 update: the mobile app offers username/email and password sign-in without Google sign-in or companion-website prompts. See ACCOUNT_LOGIN.md for current implementation and verification.

# Welcome, accounts and Home info

`components/Welcome.js` contains the opening welcome screen and the Home information sheet. App.js checks the initialized session before presenting welcome: a signed-in user goes straight to the app; a guest gets Create an account, Log in and Explore without an account. A session-local boolean dismisses welcome, so it does not interrupt ordinary navigation. A new launch/reload prompts a guest again. No session or password is invented by the welcome UI. Password-recovery links retain priority.

The Create an account button opens `auth?mode=signup`; Log in opens `auth`. Account.js provides username/email and password registration, sign-in, and password recovery directly inside the mobile app. No Google OAuth or companion-website sign-in action is exposed. Successful account creation requires a real Supabase session; email-confirmation settings and email delivery must be configured separately. Guest browsing remains functional in Snack and Expo Go.

The Home header information-circle opens HomeInfo as a sheet. It explains the purpose, navigation, personalized recommendations and evidence labels. The location label in the header opens Explore with its location editor expanded. Explore reports a chosen center back to App so the compact header label reflects the current search; it is memory-only and no GPS permission is requested.

The app remains usable when signed out. Favorites, needs and journal entries belong to the device until an actual signed-in account is used; switching account does not merge guest records into someone else’s account.
