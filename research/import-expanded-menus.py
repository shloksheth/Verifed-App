import json, re, unicodedata
from pathlib import Path
from bs4 import BeautifulSoup

ROOT=Path.cwd(); P=ROOT/'research/menu-sources'
meta=json.loads((ROOT/'research/expanded-restaurants.json').read_text(encoding='utf-8'))
bykey={x['key']:x for x in meta}; menus={}

def clean(x):
    return re.sub(r'\s+',' ',x or '').strip()
def slug(x):
    x=unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().lower()
    return re.sub('[^a-z0-9]+','-',x).strip('-')
def menu(key,coverage,urls=None,caveat=None):
    m=bykey[key]
    menus[key]=dict(key=key,name=m['name'],menuUrl=m['menuUrl'],allergenUrl=None,scope='location',menuCoverage=coverage,availabilityVerified=False,allergenCoverage=[],sourceCaveats=caveat or 'Published descriptions name some ingredients, not all ingredients or allergens. No absence is inferred from an omitted ingredient. Recipes, substitutions and preparation can change; ask staff about cross-contact.',sourceUrls=urls or [m['menuUrl']],items=[])
    return menus[key]

def item(key,name,category,desc='',tags=None,url=None,kind='dish',allergens=None):
    m=menus[key]; name=clean(name).strip('* ');desc=clean(desc)
    if not name:return
    # Identical dishes repeated as promoted items are one record. Meal-specific
    # recipes with different descriptions keep distinct category keys.
    if any(x['name']==name and x['description']==desc for x in m['items']):return
    ident=slug(name); used={x['key'] for x in m['items']}
    if ident in used:ident=slug(category)+'-'+ident
    original=ident;n=2
    while ident in used:ident=original+'-'+str(n);n+=1
    claims=tags or []
    m['items'].append(dict(key=ident,name=name,category=clean(category).title(),kind=kind,description=desc,ingredients=[clean(s) for s in re.split(r',| / ',desc) if clean(s)] if desc else [],allergens=allergens or [],freeFromAllergens=[],freeFromClaims=[],tags=list(dict.fromkeys(claims)),coverage=[],evidenceNote='Official published menu: item title and description'+('; explicit dietary label(s): '+', '.join(claims) if claims else '')+'. Description is not a complete ingredient/allergen list.',menuUrl=url or m['menuUrl'],allergenUrl=None,reviewedAt='2026-10-21',informationComplete=False))

def wix(k,key,label='',url=None,exclude=()):
    s=BeautifulSoup((P/(k+'.html')).read_text(encoding='utf-8'),'html.parser')
    for node in s.select('[data-hook="item.name"]'):
        sec=node.find_parent(attrs={'data-hook':'section.container'})
        heading=sec.select_one('[data-hook="section.name"]') if sec else None
        category=clean(heading.get_text(' ',strip=True)) if heading else 'Menu'
        if any(word.lower() in category.lower() for word in exclude):continue
        root=node.find_parent(attrs={'data-hook':'item.root'}) or node.find_parent(attrs={'data-hook':'item.container'})
        d=root.select_one('[data-hook="item.description"]') if root else None
        tags=[]
        for v in root.select('[data-hook="item.label"]') if root else []:
            values=' '.join([v.get_text(' ',strip=True)]+[im.get('alt','') for im in v.select('img')]).lower()
            if 'gluten free' in values:tags.append('Gluten-free')
            if 'vegan' in values:tags.append('Vegan')
            elif 'vegetarian' in values:tags.append('Vegetarian')
        item(key,node.get_text(' ',strip=True),label+' · '+category if label else category,d.get_text(' ',strip=True) if d else '',tags,url)

