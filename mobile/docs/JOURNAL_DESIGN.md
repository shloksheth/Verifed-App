# Journal screen and meal editor

The journal is a personal record of actual meals. This update changes presentation in `components/Journal.js`; it does not change the storage API, menu catalog, meal schema, filtering domain rules or account behavior.

## Following the screen

`History` starts with the compact title Journal and the number of stored meals and distinct place names. Place names are trimmed and compared without capitalization differences, so multiple notes about the same named place do not inflate that summary. These counts come from `state.meals`; the screen does not insert sample meals or imagined activity.

The prominent Log a meal button opens the existing meal sheet. Search matches a dish or place name. All meals shows every entry; Loved shows ratings of four or five. Tab counts reflect the entire stored journal, while a search-results heading shows the number of entries after filtering. Filtering creates a new array before sorting newest first, leaving application state unchanged.

`MealRow` is one full-width accessible button. Linked menu entries use the existing `FoodArt` component and its real-photo/illustration labeling behavior. A custom meal without a linked catalog item has no invented food thumbnail. The existing photo component can also omit imagery when no image is available. Name, place, taste score, date and a short note form a single readable row separated by a divider rather than a stack of cards. Notes and titles have line limits to keep the list manageable; the full note remains in meal detail.

An empty journal invites the first real entry. An empty Loved filter explains its four-or-five-star threshold. A search with no results offers a way to clear the filters. No placeholder dish or fabricated rating is displayed.

## Meal detail and editing

`MealDetail` looks up the entry by its ID and retains the existing missing-entry fallback. It shows the dish title, place and original date. Only an actual linked catalog dish is passed to `FoodArt`; no made-up fallback dish object is created. Taste rating and written notes are separate, simple sections. Tags appear only when the user saved tags. Edit meal reuses the existing entry and linked dish; View menu item appears only when the linked catalog record is still present.

`MealComposer` retains all form state and the existing save payload: entry ID, dish ID, restaurant ID, dish name, place name, rating, notes and tags. It still requires nonblank name and place plus a one-to-five rating, trims name and place, uses the same length limits, and calls `api.saveMeal`. The sheet closes and navigates to history only through the success callback. `useTask` keeps pending/error behavior unchanged.

The editor uses direct labels rather than questions as labels. Rating choices have 44-by-44 tap targets, radio semantics and a spoken value/description. The selected rating description is a polite live region. Optional notes and flavors remain optional. A taste rating describes preference and does not establish allergy safety.

## Visual choices

The local `j` StyleSheet keeps journal-specific layout alongside its component, avoiding conflicts with the shared theme. It reads the shared app colors and uses the bundled font aliases through `Typography.Text`. The journal title and detail headline use HomeHeading. Compact labels and meal names use the app's sans serif treatment. The primary action inherits the app's coral button style.

Summary numbers sit on an open background, separated by a short rule. The tab bar uses an underline rather than another rounded container. The list uses food imagery, clear spacing and hairline-like separators. Rows have shrinking text columns and wrapping metadata to remain usable at narrow widths. The single circular empty-state journal symbol is an orientation cue, not a fake meal image.

## Validation

The edited JSX is parsed with the installed Babel parser and formatted with Prettier. Existing API/session and write-synchronization tests are run to check that the unchanged personal-meal flows remain covered. Integrated visual preview and platform export results are reported by the parent task. No physical-device testing is claimed by this document.
