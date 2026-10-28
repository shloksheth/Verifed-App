# Verifed

## Run the code

1. Open [Verifed on Expo Snack](https://snack.expo.dev/lbikEuqXAmomjXjU2ZfkP).
2. Click the **iOS** tab in the preview.
3. Click **Launch Snack** and wait for the app to load.

*lots more additional yap below\....*

---

## About the app

Verifed is an app I made to help people with food allergies and dietary restrictions look through restaurant menus and know what to ask before ordering. You can find restaurants, compare menu items with your dietary needs, save dishes, and write down meals you liked.

I started with Orlando restaurants and included familiar chains too. I wanted the app to be useful from choosing a place to remembering what you ordered afterward.

**Made by Shlok Sheth**

## Why I made it

The idea started with my uncle, who is allergic to sesame. He was eating at a restaurant in Orlando and had told the waiter about his allergy, but he still had an allergic reaction and ended up in the hospital. What stood out to me was that he had already explained what he could not eat, and something still went wrong.

That made me think about how much someone with an allergy has to figure out before ordering. A dish might sound fine from its name, but the menu might leave out what is in the sauce, dressing, or seasoning. I wanted to make that information easier to look through and help people figure out which questions to ask.

As I worked on the app, I added choices like vegetarian without eggs and no garlic or onion because people have different reasons for needing more information about food. I also added Journal so someone could remember a meal they enjoyed and what they would change next time.

## What it does

- **Find restaurants:** Search for restaurants and food, filter by cuisine and location, and browse a list or map.
- **Compare menus:** Choose your allergies and dietary restrictions, then switch between the full menu and **For my diet**.
- **Check the details:** Look at available ingredient and allergen information, sources, and anything that still needs confirmation.
- **Save dishes and meals:** Save food you want to try and use Journal to record the restaurant, rating, and your notes.
- **Get recommendations:** Your ratings and preferences help with suggestions, while dietary conflicts still take priority.
- **Use it as a guest or with an account:** Guest information stays on your device. Signed-in records connect to the database.

There is also a prepared English/Spanish menu example and a scripted menu chat. Currently, taking a photo opens the prepared example, and chat follows a fixed conversation. This version does not read arbitrary menu photos or answer open-ended questions with live AI.

## How I built it

I started with paper drawings of the screens and planned how they would connect. I chose the theme, fonts, colors, and layouts, then worked on turning those drawings into the actual app. I used UI tutorials, what I already knew, and a lot of trial and error.

The mobile app uses **JavaScript, React Native, and Expo**. **Supabase** handles accounts and database information, and **AsyncStorage** saves guest information on the device. The repository also includes my earlier browser prototype and a React/Vite companion app.

I used chatgpt to help turn my drawings into interface previews, generate repetitive boilerplate, help connect the app to Supabase, research menu information, and find errors. I also used AI image tools to clean up some images and create some illustrations. I also used it to duplicate monotonous files that were useless for me to code.

I planned the app's screens and behavior, made the design decisions, reviewed the results, and tested it repeatedly. It took me around 3 weeks to build the app, with around 115 hours of work total. Development reached version 30 with a lot of smaller updates along the way. The version history and older links are in [details.md](details.md).

## What was hard

One of the biggest challenges was working with menus that give very different amounts of information. Some restaurants publish detailed allergen documents, while others only give a short description.

The app checks listed allergens and ingredient conflicts first, then checks the restaurant's dietary information. When there is not enough information, the item still needs confirmation. An allergen being left off a menu does not mean it is absent. Ingredients and cross-contact still need to be checked with restaurant staff.

Keeping guest and account information separate was another challenge, especially when someone signs out while a save is finishing.

I also spent a lot of time fixing the design. Sometimes I thought an element was missing when I had actually put it off the screen. Long dish names, food images, and forms needed a lot of adjustments to fit properly on a phone.

I tested repeatedly and used automated checks and browser reviews to find problems. Physical-phone testing is still important because the camera and keyboard can behave differently from a web preview.


## What I would add next

I would start by contacting restaurants directly for more complete ingredient and allergen information. I would also give them a way to update their menus when recipes change and show when the information was last reviewed.

I want to add group dining so families or friends can combine their dietary needs and compare places together. After improving the existing information, I would expand beyond Orlando and test with more people to see what they find useful and what still needs work.