menu('the-monroe','All published food entries from the dinner, lunch, breakfast, brunch and happy-hour pages. Identical duplicate listings are collapsed; different meal-period recipes remain separate. Drinks and private-event catering are excluded. These pages do not establish live stock.',[
'https://www.themonroeorlando.com/copy-of-menus','https://www.themonroeorlando.com/copy-of-dinner-menu','https://www.themonroeorlando.com/copy-of-lunch-menu-2','https://www.themonroeorlando.com/copy-of-lunch-menu-1','https://www.themonroeorlando.com/copy-of-lunch-menu'])
for k,label,url in [('monroe','Dinner',menus['the-monroe']['sourceUrls'][0]),('monroe-lunch','Lunch',menus['the-monroe']['sourceUrls'][1]),('monroe-breakfast','Breakfast',menus['the-monroe']['sourceUrls'][2]),('monroe-brunch','Brunch',menus['the-monroe']['sourceUrls'][3]),('monroe-hh','Happy hour',menus['the-monroe']['sourceUrls'][4])]:
    wix(k,'the-monroe',label,url,('cocktail','wine','beer','coffee','tea','beverage','libation','cans'))
menu('the-osprey','All published food entries from the dinner and happy-hour pages, including seasonal dishes and desserts. Identical repeated entries are collapsed. Drinks and chef-selected/private-event tasting menus are excluded. Availability is not independently verified.', ['https://www.theospreyorlando.com/copy-of-menu','https://www.theospreyorlando.com/copy-of-dinner-menu'])
wix('osprey','the-osprey','Dinner',menus['the-osprey']['sourceUrls'][0])
wix('osprey-hh','the-osprey','Happy hour',menus['the-osprey']['sourceUrls'][1],('cocktail','wine','beer','seltzer'))
menu('seito-baldwin-park','All published food entries from dinner, lunch and happy-hour pages. Configurable set meals remain a single choice-based entry. Identical duplicate listings are collapsed; different meal-period recipes stay separate. Drinks, catering and unnamed chef-selected fish are excluded.', ['https://www.seitosushibp.com/copy-of-lunch-menu','https://www.seitosushibp.com/copy-of-menus','https://www.seitosushibp.com/copy-of-dinner-menu'])
wix('seito','seito-baldwin-park','Dinner',menus['seito-baldwin-park']['sourceUrls'][0])
wix('seito-lunch','seito-baldwin-park','Lunch',menus['seito-baldwin-park']['sourceUrls'][1])
wix('seito-hh','seito-baldwin-park','Happy hour',menus['seito-baldwin-park']['sourceUrls'][2],('cocktail','wine','beer','sake','seltzer'))
menu('reyes-mezcaleria','All published food entries from the dinner and happy-hour pages. Configurable additions stay in the description, rather than inventing a recipe for every variation. Drinks and catering are excluded.', ['https://www.reyesmex.com/copy-of-happy-hour-menu','https://www.reyesmex.com/copy-of-menu'])
wix('reyes','reyes-mezcaleria','Dinner',menus['reyes-mezcaleria']['sourceUrls'][0])
wix('reyes-hh','reyes-mezcaleria','Happy hour',menus['reyes-mezcaleria']['sourceUrls'][1],('cocktail','wine','beer','tequila','mezcal','margarita','from the bar'))
menu('sparrow-orlando','All food entries on the dinner page, including late-night and desserts, plus aperitivo-hour tapas. Drinks and the separately booked Saturday afternoon-tea event are excluded. Identical repeated food listings are collapsed.', ['https://www.sparroworlando.com/menu-3','https://www.sparroworlando.com/menu-3-1'])
wix('sparrow','sparrow-orlando','Dinner',menus['sparrow-orlando']['sourceUrls'][0])
wix('sparrow-hh','sparrow-orlando','Aperitivo',menus['sparrow-orlando']['sourceUrls'][1],('cocktail','wine','beer'))

# Black Rooster's location menu uses semantic headings rather than Wix items.
menu('black-rooster-mills','Every food listing on the official Mills menu page: starters, salads, pozole, tacos, sides and desserts. Optional salad proteins are included as components. Drinks, catering and unlisted specials are excluded.')
s=BeautifulSoup((P/'black.html').read_text(encoding='utf-8'),'html.parser');category='Menu'
for n in s.find_all(['h3','h4']):
    t=clean(n.get_text(' ',strip=True))
    if n.name=='h3':category=t;continue
    if not t or t=='Join Our Team!':continue
    desc=[]
    for sib in n.next_elements:
        if getattr(sib,'name',None) in ['h3','h4']:break
        if getattr(sib,'name',None) != 'p':continue
        st=clean(sib.get_text(' ',strip=True))
        if st and not re.fullmatch(r'\$?\d+[.]?\d*',st) and not st.startswith('*Menu is subject'):desc.append(st)
    if t=='Add Protein to Your Greens':
        for protein in ['Achiote Pork','Chicken Tinga','Beef','Crispy Fish','Shrimp']:item('black-rooster-mills',protein+' · Salad add-on','Salad add-ons','Optional protein for salads; the complete salad needs separate review.',kind='component')
    else:item('black-rooster-mills',t,category,' '.join(desc),['Vegetarian'] if t=='Vegetarian Black Beans' else [])

