import { publishedMenus } from "../mobile/src/restaurant-menus.js";
const menu=publishedMenus.find(m=>m.key==="taco-bell-south-orange");
const candidates=menu.items.filter(d=>!d.imageUrl).map(d=>d);
const categories=["breakfast","nachos","tacos","burritos","quesadillas","specialties","deals-and-combos","combos","groups","snacks-sweets","party-packs","sides-and-sweets","drinks","bowls","veggie-cravings","online-exclusives","cantina-chicken-menu","luxe-value-menu","featured","best-sellers"];
const seen=new Map();
const entities=s=>s.replace(/&amp;/g,"&").replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&reg;|®/g,"").replace(/&trade;|™/g,"").replace(/\s+/g," ").trim().toLowerCase();
for(const cat of categories){
 const url="https://www.tacobell.com/food/"+cat;
 try{
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 Chrome/130.0.0.0"},signal:AbortSignal.timeout(13000)});
  const h=await r.text();let c=0;
  for(const m of h.matchAll(/<img\s+[^>]*?alt="([^"]+)"[^>]*?src="(https:\/\/www\.tacobell\.com\/images\/[^"]+)"[^>]*?>/g)){
   const name=entities(m[1]),src=m[2];
   for(const item of candidates){const label=entities(item.name);
    if(name===label && !seen.has(item.key)){seen.set(item.key,{name:item.name,key:item.key,url:src,category:cat});c++;}
   }
  }
  console.log("CATEGORY",cat,r.status,c);
 }catch(e){console.log("ERROR",cat,String(e))}
}
for(const data of seen.values())console.log("MATCH",JSON.stringify(data));
console.log("SUMMARY",JSON.stringify({matched:seen.size,of:candidates.length}));
