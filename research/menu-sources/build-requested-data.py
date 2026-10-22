"""Rebuild the additional restaurant source inventory from reviewed public menus.

The local PDFs/HTML are evidence snapshots, not a live ordering integration.
Allergen absence is deliberately left unknown. The app's separate clue matcher
can reason about the restaurant's words without turning guesses into declarations.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import copy
import json
import re
import unicodedata

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS = ROOT / 'menu-sources'
REVIEWED = '2026-10-21'
METADATA = json.loads((ROOT / 'requested-restaurants.json').read_text(encoding='utf-8'))


def slug(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def item(name, category, description, url, tags=None, note=None):
    return {
        'key': slug(name), 'name': name, 'category': category, 'kind': 'dish',
        'description': description,
        # These are menu-listed ingredient phrases, never a complete recipe.
        'ingredients': [p.strip() for p in description.split(',') if p.strip()],
        'allergens': [], 'freeFromAllergens': [], 'freeFromClaims': [],
        'tags': tags or [], 'coverage': [],
        'evidenceNote': note or 'Published dish description; ingredients and cross-contact are not fully disclosed. Confirm with the restaurant.',
        'menuUrl': url, 'allergenUrl': None, 'reviewedAt': REVIEWED,
        'informationComplete': False,
    }


def restaurant(key, items, coverage, caveats, urls):
    meta = next(x for x in METADATA if x['key'] == key)
    return {
        'key': key, 'name': meta['name'], 'menuUrl': meta['menuUrl'],
        'allergenUrl': meta.get('allergenUrl'), 'scope': meta['source']['scope'],
        'menuCoverage': coverage, 'availabilityVerified': False,
        'allergenCoverage': [], 'sourceCaveats': caveats, 'sourceUrls': urls,
        'items': items,
    }


WOODLANDS_URL = 'http://www.woodlandsusa.com/images/Orlando.pdf'
# The 100 numbered food entries were transcribed from all six rendered pages.
# Spelling is lightly normalized; variants are kept together when the source does.
WOODLANDS = '''
## Appetizers
Iddly|Steamed rice and lentil patties
Kaaram Iddly|Iddly with spiced powder chutney and ghee
Medhu Vada|Fried lentil donuts
Dhai Vada|Fried lentil donuts dipped in yogurt
Samber Vada|Fried lentil donuts dipped in samber
Rasa Vada|Fried lentil donuts dipped in rasam
Potato Bonda|Potato dumpling with chickpea flour
Vegetable Samosa|Crispy and flaky crust stuffed with potatoes and peas
Vegetable Cutlet|Minced vegetables with spices, coated with breadcrumbs and fried
Mixed Vegetable Pakora|Potatoes, onions and chilies; spiced crisp fritters
Chilly Pakora|Chilies; spiced crisp fritters
Paneer Pakora|Lightly spiced homemade Indian cheese fritters
Samosa Chat|Topped with chickpeas; served with yogurt and sauces
Tandoori Momo|Momos sauteed with onions, bell peppers and tandoori sauces
Tandoori Paneer|Paneer sauteed with onions, bell peppers and tandoori sauces
Assorted Appetizers|Vada, potato bonda, vegetable samosa, vegetable cutlet and pakora
## Soups
Fresh Homemade Tomato Soup|
Rasam|Traditional South Indian sour and spicy soup
Sambar|Lentil soup with fresh vegetables and exotic spices
## Dosai
Sada Dosai|Thin rice crepes; served with samber and chutney
Masala Dosai|Thin rice crepes filled with potatoes and onions; served with samber and chutney
Sada Mysore Dosai|Thin rice crepes with a layer of hot chutney; served with samber and chutney
Mysore Masala Dosai|Thin rice crepes with layers of hot chutney, filled with potatoes and onions; served with samber and chutney
Podi Masala Dosai|Rice crepes filled with onions, potatoes and layers of hot chutney powder; served with samber and chutney
Onion Masala Dosai|Crepes with onion topping, filled with potatoes and onions; served with samber and chutney
Butter Masala Dosai|Crepes filled with potatoes and onions, cooked with butter; served with samber and chutney
Sada Rava Dosai|Thin crepes with cream of wheat and rice; served with samber and chutney
Onion Rava Dosai|Cream of wheat and rice crepes with onion and chilies; served with samber and chutney
Onion Rava Masala Dosai|Cream of wheat and rice crepes grilled with onions and chilies, filled with potatoes and onions; served with samber and chutney
Paper Dosai|Thin rolled crispy rice crepes; served with samber and chutney
Paper Masala Dosai|Thin rice crepes filled with potatoes and onions; served with samber and chutney
Spring Dosai|Thin rice crepes filled with vegetables and hot chutney; served with samber and chutney
Cheese Dosai|Thin rice crepes filled with American cheese, onion, pepper and hot chutney; served with samber and chutney
Palak Dosai|Thin rice crepes with layers of cooked spinach, onion and potato; served with samber and chutney
## Uthappam
Plain Uthappam|Indian style pancake
Tomato & Peas Uthappam|Indian style pancake with tomato and peas topping
Onion & Peas Uthappam|Indian style pancake with onion and peas topping
Onion & Hot Chili Uthappam|Indian style pancake with onion and chili topping
Vegetable Uthappam|Indian style pancake with tomato, peas, carrots, chilies and onion toppings
Coconut Uthappam|Indian style pancake topped with coconut shreds
## House Specialties
Pongal Avial|Rice and lentils cooked like khichidi, served with the special dish avial
Pesarat Uppuma|Whole moong and rice crepe topped with onions and chili, filled with uppuma
Special Uppma|Cream of wheat garnished with spices and nuts
Poori Sagoo|Smashed potato gravy with onion, tomato and green peas
Chana Batura|Large puffy bread served with chickpeas
Chana Poori|Fried fluffy wheat bread served with chickpea curry
## Thali
South Indian Thali|Chapati, white rice, sambar, dhal, kootu, avial, poriyal, rasam, curd, pickle, papad and dessert
Mysore Royal Thali|Chapati, special rice, white rice, sambar, kootu, chana curry, avial, rasam, tomato soup, curd, pickle and dessert
Curry Dinner|Choice of any curry and tomato soup, served with dall, rice, naan and dessert of the day
## Curry Plates
Dall Tadka|Yellow dall cooked with tomatoes and spices; served with rice
Avial|Garden fresh vegetables, coconut sauce and spices; served with rice
Chana Masala|Chickpeas cooked in exotic spices; served with rice
Baigan Bartha|Baked fresh eggplant mashed with tomatoes and onions, cooked with spices; served with rice
Special Vegetable Curry|Vegetables with herbs and spices; served with rice
Vegetable Korma|Garden fresh vegetables cooked in coconut milk and spices; served with rice
Navratan Korma|Vegetables and fruits cooked in creamy sauce and spices; served with rice
Kadai Bhendi|Fresh okra cooked in kadai with spices; served with rice
Palak Paneer|Spinach and cheese cooked with tomato, onion and spices; served with rice
Mutter Paneer|Peas and cheese cooked with tomato, onion and spices; served with rice
Malai Kofta|Potato, cheese and dry fruit cooked with creamy sauce and spices; served with rice
Vegetable Makhani|Mixed vegetables cooked in tomato with creamy sauce; served with rice
Paneer Makhani|Cubes of paneer cooked in tomato based creamy sauce; served with rice
Aloo Channa|Potato and chickpeas cooked with spices; served with rice
Aloo Gobi|Potato and cauliflower cooked with tomatoes and spices; served with rice
Kadai Paneer|Sliced paneer, onion and bell pepper cooked in kadai with spices; served with rice
## Pullavs
Vegetable Pulav|
Bisi Bele Bhath|Rice cooked with lentils and fresh vegetables
Bagala Bhath|Rice mixed with yogurt and garnished with cucumber and mustard seeds
Coconut Rice|
Tamarind Rice|
Tomato Rice|
Lemon Rice|
Paneer Rice|
## Chinese Speciality
Gobi Manchurian (Dry)|Cauliflower marinated with flour, sauteed with garlic, ginger, chili and soya sauce
Tofu Chili (Dry)|Fried tofu sauteed with garlic, ginger, green pepper, chili, onion and soya sauce
Momo Manchurian (Dry)|Momos sauteed with bell peppers, onion, garlic, ginger and soya sauce
Paneer Chili|Fried paneer sauteed with garlic, ginger, bell pepper, chili, onion and soy sauce
Gobi Manchurian (Gravy)|Cauliflower marinated with flour, sauteed with garlic, ginger, chili and soya sauce
Hakka Noodles|Assorted vegetables cooked with noodles, spices and soya; optional tofu add-on
Vegetable Fried Rice|Assorted vegetables cooked with rice and soya sauce
## Breads
Batura|Large fried puffy bread
Poori|Fried fluffy whole wheat bread
Chapati|Soft thin whole wheat bread
Paratha|Multi-layered whole wheat bread
Aloo Paratha|Multi-layered whole wheat bread with potatoes and spices
Butter Naan|Oven baked bread with butter
Garlic Naan|Oven baked bread with garlic
## Sides
Plain Rice|
Milakai Podi|Spicy mixed ingredients
Raita|Yogurt with cucumbers, onions and fresh coriander
Papadum|Crisp lentil wafers
Plain Yogurt|
## Desserts
Gulab Jamoon|Dry milk and cottage cheese fried balls dipped in sweet syrup
Rasmalai|Homemade cottage cheese in sweet condensed milk, flavored with rose water and garnished with pistachio nuts
Badam Halwa|Ground almonds cooked with honey and butter
Madras Payasam|Fine vermicelli cooked with milk and honey, garnished with raisins and cashews
Ice Cream|Vanilla, mango, pistachio or paan; flavor must be confirmed
Falooda|Rose ice cream, milk, rice noodles, takmaria seeds and rose syrup, topped with a cherry
Kulfi|Traditional Indian ice cream
Kulfi Falooda|
'''


def from_table(table, url, tags=None, note=None):
    result = []
    category = ''
    for line in table.strip().splitlines():
        if line.startswith('## '):
            category = line[3:]
        elif '|' in line:
            name, description = line.split('|', 1)
            result.append(item(name, category, description, url, tags, note))
    return result


woodlands = from_table(
    WOODLANDS, WOODLANDS_URL, ['Vegetarian'],
    'Official Orlando PDF food entry. Woodlands identifies its cuisine as vegetarian; this is not a vegan or allergen-free declaration. Menu asks guests to advise servers about food allergies. Full recipe/cross-contact unknown.',
)
assert len(woodlands) == 100


# Bombay's desktop menu uses nested tab panels. Read every food tab before the
# beverage tabs. Some breads/choices share a source line, so retain that wording.
bombay_soup = BeautifulSoup((SNAPSHOTS / 'bombay.html').read_text(encoding='utf-8'), 'html.parser')
BOMBAY_URL = 'https://bombaykitchenorlando.com/menu/'
BOMBAY_TABS = {
    'halka-phulka-tab': 'Halka Phulka', 'asian-tab': 'Asian',
    'tandoor-tab': 'Tandoor', 'dakshin-se-tab': 'Dakshin Se',
    'bigger-plates-tab': 'Bigger Plates', 'vegetarian-curry-tab': 'Vegetarian Curry',
    'bread-tab': 'Bread', 'non-vegetarian-curry-tab': 'Non-Vegetarian Curry',
    'biryani-tab': 'Biryani', 'dessert-tab': 'Dessert',
    'gola-station-tab': 'Gola Station',
}
bombay = []
for tab_id, category in BOMBAY_TABS.items():
    panel = bombay_soup.find(id=tab_id)
    lines = [x.strip() for x in panel.get_text('\n', strip=True).splitlines() if x.strip()]
    lines = [x for x in lines if x != '(SERVED WITH RICE)']
    index = 0
    while index < len(lines):
        name = lines[index]
        description = ''
        index += 1
        # Names in the published menu are uppercase; descriptions are sentences.
        if index < len(lines) and lines[index].upper() != lines[index]:
            description = lines[index]
            index += 1
        if 'curry-tab' in tab_id:
            description += '; served with rice'
        tags = ['Vegetarian'] if tab_id == 'vegetarian-curry-tab' or name == 'HIMALAYAN NOODLE SOUP' else []
        bombay.append(item(name.title(), category, description, BOMBAY_URL, tags))


YELLOW_URL = 'https://yellowdogeats.com/wp-content/uploads/2025/10/YDE_Gotha_Main_Menu_090925.pdf'
YELLOW_HH = 'https://yellowdogeats.com/wp-content/uploads/2025/11/YDE_Gotha_Menu_Happy_Hour_Menu-11-25.pdf'
# Main-menu descriptions below are shortened ingredient summaries. This avoids
# mistaking the PDF's two-column reading order for a single paragraph.
YELLOW = '''
## Craft BBQ & Pulled Pork
House-Smoked Ribs - Half Rack|House-smoked ribs with Fish's Gold BBQ sauce
House-Smoked Ribs - Full Rack|House-smoked ribs with Fish's Gold BBQ sauce
The Dog's Famous Pulled Pork Sandwich|House-smoked pulled pork, fluffy bun, Fish's Gold BBQ sauce; kettle-cooked chips or homemade slaw
Florida Cracker|Pulled pork, coleslaw, gouda, pecan-smoked bacon, spicy pickles, fried onions, Fish's Gold BBQ sauce, thick fluffy bread; chips or slaw
Bleu Suede Shoes|Pulled pork, bleu cheese crumbles, pecan-smoked bacon, scallions, red onions, Fish's Gold BBQ sauce, fluffy bun; chips or slaw
Club Elvis|Pulled pork, pecan-smoked bacon, gouda, crispy fried onions, Fish's Gold BBQ sauce, fluffy bun; chips or slaw
What the Fig?|Pulled pork, fried onions, bacon, goat cheese, jalapeno-fig sauce, fluffy bun; chips or slaw
White Trash|Pulled pork, coleslaw, gouda, pecan-smoked bacon, Fish's Gold BBQ sauce, thick-cut white bread; chips or slaw
Mr. Smokey|Pulled pork, smoked pineapple, fried onions, pecan-smoked bacon, Fish's Gold BBQ sauce, fluffy bun; chips or slaw
The Rufus|Pulled pork, brie, cherry pepper rings, raspberry melba, Fish's Gold BBQ sauce; chips or slaw. Optional bacon, shoestring potatoes and fried onions
## Signature Sandwiches
Pugnacious Pug|Hoagie roll, garlic aioli, house-smoked roast beef, sauteed peppers and onions, swiss cheese; chips or slaw. Optional beer cheese or queso dip
Classic Yellow Dog Club|Honey mesquite roasted turkey, smoked gouda, pecan-smoked bacon, cucumber, lettuce, orange Cointreau mayo, multigrain bread; chips or slaw. Optional pineapple and sprouts
Roast Malone|House-smoked roast beef, pimento cheese, fried onions, tomatoes, caramelized onions, watercress, pressed multigrain bread; chips or slaw
Kitty Kat|Asian-marinated albacore tuna, cranberries, smoked gouda, caramelized onions, tomatoes, lettuce, sunflower sprouts, orange Cointreau mayo, multigrain bread; chips or slaw
Salmon BLT|House-smoked salmon, bacon, tomato, watercress, goat cheese, lemon-caper aioli, multigrain bread; chips or slaw
The Holy Crap|Honey mesquite roasted turkey, avocado, pecan-smoked bacon, goat cheese, red onions, basil mayo, pressed multigrain bread; chips or slaw
Johnny Rocket|Honey mesquite roasted turkey, raspberry melba, cherry pepper rings, tomato, smoked gouda, lettuce, orange Cointreau mayo, multigrain bread; chips or slaw
Twisted Tuna|Asian-marinated albacore tuna, multigrain bread, avocado, red onions, brie, raspberry melba; chips or slaw. Optional bacon
## Queso & Chips
Housemade Queso with Tri-Colored Chips|Housemade queso with tri-colored chips
Queso Flavor Bomb 1|Queso, corn salsa, fried onion, shoestring potatoes, Thai chili and scallions; add-on to queso and chips
Queso Flavor Bomb 2|Queso, black beans, pico de gallo, fried onions, shoestring potatoes, Thai chili and scallions; add-on to queso and chips
Queso Flavor Bomb 3|Queso, pineapple salsa, fried onions, shoestring potatoes, Thai chili and scallions; add-on to queso and chips
## Wraps & Things
Buffalo Soldier|Smoked chicken, cheddar jack, blue cheese, lettuce, tomato, red onion, cucumber, orange Cointreau mayo, jalapeno ranch, buffalo sauce, chipotle wrap
Classic Mexican Mutt|Chipotle wrap, black bean spread, lettuce, tomato, salsa, caramelized onions, cilantro sour cream, Mexican cheese; choice of smoked chicken or seasoned roast beef
Curry Chicken Wrap|Curry chicken salad, field greens, smoked gouda, carrots, sunflower sprouts, orange Cointreau mayo
Fire Pig|Pulled pork, pecan-smoked bacon, gouda, coleslaw, pickles, Sriracha, Fish's Gold BBQ sauce, fried onions, chipotle wrap
El Cubano|Pulled pork, black forest ham, swiss cheese, tomato chutney, onions, jalapenos, creole mustard, spicy pickles, pressed Cuban bread
Cuban Style Black Beans|Black beans, queso, sweet Thai chili, cilantro sour cream, salsa, cherry pepper rings, pickled onions, jalapenos, scallions, Spanish yellow rice; optional chicken, pork, salmon or ahi tuna
## Tacos & Nachos
Pulled Pork Soft Tacos|Three flour tortillas, black bean spread, pulled pork, queso fresco, slaw, scallions, cilantro sour cream; tri-colored chips and salsa
Hokey Poke Tacos|Three flour tortillas, guava cream cheese, sesame napa cabbage bok choy slaw, pineapple cilantro salsa, sprouts, poke tuna, Poke King sauce, Cusabi Ranch; chips and salsa
Pulled Pork Nachos|Tri-colored tortilla chips, pulled pork, black beans, queso fresco, salsa, Thai chili, cherry pepper rings, pickled onions and jalapenos, scallions, cilantro sour cream, Fish's Gold BBQ sauce; optional chicken substitution
Seared Ahi Tuna Nachos|Tri-colored chips, seared ahi tuna, queso fresco, scallions, black beans, pineapple cilantro salsa, Kickin Bayou sauce, Cusabi buttermilk dressing
## Salads
Pulled Pork Salad|Field greens, grape tomatoes, red onions, scallions, carrots, red peppers, sun-dried fruit and nut blend, bleu cheese, fried onions, spicy pickles, cucumber, sprouts, pulled pork, jalapeno ranch, Fish's Gold BBQ sauce
Are You Chicken?|Smoked chicken, field greens, cucumbers, grape tomatoes, carrots, sun-dried fruit and nut blend, sprouts, red onions, red peppers and scallions
Are You Chicken? - Vegan without Chicken|Field greens, cucumbers, grape tomatoes, carrots, sun-dried fruit and nut blend, sprouts, red onions, red peppers and scallions; menu explicitly offers vegan without the chicken
Curry Chicken Salad|Smoked curry chicken salad, toasted coconut, mango chutney, chopped peanuts, field greens, carrots, red peppers, red onions, scallions, cucumbers, grape tomatoes, sun-dried fruit and nut blend
Smokey's Smoked Salmon Salad|Dry-rubbed smoked salmon, field greens, cucumbers, grape tomatoes, carrots, sun-dried fruit and nut blend, sprouts, red peppers, scallions and red onions
## Vegetarian
Jamaican Jerk Kingston Tacos|Three flour tortillas, smoked jerk cauliflower, mango chipotle aioli, pineapple salsa, napa bok choy slaw, Thai chili and fried onions
Sweet Potato Tico Tacos|Roasted sweet potatoes, corn salsa, black beans, chipotle mango aioli, arugucress, fried onions, three flour tortillas; chips and salsa
Pressed Roasted Potato Sandwich|Roasted potatoes, garlic aioli, caramelized onions, swiss cheese, cherry peppers, pressed multigrain bread
## Scooby Snacks
Avocado Hummus|Small or large portion
Mozzarella & Tomato|Small or large portion
Potato Salad|Small or large portion
Homemade Coleslaw|Small or large portion
Oven Roasted Potatoes|Small or large portion
Tomato, Onion, Cucumber Salad|Small or large portion
## For the Pups - Kids Menu
Kids Pulled Pork Sliders|Served with a bag of chips
Kids Cheese Quesadilla|Served with a bag of chips; optional chicken
Kids Grilled Cheese|Served with a bag of chips
Kids Turkey & Cheddar Sandwich|Served with a bag of chips
Kids Pulled Pork Sandwich|Served with a bag of chips
'''
yellow = from_table(YELLOW, YELLOW_URL)
for entry in yellow:
    if entry['category'] == 'Vegetarian':
        entry['tags'] = ['Vegetarian']
    if entry['name'] == 'Are You Chicken? - Vegan without Chicken':
        entry['tags'] = ['Vegetarian', 'Vegan']
        entry['evidenceNote'] = 'The Gotha menu explicitly offers "Vegan without the chicken". Nut blend remains present; this does not establish absence of any allergen.'
    if entry['name'].startswith('Queso Flavor Bomb'):
        entry['kind'] = 'component'
yellow += from_table('''
## Happy Hour Bites
Tika Bites|Four chickpea and kelp bites with masala sauce; Monday-Friday 3-6pm only
Pimento Spread|Housemade pimento dip, toasted bread, spicy pickles, pickled onion and jalapenos; Monday-Friday 3-6pm only
Cheesy Jalapeno Bread|Pull-apart cheese bread with bacon and jalapenos; Monday-Friday 3-6pm only
Mini Nachos|The restaurant's nachos in a smaller portion; Monday-Friday 3-6pm only
Bacon Cheese Burger Dip|Burger-style dip with shredded lettuce, tomatoes and tortilla chips; Monday-Friday 3-6pm only
Slider Trio|Pulled Pork Sandwich, Club Elvis and Mr. Smokey sliders; Monday-Friday 3-6pm only
''', YELLOW_HH)


# Taco Bell's server-rendered category payload contains product identity, photos,
# and the AVA vegetarian flag. Deduplicate by product code across categories.
tb_products = {}
for category in ['tacos', 'burritos', 'specialties', 'vegetarian']:
    soup = BeautifulSoup((SNAPSHOTS / f'tb-{category}.html').read_text(encoding='utf-8'), 'html.parser')
    page = json.loads(soup.select_one('#__NEXT_DATA__').string)['props']['pageProps']
    for product in page['products']:
        old = tb_products.get(product['code'])
        if old:
            old['hasAVA'] = old.get('hasAVA') or product.get('hasAVA')
        else:
            tb_products[product['code']] = copy.deepcopy(product)


# Additional official category cards were reviewed through the web reader after
# direct public HTML requests stopped working. Names, sizes and source category
# are preserved; no custom recipe is supplied for selectable combos.
TB_EXTRA = '''
## Breakfast
Cheesy Toasted Breakfast Burrito Bacon
Cheesy Toasted Breakfast Burrito Potato
Grande Toasted Breakfast Burrito Steak
Grande Toasted Breakfast Burrito Bacon
Breakfast Quesadilla Bacon
Breakfast Quesadilla Steak
Breakfast California Crunchwrap
Breakfast Crunchwrap Bacon
Breakfast Crunchwrap Combo
Hash Brown
Breakfast Salsa
## Quesadillas
Cantina Chicken Rolled Quesadilla
Chicken Quesadilla
Steak Quesadilla
## Nachos
Nachos BellGrande
Chips and Nacho Supreme Dip
## Bowls
Cantina Chicken Bowl
## Snacks & Sweets
Chili
Mild Sauce Packet
Hot Sauce Packet
Fire Sauce Packet
Diablo Sauce Packet
Creamy Sriracha Sauce
Jalapeño Peppers
Nacho Cheese Sauce
Reduced-Fat Sour Cream
Creamy Jalapeño Sauce
Guacamole
Chipotle Sauce
Avocado Ranch Sauce
Spicy Ranch
Red Sauce
Mexican Pizza Sauce
## Cantina Chicken Menu
Avocado Verde Salsa Sauce Packet
## Boxes & Combos
Paris Hilton's Usual
Discovery Luxe Box
Crispy Chicken Nuggets Deluxe Combo
10 Piece Crispy Chicken Nuggets Combo
Build Your Own Luxe Cravings Box
Cantina Chicken Crispy Taco Combo
Cantina Chicken Burrito Combo
Cantina Chicken Rolled Quesadilla Combo
Mexican Pizza Combo
Chicken Quesadilla Combo
2 Chicken Chalupas Supreme Combo
Crunchwrap Supreme Combo
3 Crunchy Tacos Combo
3 Crunchy Tacos Supreme Combo
3 Doritos Locos Tacos Combo
3 Doritos Locos Tacos Supreme Combo
Supreme Luxe Box
Classic Luxe Box
## Groups
Doritos Locos Taco Party Pack
Supreme Doritos Locos Taco Party Pack
Meal for 2
Meal for 4
Taco & Burrito Cravings Pack
Taco Party Pack
Supreme Taco Party Pack
Soft Taco Party Pack
Supreme Soft Taco Party Pack
Variety Taco Party Pack
Supreme Variety Taco Party Pack
'''
TB_CATEGORY_URLS = {
    'Breakfast': 'breakfast', 'Quesadillas': 'quesadillas', 'Nachos': 'nachos',
    'Bowls': 'bowls', 'Snacks & Sweets': 'snacks-sweets',
    'Cantina Chicken Menu': 'cantina-chicken-menu',
    'Boxes & Combos': 'boxes-and-combos', 'Groups': 'party-packs',
}
tb_items = []
for product in tb_products.values():
    category = product.get('primaryCategory', 'Menu').replace('-', ' ').title()
    url = 'https://www.tacobell.com' + product['url']
    record = item(product['name'], category, '', url,
        ['Vegetarian'] if product.get('hasAVA') else [],
        'Official national menu product card. Standard ingredients not fully captured; selectable additions and combo choices vary. National template; not verified live branch stock. AVA vegetarian flag, when present, allows milk/egg and does not remove shared-kitchen cross-contact.',
    )
    images = product.get('images', [])
    if images:
        photo = next((x for x in images if x.get('format') == '750x340'), images[0])
        record.update(imageUrl=photo['url'], imageAlt=product['name'], imageCredit='Taco Bell official menu')
    tb_items.append(record)

seen_names = {slug(x['name'].replace('®', '').replace('™', '')) for x in tb_items}
category = ''
for line in TB_EXTRA.strip().splitlines():
    if line.startswith('## '):
        category = line[3:]
        continue
    normalized = slug(line)
    if normalized in seen_names:
        continue
    seen_names.add(normalized)
    vegetarian_cards = ['Cheesy Toasted Breakfast Burrito Potato', 'Hash Brown', 'Breakfast Salsa', 'Avocado Verde Salsa Sauce Packet', 'Mild Sauce Packet', 'Hot Sauce Packet', 'Fire Sauce Packet', 'Diablo Sauce Packet', 'Nacho Cheese Sauce', 'Reduced-Fat Sour Cream', 'Creamy Jalapeño Sauce', 'Guacamole', 'Chipotle Sauce', 'Avocado Ranch Sauce', 'Spicy Ranch', 'Red Sauce', 'Mexican Pizza Sauce']
    tags = ['Vegetarian'] if line in vegetarian_cards else []
    tb_items.append(item(line, category, '', 'https://www.tacobell.com/food/' + TB_CATEGORY_URLS[category], tags,
        'Official national category product card. Full recipe and customizable combo contents are not captured. Breakfast/limited-time availability and branch participation must be confirmed. Vegetarian marks are from the published category card, not inferred from the name.',
    ))
    if 'Sauce' in line or line in ['Breakfast Salsa', 'Guacamole', 'Jalapeño Peppers', 'Reduced-Fat Sour Cream']:
        tb_items[-1]['kind'] = 'component'


# Ingredient-bearing detail pages were reviewed for useful standard examples.
# The list below is drawn only from their What's Included/description sections.
TB_DETAILS = {
    'Soft Taco': ('A warm flour tortilla filled with seasoned beef, lettuce and shredded cheddar cheese.', ['flour tortilla','seasoned beef','lettuce','cheddar cheese']),
    'Bean Burrito': ('Warm flour tortilla with refried beans, cheddar cheese, diced onions and red sauce.', ['flour tortilla','refried beans','cheddar cheese','onions','red sauce']),
    'Cheese Quesadilla': ('Flour tortilla with three-cheese blend and creamy jalapeno sauce.', ['flour tortilla','three-cheese blend','creamy jalapeno sauce']),
    'Chips and Guacamole': ('Tortilla chips with guacamole.', ['tortilla chips','guacamole']),
    'Black Beans': ('A side of black beans.', ['black beans']),
    'Veggie Bowl': ('Seasoned rice, black beans, lettuce, purple cabbage, pico de gallo, guacamole, avocado ranch, reduced-fat sour cream and cheddar cheese.', ['seasoned rice','black beans','lettuce','purple cabbage','pico de gallo','guacamole','avocado ranch sauce','reduced-fat sour cream','cheddar cheese']),
    'Cantina Chicken Bowl': ('Slow-roasted chicken, seasoned rice, black beans, avocado ranch, reduced-fat sour cream, lettuce, purple cabbage, pico de gallo, guacamole and cheddar cheese.', ['slow-roasted chicken','seasoned rice','black beans','avocado ranch sauce','reduced-fat sour cream','lettuce','purple cabbage','pico de gallo','guacamole','cheddar cheese']),
    'Cantina Chicken Soft Taco': ('Flour tortilla with slow-roasted chicken, avocado ranch, lettuce, purple cabbage, pico de gallo and cheddar cheese; Avocado Verde Salsa accompanies it.', ['flour tortilla','slow-roasted chicken','avocado ranch sauce','lettuce','purple cabbage','pico de gallo','cheddar cheese','Avocado Verde Salsa']),
    'Cantina Chicken Crispy Taco': ('Crispy taco shell with slow-roasted chicken, creamy jalapeno sauce and three-cheese blend, with grilled cheese outside; Avocado Verde Salsa accompanies it.', ['crispy taco shell','slow-roasted chicken','creamy jalapeno sauce','three-cheese blend','grilled cheese','Avocado Verde Salsa']),
}
for entry in tb_items:
    detail = TB_DETAILS.get(entry['name'])
    if detail:
        entry['description'], entry['ingredients'] = detail
        entry['evidenceNote'] += ' Standard ingredient phrases captured from the official product detail or Cantina FAQ. Sub-ingredients and cross-contact remain unknown.'
    entry['allergenUrl'] = 'https://www.tacobell.com/nutrition/allergen-info'


def clean_web_line(line):
    line = re.sub(r'L\d+:\s*', '', line)
    return re.sub(r'\ue200cite\ue202[^†]*†([^\ue201]*)\ue201', r'\1', line).strip()


# Read source phrases from captured product pages. A partial ingredient list is
# still useful evidence, but never raises informationComplete or allergy coverage.
detail_snapshots = sorted(SNAPSHOTS.glob('tb-product-batch-*.txt')) + sorted(SNAPSHOTS.glob('tb-product-*full-*.txt'))
for snapshot in detail_snapshots:
    text = snapshot.read_text(encoding='utf-8')
    for block in re.split(r'-{20,}\n', text):
        first = block.splitlines()[0] if block.splitlines() else ''
        title = first.split(' | Taco Bell')[0]
        title_key = slug(title.replace('®', '').replace('™', ''))
        record = next((x for x in tb_items if slug(x['name'].replace('®', '').replace('™', '')) == title_key), None)
        if not record:
            continue
        source_url = re.search(r'\((https://www\.tacobell\.com/[^)]+)\)', first)
        if source_url:
            record['menuUrl'] = source_url.group(1)
        # The web reader sometimes puts two numbered source lines on one output
        # line. Split by those markers before recognizing headings/components.
        body = '\n'.join(block.splitlines()[2:])
        lines = [clean_web_line(line) for line in re.split(r'L\d+:\s*', body)]
        plain = '\n'.join(lines)
        included = re.search(r"### What's Included\s*\n(.*?)(?:\n###|\Z)", plain, re.S)
        if included:
            phrases = [line.strip() for line in included.group(1).splitlines()
                       if line.strip() and not line.startswith('[') and 'Button:' not in line
                       and not line.startswith('#') and '$' not in line]
            if phrases:
                record['ingredients'] = list(dict.fromkeys(record['ingredients'] + phrases))
                if not record['description']:
                    record['description'] = 'Menu-listed components: ' + ', '.join(phrases) + '.'
                record['evidenceNote'] += ' Positive component phrases from the official What\'s Included section; shell, sauce sub-ingredients and complete recipe remain unknown.'
        heading = '## ' + title
        heading_index = lines.index(heading) if heading in lines else next((i for i, line in enumerate(lines) if line.startswith('## ') and not line.startswith('## Redeem') and line != '## Faqs'), None)
        if heading_index is not None:
            index = heading_index + 1
            detail_lines = []
            while index < len(lines) and not lines[index].startswith('#'):
                if lines[index] and 'American Vegetarian Association' not in lines[index]: detail_lines.append(lines[index])
                index += 1
            if detail_lines:
                description = ' '.join(detail_lines)
                # The restaurant detail text is a more informative source than
                # the short card, without being a certified ingredient list.
                record['description'] = description
                record['ingredients'] = list(dict.fromkeys(record['ingredients'] + [description]))


restaurants = [
    restaurant('woodlands-orlando', woodlands,
        'All 100 numbered food entries in the official six-page Orlando PDF; beverages 101-109 omitted.',
        'Full published PDF food inventory, not a live availability check. No published item allergen matrix. Vegetarian cuisine is explicit, but no dish is declared vegan/gluten-free/allergen-free. PDF HTTPS certificate failed validation; source read at the restaurant public HTTP URL without disabling certificate checks.',
        [WOODLANDS_URL, 'https://www.woodlandsusa.com/images/Orlando.pdf', 'https://www.woodlandsusa.com/contact-us.php']),
    restaurant('bombay-street-kitchen', bombay,
        'All food tabs in the official menu: Halka Phulka, Asian, Tandoor, Dakshin Se, Bigger Plates, Vegetarian Curry, Bread, Non-Vegetarian Curry, Biryani, Dessert and Gola Station. Drinks/alcohol omitted.',
        'Published menu descriptions are not complete recipes or an allergen matrix. Combined source lines and protein choices are retained without invented recipes. Vegetarian Curry is explicitly a vegetarian category; other absence claims are unknown.',
        [BOMBAY_URL, 'https://bombaykitchenorlando.com/contact/']),
    restaurant('yellow-dog-eats-gotha', yellow,
        'Complete published Gotha main food menu, kids menu, sides, queso add-ons and six happy-hour food entries. Small/large sides stay together; rib sizes are distinct. Drinks omitted.',
        'Gotha branch only. Happy-hour bites limited to Monday-Friday 3-6pm. Daily specials and New Smyrna Beach menu are not imported. Published descriptions omit sub-ingredients; sauces, bread and nut blends need restaurant confirmation. Vegetarian section and explicitly vegan chicken-free salad are source labels, not allergy claims.',
        [YELLOW_URL, YELLOW_HH, 'https://yellowdogeats.com/lunch-dinner-menu/', 'https://yellowdogeats.com/contact/']),
]
for meta in METADATA:
    if meta.get('chainId') == 'taco-bell':
        restaurants.append(restaurant(meta['key'], copy.deepcopy(tb_items),
            'National published food catalog across tacos, burritos, specialties, vegetarian, breakfast, quesadillas, nachos, bowls, snacks, Cantina, boxes/combos and groups. Product cards deduplicated. Drinks omitted.',
            'This is a shared national template associated with a verified real branch, not a restaurant-confirmed branch inventory. Breakfast, limited-time promotions, prices and participation vary. Allergen-info page is dynamic; no complete allergen matrix or absence claims were transcribed. AVA vegetarian items may include dairy/egg and shared-fryer cross-contact. Customizable combos have unknown full contents.',
            ['https://www.tacobell.com/food', 'https://www.tacobell.com/food/tacos', 'https://www.tacobell.com/food/burritos', 'https://www.tacobell.com/food/specialties', 'https://www.tacobell.com/food/vegetarian'] + ['https://www.tacobell.com/food/' + x for x in TB_CATEGORY_URLS.values()] + ['https://www.tacobell.com/nutrition/allergen-info', meta['websiteUrl']]))

for place in restaurants:
    keys = [x['key'] for x in place['items']]
    assert len(keys) == len(set(keys)), (place['key'], 'duplicate item keys')
    assert all(not x['freeFromAllergens'] and not x['coverage'] for x in place['items'])
assert {x['key'] for x in restaurants} == {x['key'] for x in METADATA}
result = {'reviewedAt': REVIEWED, 'scope': 'Requested Orlando-area additions and three verified Taco Bell branches; published food inventories with unknown allergen absence retained.', 'restaurants': restaurants}
(ROOT / 'requested-menu-data.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print({x['key']: len(x['items']) for x in restaurants})
