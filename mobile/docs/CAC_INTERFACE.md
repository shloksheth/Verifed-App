# Verifed community mobile interface

## Purpose and navigation

This version is a public menu and dietary-information companion for the Congressional App Challenge. The useful journey is: choose dietary needs, explore actual Orlando restaurants, read the menu and its evidence, save an option, and record a meal. No restaurant subscription or staff onboarding is needed.

`App.js` keeps the existing small route stack. The five primary routes are Explore, Saved, Home, Journal, and You. Home occupies the raised center position that previously opened the scanner. Tapping a primary tab resets the stack; detail pages push onto it. Android Back pops a detail page. Finishing the dietary editor returns to the same menu without leaving a duplicate saved form in the stack. Deep links still open a restaurant.

The scanner, restaurant workspace, staff request detail, and request-composer imports and routes are removed from the mobile entry point. Their older files remain in the repository as historical implementation, but this consumer build does not import or navigate to them. The root still mounts the meal-composer sheet for personal journaling.

## Dining.js: follow the diner

`RestaurantPhoto` is a reusable React Native Image wrapper. It reads `imageUrl`, `imageAlt`, `imageKind`, and `imageCredit` from restaurant metadata. Photographs use cover cropping inside an explicitly sized container; identified brand artwork uses contain to avoid cutting off a logo. The image credit accepts a label and original-source URL and opens that source through Linking. An image error switches to a neutral restaurant icon and cuisine label. It does not substitute unrelated food photographs. The larger restaurant-menu image shows the credit. Restaurant photography identifies the venue or its published brand imagery; it is not a claim that a particular menu row is pictured.

`RestaurantRow` renders either a compact image-and-text row or a wider featured card. It counts this restaurant's menu records and, if needs are selected, source-supported dietary matches. It never labels a restaurant itself allergen-free. Pressing the card opens the shared restaurant screen.

`Home` filters out fictional restaurant records. The photograph and menu count lead into dietary preferences, a horizontally scrolling featured rail, and three plain steps explaining the app. Counts come from current state, not hardcoded claims of 20 locations. The entire photo callout opens Explore. The profile strip opens the dietary editor. Only published real-menu records appear in this route.

`Explore` also filters out fictional records. It searches restaurant names, neighborhoods, dishes, descriptions and tags. Cuisine buttons come from actual restaurant metadata. Search and cuisine filters affect both restaurant and item views. Menu-item results reveal 30 at a time so a large catalog does not mount every card immediately. This is client-side pagination of the loaded catalog, not a claim that results were fetched from a server one page at a time.

`Restaurant` preserves the two menu views and source links. A small credited photograph anchors the page while the menu tabs remain close to the top. Restaurant-reported matches require explicit support for every selected need. Possible options are shown separately, expanded initially, when available evidence lists no known conflict; their ingredient information can be incomplete. Known conflicts are excluded from the personalized view. Both groups retain the same food categories and dish-detail route. The full menu retains source allergen symbols and unknown coverage labels.

`DishCard` and `DishDetail` save favorites and open the meal composer without forcing guests to sign in. The API decides whether data belongs on this device or in the signed-in account. Cloud-backed saving can still be disabled while a public bundled record awaits cloud refresh. Saved filters out fictional dishes. Restaurant calls open the normal phone dialer; the app does not send an order or dietary information to a restaurant.

The older RequestRow and DemoButton exports remain only because historical, unused workspace modules reference them. They have no path from this version's route tree.

## Account.js: control and explanation

The profile still distinguishes allergies, dietary restrictions, likes, and dislikes. Dietary needs determine menu filtering; flavor preferences are separate. Guests can edit device-local preferences. Sign-in remains optional in Settings. Google sign-in explains its actual development-build requirement rather than pretending it works in Expo Go.

The restaurant-business space is removed from the profile's destinations. Help explains the CAC community problem, both menu views, source gaps, and questions to ask a restaurant. Export and deletion descriptions use personal data language rather than business onboarding language.

## styles.js: a small visual system

The palette uses warm cream, forest green, carrot orange, and pale olive. Large serif headlines distinguish community discovery and restaurant menus from smaller, direct menu-row text. The app avoids using photography behind essential menu text.

The `home*` styles control the large headline and photograph callout. `restaurantPhoto`, `photo*`, `featured*`, and `restaurant*` styles define the two card sizes, readable copy, crop bounds and credited menu hero. `cuisine*` styles provide scrollable selected chips. `needs*` styles highlight the user's dietary settings. `how*` styles group the short explanation without overwhelming menu browsing. `homeNav` styles the central Home action; the rest of the bottom bar retains labeled icons and accessible selected states.

The existing editorial-menu styles retain category headings, dividers, text allergen labels and the explicit dietary-mode selection. Labels are still present beside icons so color alone never carries meaning. When a photograph cannot load, the fallback preserves the layout and leaves every menu interaction usable.

## Verification boundary

Formatting parses the JSX. The parent implementation runs application tests, Metro platform exports, source-image checks and actual browser/native preview checks for the integrated release. These source explanations do not claim that an untested device, photo URL or publication has been verified.
