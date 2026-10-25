# Welcome screen (V23)

The supplied coffee-app reference informed the dark frame, colored card, food
feature, page indicators and account actions. Verifed uses its own logo, Clash
Grotesk, copy and real previously sourced local dish photos.

`components/Welcome.js` owns four static dishes, captions and local assets:
Chipotle vegetarian bowl, Hawkers roti canai, Loving Hut summer rolls and Fresh
Kitchen teriyaki salmon. Original credits remain in the existing photo metadata.

A horizontal paging ScrollView supports swiping. Its onScroll handler rounds the
page offset into a bounded active index. Indicator buttons and each card's arrow
scroll to a page, wrapping after the fourth. A width-change effect repositions the
active page after rotation. There is no automatic timer. Controls use readable
labels, selected state and 44px targets.

Card height accounts for safe-area insets and window height. The parent can still
scroll on short screens or with enlarged text. Shared text wrappers select Clash
Grotesk weights. Photo captions describe the food, not allergy safety or ordering.
Their dark background keeps text contrast independent of the food photograph.

`App.js` hides the normal header and tabs during welcome, changes safe-area and
status-bar colors and allows full width up to 480px. Normal Home/auth layout
returns after an action. Get started calls account creation, Sign in opens the
existing form, and Explore as guest dismisses onboarding. Backend code is unchanged.
