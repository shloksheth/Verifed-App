# Frontend: reading the app by feature

## Starting point and navigation

src/main.jsx creates the React root and loads styles.css followed by brand.css. src/App.jsx reads a URL hash into page, optional ID and query parameters. A hash works on static hosting without rewrite rules and supports browser back/forward. navigate closes transient dialogs and changes the hash; a hashchange resets scroll. App subscribes to api with useSyncExternalStore and initializes the adapter once. Loading, connection errors with Retry, unknown routes and a screen error boundary have visible states. The skip link focuses the main content. Request and journal composers are controlled centrally so any relevant screen can open them.

## components/Shell.jsx

Logo displays the refined carrot-check PNG and a text wordmark. The five recurring diner tasks are Home, Explore, Scan, History and Profile. Desktop uses a persistent sidebar; phones use labeled bottom navigation. Related details highlight their parent destination. Saved dishes, Restaurant space and Help are additional desktop links and profile destinations. The top bar identifies local demonstration, guest sample menus or a connected account. Guest users have an explicit Try demo action. Restaurant work is a separate context because staff need a queue, not the diner's personal recommendations.

## components/UI.jsx

Button centralizes visual variants and disables an in-flight operation. PageTitle and SectionTitle preserve heading/action order. Empty supplies truthful no-data states, Field associates a label with its control, and ToggleChips uses pressed buttons for multiple-choice lists. Status maps internal states to readable labels. ErrorMessage is an alert. useTask wraps asynchronous work with busy/error state and runs a success callback only after success.

Dialog remembers the focused element, locks background scrolling, focuses its section, traps Tab/Shift-Tab, closes on Escape or backdrop click, and restores focus when removed. It has dialog and modal semantics. FoodArt is an illustrative food tile using a sample emoji; it is not a photograph or evidence of ingredients. formatDate formats stored timestamps in the viewer's locale; money formats USD prices.

## components/Dining.jsx

Home starts with Scan a menu and Browse sample menus, then the diner's open requests, editable profile summary and three ranked dish suggestions. The request filter checks the current diner ID and excludes closed states. No promotional hero hides the primary task.

Explore owns a search query, category and Hide known conflicts toggle. Search includes names, descriptions, restaurant names and flavor tags. Unknown information remains visible. Restaurant lists one fictional restaurant's menu and identifies whether a sample kitchen connection exists. DishCard includes ingredient assessment and a saved toggle; guest saving opens sign-in. DishDetail separates flavor preference/rating explanations from reported ingredients, allergens and preparation. Ask the kitchen only opens a request for a confirmed workspace; unconnected sample menus explain the limitation. Assessment displays conflict, unknown or review wording and never a safe-food badge.

## components/Requests.jsx

RequestComposer starts with the chosen profile requirements or an existing request snapshot. The diner chooses what to share, modifications and a question. Submitting creates a request or resubmits it using the captured existing revision. The response navigates to the resulting conversation; failures remain in the dialog.

RequestSnapshot shows the information shared for that meal version. RequestTimeline displays the immutable event list, historical snapshots and viewer-aware Diner/You labels. A prior response is labeled outdated when either its revision or response ID differs. ChangeSummary finds the most recent earlier snapshot and renders before/now values for changed fields.

RequestDetail shows a kitchen response only in its relevant state, acknowledges the exact response ID and current revision, and permits completion only after acknowledgment. review_required shows the change reason, field comparison and need for another kitchen response. Diner requirements can be updated or the request cancelled. Staff cannot acknowledge on behalf of another diner. The local demo offers a shortcut to the staff view.

## components/Journal.jsx

MealComposer accepts a catalog dish, an existing journal entry, or neither for a custom meal. It initializes name, place, rating, tags and notes from the entry when editing. A required one-to-five rating and named meal are saved through api.saveMeal. Passing the existing ID updates one record; creation time is preserved. HistoryPage switches between personal meals and requests, searches text, sorts by recency, and provides a custom-meal action. MealDetail displays the rating and note, opens Edit meal with the original entry, and links to a catalog dish when available. Favorites filters the current catalog by the owner's saved IDs. Ratings describe taste, not allergy suitability.

## components/Account.jsx

Auth makes Google the primary sign-in and account-creation path. Existing email accounts and password recovery remain under a disclosure; general email registration is not advertised without custom SMTP. It also offers a local demo and a return to browsing. Password recovery uses Supabase's recovery session state.

ProfileEditor groups display name, allergies/restrictions and taste likes/dislikes separately. Saving updates the adapter and returns to Profile. Profile summarizes that data and offers profile editing, saved dishes, the restaurant workspace, help and settings. Guests receive a sign-in/demo path rather than fake saved data. SettingsPage signs out, exports a JSON file and shows a scope-specific confirmation before clearing personal data or resetting a local demo. Help explains the process, fictional content, data behavior and the limitations of reported ingredient information.

## components/Scanner.jsx

The camera remains off until Open camera. The html5-qrcode library is dynamically imported, requests a rear-facing camera and decodes locally. A successful Verifed link or known code opens that restaurant. The manual input accepts a restaurant ID, name or Verifed menu URL; CITRUS opens the fictional sample. Unsupported/insecure browser access, unknown codes and permission/start failures produce readable messages. stop releases the camera; the effect cleanup also stops it on navigation. Physical-camera decoding has not been verified on a real phone in this session.

## components/Workspace.jsx

Workspace derives its selectable restaurants from memberships, filters queue requests for that restaurant, and shows counts computed from actual sample data. Staff can filter active/all/changed requests, select a conversation and refresh. RestaurantSetup creates an owned fictional workspace. DishEditor initializes a captured menu draft and saves every exposed field; api/SQL reject stale menu revisions. The menu manager lists, adds and edits dishes. ShareMenu creates a QR image and a copyable restaurant link.

StaffRequest displays the diner snapshot, decision selector and response message. The draft captures expectedRevision. If polling changes the request while staff are writing, Send is disabled and an explicit review/start-again action clears the draft and adopts the new revision. ChangeForm likewise captures its opening revision. Recording a change invalidates a previous response; completion belongs to the diner. Staff timelines use Diner instead of You for diner-authored events.

## styles.css and brand.css

styles.css contains shared component geometry: grids, panels, forms, dialogs, queue, scan frame and responsive breakpoints. Text below twelve pixels was raised during review. brand.css is the final brand and usability layer: the supplied carrot-check identity, warm ivory background, orange actions, brown text and restrained leaf green preferences/status accents. Typography uses DM Sans with system fallbacks. Headings use weight and spacing rather than the earlier decorative serif. Phone menus become readable horizontal rows instead of shrinking a three-column grid. Touch controls remain labeled and focus outlines are visible. Reduced-motion preferences suppress transitions.

Phone authentication is compact so sign-in and demo access fit without a large marketing panel. Desktop uses a wider brand panel. The app remains one source implementation with responsive layouts, not two divergent codebases.

## Explain a complete interaction

Trace Ask the kitchen from DishDetail to RequestComposer, through api.createRequest and the database command, back through publish and useSyncExternalStore to RequestDetail. Then trace a staff change through ChangeForm, the command's locked update, and the new revision. Show why an earlier response cannot complete the changed meal. Read tests/domain.test.js for the same behavior without the interface.

This implementation was made with AI assistance. The guide explains it; it does not establish student authorship. Identify and document your own work honestly for the competition.
