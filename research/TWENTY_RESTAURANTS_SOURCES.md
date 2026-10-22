# Twenty Orlando restaurant menus

Reviewed 21 October 2026. These are published food-menu inventories, not live stock or a certification of a prepared meal. All 20 physical addresses matched FL-10 in Census ACS2025 geography for the 119th Congress. The contestant must confirm their own registration district separately.

| Restaurant | Food entries | Official menu |
| --- | ---: | --- |
| Hawkers Orlando | 49 | [Source](https://eathawkers.com/menus/dining/) |
| Fresh Kitchen · Waterford Lakes | 35 | [Source](https://www.eatfreshkitchen.com/menu) |
| Chipotle · South Orange | 26 | [Source](https://locations.chipotle.com/fl/orlando/2211-s-orange-ave) |
| Black Rooster Taqueria | 27 | [Source](https://www.blackroostertaqueria.com/menu-mills/) |
| Pig Floyd’s & Pigzza | 43 | [Source](https://www.pigfloyds.com/) |
| Tako Cheena | 22 | [Source](https://tako407cheena.com/menu?dialogState=orderDetails) |
| Loving Hut Orlando | 61 | [Source](https://lovinghut.us/orlando/) |
| The Strand | 20 | [Source](https://www.strandorlando.com/food) |
| The Monroe | 69 | [Source](https://www.themonroeorlando.com/menus) |
| Lazy Moon · Mills/50 | 97 | [Source](https://order.lazymoonpizza.com/menu/lazy-moon-mills-50-1011-east-colonial-drive) |
| Winter Park Biscuit Company | 41 | [Source](https://order.toasttab.com/online/winterparkbiscuitco) |
| Reyes Mezcaleria | 32 | [Source](https://www.reyesmex.com/copy-of-happy-hour-menu) |
| The Osprey | 39 | [Source](https://www.theospreyorlando.com/copy-of-menu) |
| Seito Sushi · Baldwin Park | 81 | [Source](https://www.seitosushibp.com/menu) |
| The Stubborn Mule | 84 | [Source](https://order.toasttab.com/online/the-stubborn-mule-100-s-eola-drive) |
| Pizza Bruno · Curry Ford | 68 | [Source](https://pizzabrunofl.com/order/pizza-bruno-curry-ford-3990-curry-ford-road) |
| Mamak Asian Street Food | 70 | [Source](https://order.toasttab.com/online/mamak-asian-street-food-1231-e-colonial-drive) |
| Tin & Taco · Downtown | 119 | [Source](https://order.toasttab.com/online/tin-and-taco-downtown-orlando-40-w-washington-st) |
| Sparrow | 26 | [Source](https://www.sparroworlando.com/menu) |
| Osteria Ester | 54 | [Source](https://www.osteriaester.com/menu) |

## Source coverage

The original three catalogs use their official food menus and allergen guides. Chipotle lists standard components rather than inventing complete configured burrito recipes. Fresh Kitchen includes components and bowl formats. Each record carries its source and review date.

The 17 additions include every food listing captured from the linked menu pages and their meal-period pages. Drinks, alcohol, retail goods, catering quantities and optional modifier trees are excluded. Identical promoted entries are collapsed. A named choice-based meal remains a configurable entry; its full recipe is not invented. Out-of-stock entries can remain part of a published menu; availability needs checking.

Parent review corrected Black Rooster ingredient extraction, removed image-alt duplication from Loving Hut names, separated two Lazy Moon names from their descriptions, removed Monroe beer and Reyes bar drinks, and removed inferred vegetarian labels from Tako Cheena sauces. Loving Hut gluten-free and soy-free icons are read separately from options-only icons.

The Pig Floyd’s source is the current merged Pig Floyd’s & Pigzza homepage menu at 1050 N Mills. The former address and obsolete /menu page are not used.

Official named dietary labels are kept as source-supported tags. Recipe clues are calculated separately by the app. A vegan label entails vegetarian suitability but never entails allergy absence. No missing ingredient or blank matrix cell establishes an allergen-free claim.

The public source snapshots are in research/menu-sources. import-expanded-menus.py parses them without executing downloaded page scripts. build-menu-catalog.mjs validates keys and taxonomy and generates both mobile data modules. Per-restaurant coverage and caveats remain available inside the app.

## Location evidence

research/verify-districts.mjs saved each Census response in research/district-evidence. The generator derives the displayed district from those responses, rather than hardcoding FL-10 for an unverified address.

## Images

See IMAGE_SOURCES.md. Eighteen official photographs and one official brand-art image are available; Tako Cheena uses a neutral fallback because its official endpoint rejects requests. No unrelated food image was substituted.