# The current Pig Floyd's homepage embeds the actual R5 menu as a data literal.
# Read that literal only; never execute downloaded page JavaScript.
menu('pig-floyds-mills','Every food entry in the current merged Pig Floyd’s & Pigzza R5 homepage menu: starters, tacos, sandwiches, wraps, salads, pizza, pasta, smokehouse platters, sides and desserts. Drinks, modifiers and catering quantities are excluded. The previous 1326 N Mills location and old /menu page are not used.')
s=BeautifulSoup((P/'pig.html').read_text(encoding='utf-8'),'html.parser');script=next(x.get_text() for x in s.find_all('script') if 'var MENU=' in x.get_text())
literal=re.search(r'var MENU=(\[.*?\]);',script,re.S).group(1)
literal=re.sub(r'([{,])([A-Za-z][A-Za-z0-9]*):',r'\1"\2":',literal)
for sec in json.loads(literal):
    if sec['id'] in ['cocktails','beer','wine']:continue
    for row in sec['items']:
        tags=['Vegetarian'] if 'Vegetarian' in row.get('tags',[]) else []
        d=row.get('ds','')
        if sec.get('sub'):d+=' '+sec['sub']+'.'
        if sec.get('note'):d+=' '+sec['note']
        item('pig-floyds-mills',row['nm'],sec['title'],d,tags)

# Restaurant-run ordering pages are read from the web reader's visible menu.
# Keep category boundaries and strip only duplicate promotions and non-food.
def tokens(k):
    t=(P/(k+'.web')).read_text(encoding='utf-8')
    for m in re.finditer(r'#{2,3} ([^\n]+)|cite\d+†([^†]*\$[^†]*)(?:†[^]*)?',t):
        if m.group(1):yield 'category',re.sub(r'L\d+:.*','',m.group(1)).strip()
        else:yield 'item',re.sub(r'\$\d.*','',m.group(2)).strip(' *')

