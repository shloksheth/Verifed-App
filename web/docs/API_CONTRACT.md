# Verifed browser API contract

`src/api.js` exports `api`. All writes return promises and throw readable `Error`s; callers must display errors. `api.getState()` returns a stable snapshot and `api.subscribe(listener)` returns an unsubscribe function. Call `api.init()` once. State fields: `{ready, mode, user, profile, restaurants, dishes, requests, meals, favorites, memberships}`. Modes are `guest`, `demo`, `cloud`. Guest can browse; demo is explicitly local. No silent network-to-demo fallback.

Entities use camelCase:

- profile: `{id, name, allergies: string[], restrictions: string[], likes: string[], dislikes: string[]}`.
- restaurant: `{id, name, location, description, emoji, confirmed: boolean, fictional: true}`.
- dish: `{id, restaurantId, name, description, price, emoji, category, ingredients: string[], allergens: string[], tags: string[], modifications: string[], preparation, informationComplete: boolean, revision}`.
- request: `{id, userId, restaurantId, dishId, dishName, revision, status, snapshot, response, acknowledgedResponseId, events, createdAt, updatedAt}`. Status `submitted`, `responded`, `clarification`, `declined`, `review_required`, `acknowledged`, `completed`, `cancelled`. Snapshot `{dishName, ingredients, allergens, preparation, allergies, restrictions, modifications, question, dishRevision}`. Response null or `{id, revision, decision, message, createdAt}`; decision `accommodate`, `clarify`, `decline`. Events `{id, type, revision, actor, message, at, snapshot?}`; snapshots immutable.
- meal: `{id, dishId?, restaurantId?, dishName, restaurantName, rating:1..5, notes, tags:[], createdAt}`; custom meals have no dishId.
- favorites: array of dish ID strings. Membership: `{restaurantId, role:'owner'}`.

Methods:

```
api.init(); api.refresh(); api.enterDemo(); api.resetDemo();
api.signUp(email,password,name) // {verificationRequired:boolean}
api.signIn(email,password); api.signInWithGoogle(); api.signOut();
api.saveProfile(profile);
api.createRequest({dishId, allergies, restrictions, modifications, question});
api.actOnRequest(id, action, payload, expectedRevision);
// respond payload {decision,message}; acknowledge {responseId};
// change {ingredients,allergens,preparation,reason} staff only;
// resubmit {allergies,restrictions,modifications,question} diner only;
// cancel {}, complete {} (complete requires current acknowledgment)
api.saveMeal({id?,dishId?,restaurantId?,dishName,restaurantName,rating,notes,tags}); // id edits own meal, preserving createdAt
api.toggleFavorite(dishId);
api.saveDish(dish); // owning staff; all active related requests become review_required
api.addDish({restaurantId,name,description,ingredients,allergens,preparation,price,category,emoji,tags,modifications,informationComplete});
api.createRestaurant({name,location,description}); // creates OWN fictional workspace + sample dishes atomically
api.exportData(); // returns object; UI handles download
api.deleteMyData(); // removes own requests/history/profile/favorites, retains auth account and staff business records
api.resetPassword(email); api.updatePassword(password); // state.passwordRecovery indicates recovery link
```

Demo has one sample diner, memberships on first restaurant and an active request; UI may freely switch diner/staff views in demo. Cloud UI must use memberships to enable staff views. Cloud seed restaurants have no staff members and cannot actually respond. Users can create a fictional workspace to test real authorized staff actions. Dish lookup and updated request retrieval happen in the API; do not mutate api state.

`src/domain.js` exports `assessDish(dish,profile,meals=[])` → `{level:'conflict'|'unknown'|'review', conflicts:[], reasons:[], tasteScore:number, tasteReasons:[], learnedReasons:[]}`, `rankDishes(dishes,profile,meals=[])`, `transitionRequest(request,action,payload,actor,expectedRevision)` (pure; actor `diner` or `staff`), `makeRequest(dish,input,userId)`, `makeDemoState()`. `src/data.js` exports `ALLERGENS`, `RESTRICTIONS`, `TASTE_TAGS`, `restaurants`, `dishes`, `defaultProfile`.

No assessment means a prepared meal is safe. Show known conflict/ask restaurant/review ingredients; taste rankings never override allergen conflicts.
