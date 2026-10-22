# Saving on this device

The CAC demonstration works without an account. Dietary preferences, saved dishes and journal entries persist through React Native AsyncStorage on the current device. Optional sign-in keeps a separate cloud account. Guest activity is never silently uploaded when someone signs in.

`src/api.js` owns `deviceLibrary`, containing favorite catalog keys and meal records. `deviceCollections` resolves stable keys against the current catalog so an offline text ID can later become a server UUID without losing the saved dish. Journal entries keep the name, rating, notes, creation time and stable dish key. A custom meal can exist without a catalog dish.

`editDevice` serializes changes with `createSerialQueue`. Each operation copies the current library, applies the change, persists it, then publishes the new view. Session-generation checks prevent a delayed device write from repopulating a newly signed-in account. An operation that already reached local storage remains a successful device save even when its screen has changed.

`init` restores the device library and browsing profile, ignoring malformed local JSON. `refreshCloud` uses device collections only for guest mode; signed-in meals and favorites come from their owner's database records. Signing out restores the device library. Device and cloud records are not implicitly merged.

`toggleFavorite` stores a stable catalog key for guests. `saveMeal` validates the dish name and 1–5 rating before saving. Both support account-free use. `exportData` exports the current device or account view. Guest `deleteMyData` clears the device library and browsing profile. It does not change public menu facts or another account's data. Account deletion retains its separate existing backend command.

`components/Journal.js` contains star ratings, the meal-composer sheet, searchable history and meal detail/editing. Kitchen-request history is removed from this public flow. `Account.js` exposes export and a deliberate confirmation sheet for clearing device data. Google sign-in still needs a development build on native devices; none of the core guest menu, saved or journal features depend on it.

API regression tests cover local persistence across catalog refreshes, cloud/device separation, delayed saves during sign-in, clearing and existing session-race cases. The tests strip module imports before injecting native adapters; the import-removal expression supports formatted multiline imports.
