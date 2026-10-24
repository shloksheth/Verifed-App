const url="https://www.orlandoweekly.com/food-drink/brace-yourself-winter-park-biscuit-co-slated-to-open-thanksgiving-week-inside-east-end-market-28271078/";
const r=await fetch(url,{headers:{"user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"},signal:AbortSignal.timeout(20000)});
const s=await r.text();console.log("SOURCE",r.status,s.length,r.url);
for(const word of ["Impossible Burger","Impossible","vegan American cheese","Fried Chik Sandwich","wpbc","imager"]){
const matches=[...s.matchAll(new RegExp(word,"gi"))].slice(0,6);for(const m of matches){let area=s.slice(Math.max(0,m.index-900),Math.min(s.length,m.index+800));console.log("MATCH",word,m.index,area.replace(/\\n/g," ").slice(0,1400))}
}
