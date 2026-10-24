// Temporary discovery aid. Read-only: tests first-party menu pages for exact
// item/image associations; no catalog modifications and no images invented.
const urls={
  tacoBreakfast:"https://www.tacobell.com/food/breakfast",
  tacoCombos:"https://www.tacobell.com/food/combos",
  tacoGroups:"https://www.tacobell.com/food/groups",
  tacoNachos:"https://www.tacobell.com/food/nachos",
  tacoSides:"https://www.tacobell.com/food/sides",
  tacoSauces:"https://www.tacobell.com/food/sauces",
  hawkers:"https://eathawkers.com/menus/dining/",
  lovinghut:"https://lovinghut.us/orlando/",
};
const needles={
  tacoBreakfast:["Cheesy Toasted Breakfast Burrito Bacon","Breakfast Salsa","Hash Brown","Breakfast Crunchwrap Combo"],
  tacoCombos:["Chicken Quesadilla Combo","Discovery Luxe Box","Classic Luxe Box","Cantina Chicken Rolled Quesadilla Combo"],
  tacoGroups:["Taco Party Pack","Meal for 2","Meal for 4","Variety Taco Party Pack"],
  tacoNachos:["Nachos BellGrande","Nacho Supreme Dip"],
  tacoSides:["Nacho Cheese Sauce","Avocado Ranch Sauce","Creamy Jalapeño Sauce"],
  tacoSauces:["Diablo Sauce Packet","Mild Sauce Packet","Fire Sauce Packet"],
  hawkers:["Curry","Lo Mein","Thai Fried Egg"],
  lovinghut:["Small Cabbage Salad","White Rice","Steamed Vegetables","French Fries"]
};
for (const [site,url] of Object.entries(urls)) {
 try {
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36","Accept":"text/html"},signal:AbortSignal.timeout(14000)});
  const html=await r.text();
  console.log("SITE",site,r.status,html.length,r.url);
  for (const needle of needles[site]){
    let i=html.toLowerCase().indexOf(needle.toLowerCase());
    console.log("ITEM",site,needle,i);
    if(i<0)continue;
    const snippet=html.slice(Math.max(0,i-900),Math.min(html.length,i+900));
    console.log("NEAR",site,needle,JSON.stringify(snippet.slice(0,1250)));
  }
  const matches=[...html.matchAll(/(?:https?:)?(?:\\\/|\/){0,2}[^"' <>\s\\]{0,250}?\.(?:png|webp|jpg|jpeg)(?:\?[^"'<>\s\\]{0,100})?/gi)].map(m=>m[0].replaceAll("\\/","/"));
  console.log("IMAGES",site,JSON.stringify([...new Set(matches)].slice(0,50)));
  if(site==="tacoBreakfast"){
    console.log("TACO_HEAD",JSON.stringify(html.slice(0,1300)));
  }
 }catch(e){console.log("ERROR",site,String(e))}
}