name_lists={
'mule':'''Summer Caprese|Edamame|Korean BBQ Ribs|Soft Pretzel Rolls|Sticky Pork Belly|Wing-It|Salmon Cakes(2)|Elote Hummus|Cajun Shrimp Dip|Soup of the Day|Side House Salad|The Coop|Tuscan Shrimp Caesar|TSM Burger Salad|Salmon Salad|Large House Salad|BBQ Pork Flatbread|Hot Honey Apple|Garlic Shrimp Flatbread|Pesto Chicken Flatbread|Stubborn Mule Burger|Smash Burger|Plain Burger|Giddy Up|What Came First|Chipotle Cheesesteak|Cuban Press|Mission Impossible Burger|Fresh Catch BLT|Taco 'Bout It|Chicken Salad Sandwich|Shrimp and Grits|Let There Be Cake|Along Came Molly|Get Shorty|Rigatoni Rusteako|Hanger Steak|Salmon Tortellini|Hot Honey Chicken|Lunch Feature|Dinner Feature|1 Scoop of Ice Cream|Kids Plain Smash Burger|Kids Cheese Smash Burger|Kids Chicken Tenders|Kids Grilled Cheese|Kids Grilled Chicken|Kids Cheese Flatbread|Kids Cavatappi'''.split('|'),
'pizza':'''TAKE OUT Garlic Knots + Sauce|Meatballs + Lemon Ricotta|Octopus|6 Wings|12 Wings|CHOPPED SALAD|KALE SALAD|Tomato Salad|SPAGHETTI CACIO E PEPE|RIGATONI VODKA|Blanca (V)|Classic Original (V)|Margherita (V)|Marinara (Vg)|White 'Za (V)|Kids Cheese|BIG RIG|Crimson Ghost|Kbar|Lover Boy Blue|Ninety Two|Roni|The 5-0|Tight Socks|Viva Verde (VG)|NYC CHEESE|NYC PEPPERONI|NYC WHITE PIE|Classic Cannoli|Nutella Cannoli|Tiramisu TOGO'''.split('|'),
'biscuit':'''Crispy Chik Sandwich|Death Valley Chik Sandwich|WPBC Burger|Buffalo Chik Sub|Chopped Cheese|Chickpea Salad Sandwich|WPBC Box|Buffalo Bleu Strips|Kale Caesar Salad|Loaded Fries|Nugget Combo|The OG|The SEC|Biscuits & Gravy|French Fries|Side Kale Salad|Chik Strips|6 Piece Nuggets|Side Of Bac’n|Spicy Gator|Ice Cream Sandwich|Pumpkin Spice Roll'''.split('|'),
'mamak':'''Lettuce Wrap w/ Bulgogi Chicken|Lettuce Wrap w/ Bulgogi Beef|Lettuce Wrap w/ Roast Duck|Lettuce Wrap w/ Roast Pork|Lettuce Wrap w/ Satay Beef|Lettuce Wrap w/ Tofu|Lettuce Wrap w/ Chicken|Malaysian Coconut Kari w/ chicken + potatoes|Malaysian Coconut Kari w/ tofu + veggies|Malaysian Coconut Kari w/ shrimp + veggies|Wonton with Hot Sauce|Satay Skewers (3)|Satay Skewers (6)|Bulgogi Skewers (3)|Bulgogi Skewers (6)|Mamak Wings (5)|Mamak Wings (10)|Extra side dipping sauce|Extra side of Kari Broth|Extra side of Tom Yum Broth|Extra side of Chicken Broth'''.split('|')}

def split_name(k,st,category):
    st=st.replace('OUT OF STOCK','').strip()
    for nm in sorted(name_lists.get(k,[]),key=len,reverse=True):
        if st.startswith(nm):return nm,st[len(nm):].strip(' *')
    if k=='tin':
        if st.startswith('Trio.'):return 'Trio',st[5:]
        if st.startswith('Extra Sauce..'):return 'Extra Sauce',st[len('Extra Sauce..'):]
        if st.startswith('Two Tacos'):return 'Two Tacos',st[len('Two Tacos'):]
        if st.startswith('Three Tacos'):return 'Three Tacos',st[len('Three Tacos'):]
        cut=re.search(r'\b(Tacos|Taco|Burrito|Rice Bowl|Salad|In-The-Bag|Nachos) (?=[A-Z]{3})',st)
        if cut:return st[:cut.end()].strip(),st[cut.end():].strip()
        return st.rstrip('.'),' '
    if k=='lazy':
        if '(Includes Mozzarella)' in st:
            pos=st.index('(Includes Mozzarella)')+len('(Includes Mozzarella)');return st[:pos],st[pos:]
        if st.startswith('Gluten Free Pizza (contains egg & dairy)'):
            pos=len('Gluten Free Pizza (contains egg & dairy)');return st[:pos],st[pos:]
        if category.startswith('Lazy Faves'):
            for tail in [' Pizza',' Slice',' Lazy Fave']:
                if tail in st:
                    pos=st.index(tail)+len(tail);return st[:pos],st[pos:]
        for nm in ['Large Smoked Chickpea', 'Small Smoked Chickpea', 'Slice - French Onion - LTO','20 inch - French Onion - LTO','Large Goats in Verona (Goats 2.0)','Small Goats in Verona (Goats 2.0)','Side of Ranch & Jason\'s Mom Mix','Side Lazy Hot Honey - 1.5 oz','Cookies & Cream Dessert Pizza','Wings - Plain No Toss','Wings - Buffalo Toss','Wings - Hot Honey Mustard Toss','24 WINGS','Blondie Bites','Blondie']:
            if st.startswith(nm):return nm,st[len(nm):].strip()
        cut=re.search(r'(?<= Calzone) |(?<= Bread) |(?<= Soup) |(?<= Chili) |(?<= Salad) |(?<= Wrap) |(?<= Pesto - 1.5 oz) ',st)
        if cut:return st[:cut.start()],st[cut.end():]
        if category=='Side Dippers':
            cut=re.search(r' (Made|The balance|As good|Our own|A sweet|Local bees|Oregano,|Smoked in|Guajillo|European)',st)
            if cut:return st[:cut.start()],st[cut.start():].strip()
        return st,''
    cut=re.search(r'(?<=[A-Za-z)])\s+(?=[a-z])|\((?=\d+\))',st)
    if cut:
        pos=cut.start()
        if st[pos]=='(':pos=st.index(')',pos)+1
        return st[:pos],st[pos:].strip()
    return st,''

