const urls = {
  black_rooster_uber: "https://www.ubereats.com/store/black-rooster-taqueria-orlando/nwstURuoRneJgZyzvkB58g",
  black_rooster_toast: "https://www.toasttab.com/local/order/black-rooster-taqueria-mills-1323-n-mills-ave",
  fresh_kitchen: "https://www.eatfreshkitchen.com/menu",
  chipotle: "https://www.chipotle.com/order/build/burrito-bowl"
};
const needles = [
  "Ahi Tuna Ceviche", "Pozole Rojo", "Tres Leches",
  "Black Rooster Asada", "Sweet Plantains", "Shrimp & Chorizo", "Smoked Greens",
  "Really Good Chocolate Chip Cookies", "Really Good Peanut Butter", "Teriyaki Salmon", "Golden Char Chicken",
  "Green Goodness", "Chipotle", "Sour Cream", "Taco Tortilla"
];
for (const [name,url] of Object.entries(urls)) {
  try {
    const response=await fetch(url,{headers:{"user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36", "accept":"text/html"} ,signal:AbortSignal.timeout(30000)});
    const body=await response.text();
    console.log("START",name,response.status,body.length,response.url);
    for(const needle of needles) {
      const index=body.toLowerCase().indexOf(needle.toLowerCase());
      if(index<0)continue;
      console.log("NEEDLE",name,needle,index);
      let area=body.slice(Math.max(0,index-1800),Math.min(body.length,index+3000));
      const matches=[...area.matchAll(/https?:[^"' <>\\]{12,450}?\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"' <>\\]{0,150})?/gi)].map(m=>m[0]);
      console.log("CANDIDATES",JSON.stringify([...new Set(matches)].slice(0,10)));
      console.log("SNIPPET",area.slice(1400,1900).replace(/\s+/g," ").slice(0,480));
    }
    const urlsFound=[...body.matchAll(/https?:[^"' <>\\]{12,450}?\.(?:jpg|jpeg|png|webp)(?:\?[^"' <>\\]{0,100})?/gi)].map(m=>m[0]);
    console.log("ALL_IMAGE_URLS",name,new Set(urlsFound).size,JSON.stringify([...new Set(urlsFound)].slice(0,8)));
  } catch(e) {console.log("ERROR",name,String(e));}
}