coverage='Every published food listing in the restaurant-run ordering menu, with category and original description where supplied. Duplicate featured items are collapsed. Drinks, alcohol, retail goods, catering packages and optional customization trees are excluded. Listed out-of-stock food remains a menu entry; live availability and recipes must be checked with the restaurant.'
mapping={'lazy':'lazy-moon-mills','tin':'tin-taco-downtown','pizza':'pizza-bruno-curry','mamak':'mamak-colonial','mule':'stubborn-mule','biscuit':'winter-park-biscuit'}
allowed={
'lazy':['Build Your Own Slice','Build Your Own 20"','Special Featured Menu','Lazy Faves Slice','Lazy Faves 20"','Calzones','Gluten Free','Cheesy Bread','Soup','Salad','Wraps','Wings','24 Wings - Package','Side Dippers','8oz Dippers & Dressings','Desserts','Dough Balls'],
'tin':['Tacos','Burritos','Rice Bowl','Mixed Green Salad','In-The-Bag','Nachos','Sides & Add-Ons','Kids'],
'pizza':['SNACKS & STUFF','GREENS & GARDEN','PASTA',"CLASSIC 'ZA","HOUSE SPECIALTY 'ZA",'NYC 16" \'ZA','DESSERTS','SIDES OF SAUCE'],
'mamak':['Tapas','Noodles','Noodle Soup','Charcoal Grill','Wok Rice','Sides'],
'mule':['Starters','Salad/Soup','Flatbreads','Sandwiches & Burgers','Entrées','Sides','Daily Specials','Desserts','Kids Menu','Sauces & Dressings'],
'biscuit':['SANDWICHES','SPECIALTIES','BISCUITS','SIDES','SAUCES','DESSERT']}
for k,key in mapping.items():
    menu(key,coverage);cat=''
    for typ,st in tokens(k):
        if typ=='category':cat=st;continue
        if cat not in allowed[k]:continue
        if k=='lazy' and st.startswith('Catering '):continue
        nm,desc=split_name(k,st,cat);tags=[];al=[]
        if k=='biscuit':tags=['Vegan']
        if k=='pizza':
            if '(VG)' in nm or '(Vg)' in nm:tags=['Vegan']
            elif '(V)' in nm:tags=['Vegetarian']
        if k=='lazy':
            if nm.startswith('Gluten Free Pizza'):tags=['Gluten-free'];al=['Egg','Milk']
            if nm=='Vegan Chili':tags=['Vegan']
        if '*vegetarian' in desc.lower() and 'cannot be' not in desc.lower():tags.append('Vegetarian')
        if '*contains tree nuts*' in desc.lower():al.append('Tree nuts')
        item(key,nm,cat,desc,tags,kind='component' if 'Sauce' in cat or 'Dipper' in cat else 'dish',allergens=al)

# Loving Hut's location page lists each dish title separately from ingredients.
menu('loving-hut-orlando','Every published food entry from the Orlando location page: starters, salads, soups, burgers, noodles, rice dishes, sides and desserts. Smoothies and other drinks are excluded. Vegan is the restaurant’s declared cuisine, not an allergen-free certification.')
s=BeautifulSoup((P/'loving.html').read_text(encoding='utf-8'),'html.parser')
allowed_loving=['STARTERS','SALADS','SOUPS','BURGERS','NOODLES','RICE DISHES','SIDES','DESSERTS']
for node in s.select('.lh_item_title'):
    heading=node.find_previous('h3')
    category=clean(heading.get_text(' ',strip=True)) if heading else ''
    if category not in allowed_loving:continue
    title=node.find('span',recursive=False)
    name=clean(title.get_text(' ',strip=True))
    root=node.find_parent('li')
    description=root.select_one('.lh_item_desc')
    desc=clean(description.get_text(' ',strip=True)) if description else ''
    tags=['Vegan']; al=[]
    if title.select_one('.icon-gluten-free'):tags.append('Gluten-free')
    if 'Contains:' in desc:
        contains=desc.split('Contains:')[-1].lower()
        if 'soy' in contains:al.append('Soy')
        if 'peanut' in contains:al.append('Peanuts')
    item('loving-hut-orlando',name,category,desc,tags,allergens=al)
    if title.select_one('.soy-free'):
        menus['loving-hut-orlando']['items'][-1]['freeFromAllergens']=['Soy']
        menus['loving-hut-orlando']['items'][-1]['freeFromClaims']=['Soy-free symbol on official menu; options-only symbol is excluded.']
        menus['loving-hut-orlando']['items'][-1]['evidenceNote']+=' Official soy-free symbol, not soy-free-option symbol.'

# Tako's official current menu has duplicate arepa links; collapse identical food.
menu('tako-cheena-mills','Every food listing on the official current online menu: signature tacos, taco packs, burritos, arepas, sides and sauces. Duplicate arepa listings are collapsed. Drinks are excluded. The live page no longer lists the hot-dog and dessert sections seen in older search snapshots.')
t=(P/'tako.web').read_text(encoding='utf-8');cat=''
tako_names=['Thai Peanut Chicken TaKo','Korean Beef TaKo',"Mary's Greek Little Lamb TaKo",'Pernil Asado TaKo','Indian Yellow Curry Dusted Chicken TaKo','Asian Braised Brisket','Tom Yum Mojo Shrimp TaKo','3 Pak of TaKos','2 Pak of TaKos','Korean Burrito','Thai Panang Burrito','“La Reina” Loaded Arepa','Arepa','Yuca Fries','Sweet Plantains','K-Town Cheese Spuds','Angry Spuds','Ginger Guava Salsa & Chips','Avocado-Wasabi Cream','Ginger Guava Salsa']
for typ,st in tokens('tako'):
    if typ=='category':cat=st;continue
    if cat not in ['Signature TaKos','Pak of TaKos','Burritos','Tako on the Green','Side Kicks','House Made Sauces & Salsa']:continue
    nm=next((n for n in sorted(tako_names,key=len,reverse=True) if st.startswith(n)),None)
    if nm:item('tako-cheena-mills',nm,cat,st[len(nm):].strip(),[])

# The Strand's published PDFs are one-column food menus. Keep recipes verbatim
# as source facts, and keep the explicit unlisted-ingredients warning.
menu('the-strand-mills','Every dish on the official current dinner PDF plus all three desserts on its dessert PDF. Coffee and cocktails are excluded. The restaurant explicitly warns that ingredients may be unlisted, declines substitutions and does not guarantee daily availability.', ['https://www.strandorlando.com/_files/ugd/53512c_c26bd000ad9b4d879b7685417cacb70f.pdf','https://www.strandorlando.com/_files/ugd/53512c_913f78064dd24ac398ef95a6fd3e25a8.pdf'])
t=(P/'strand-dinner.txt').read_text(encoding='utf-8').split('We are a chef-driven')[0]
t=t.replace('dressing contains raw egg','Dressing contains raw egg.').replace('we cannot guarantee preparation of medium-well or above','')
for m in re.finditer(r'(?m)^([a-z][a-z &-]+?)\s*/\s*(.*?)(?=\n[a-z][a-z &-]+?\s*/|\Z)',t,re.S):
    name=m.group(1).strip().title();d=clean(m.group(2));d=re.sub(r'\s+\*?\s*\d+(?:\.\d+)?(?:\s|$)',' ',d)
    item('the-strand-mills',name,'Dinner',d,url=menus['the-strand-mills']['sourceUrls'][0])
desserts=[('Eton Mess','Meringue, fresh berries, cream custard, coulis.'),('Pound Cake','Mascarpone whipped cream, citrus, rosemary.'),('Budino','Chocolate, hazelnut, maldon.')]
for nm,d in desserts:item('the-strand-mills',nm,'Desserts',d,url=menus['the-strand-mills']['sourceUrls'][1])

# Osteria's dinner page has a freeform design: its PDF/visible headings are
# normalized explicitly, avoiding guessed heading/description pairings.
menu('osteria-ester','Every food entry on the official dinner page and Sunday brunch page, including desserts and sides. Drinks, group dining and optional additions are excluded. Dinner recipes are read from the designed official menu; brunch uses the structured menu.', ['https://www.osteriaester.com/menu','https://www.osteriaester.com/menu-2-1'])
osteria={
'Bread':[('Focaccia','Garlic confit, rosemary, sea salt.'),('Crostini','Apple, ricotta, honey, capicola picante.'),('Pizzette','Lardo, pesto, pecorino, arugula.'),('Gnocco Fritto','Italian fry bread, prosciutto, parmesan fonduta.')],
'Antipasti':[('Carpaccio Piemontese','Wagyu top sirloin, hazelnut aioli, arugula, pickled shallot, crispy caper.'),('Baked Clams','Oreganata, pepperoni, meyer lemon.'),('Pesce Crudo','Olive, orange, mint.'),('Crispy Polenta','Mozzarella, pomodoro, parmesan, basil.'),('The Classic Caesar','Baby gem lettuce, roasted garlic lemon vinaigrette, parmesan, focaccia crouton.'),('Ester Salad','Chopped romaine hearts, salami, rosemary almonds, provolone, wishbone vinaigrette.'),('Burrata','Heirloom tomato, aged balsamic.')],
'Primi / Macaroni':[('Pappardelle Bolognese','Bolo vecchia scuola, red wine, parmesan.'),('Paccheri Alla Vodka','Double cream, basil, chile flake.'),('Braised Beef Tortelloni','Boardwalk tomato, brown butter, sage.'),('Bucatini Diavolo','Shrimp, scallion, garlic oil.'),('Spaghetti Alle Vongole','Clams, white wine, parsley, pangrattato.'),('Gnocchi Sardo','Truffle cream, roasted mushroom.'),('Lasagna Rotolo','Whipped ricotta, crispy sage, all day ragu.')],
'Secondi':[('Sea Bream','Eggplant caponata, olive, caper.'),('Wagyu Top Sirloin','Waxman potato, balsamic onion, salmoriglio.'),('Chicken Alla Parmigiana','Mozzarella, pomodoro, parmesan, basil; chicken option.'),('Veal Alla Parmigiana','Mozzarella, pomodoro, parmesan, basil; veal option.'),('Roasted Half Chicken','Romesco, glazed carrot, sungold tomato.'),('Bistecca Alla Fiorentina','Porcini crust, oregano salt, charred lemon.')],
'Contorni':[('Meatballs',''),('Broccoli Rabe',''),('Waxman Potatoes',''),('Roasted Mushrooms','')],
'Desserts':[('Tiramisu',''),('Butterscotch Budino','Hazelnut, whipped cream.'),('Italian Cookies',''),('Cannoli',''),('Affogato',''),('Gelato','Single or trio.')]
}
for cat,rows in osteria.items():
    for nm,d in rows:item('osteria-ester',nm,'Dinner · '+cat,d)
wix('osteria-brunch','osteria-ester','Brunch',menus['osteria-ester']['sourceUrls'][1])

assert len(menus)==17, len(menus)
for key,m in menus.items():
    assert m['items'],key
    assert len({x['key'] for x in m['items']})==len(m['items']),key
data={'reviewedAt':'2026-10-21','scope':'Official published food menus for 17 additional Orlando restaurants. No live stock or restaurant affiliation is claimed.','restaurants':[menus[r['key']] for r in meta]}
(ROOT/'research/expanded-menu-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print([(k,len(v['items'])) for k,v in menus.items()]);print('Total',sum(len(v['items']) for v in menus.values()))
