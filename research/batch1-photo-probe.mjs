// Temporary diagnostic, never collects user data.
const sites=[
{key:"WPBC-toast",url:"https://order.toasttab.com/online/winterparkbiscuitco",names:["Crispy Chik Sandwich","Death Valley Chik Sandwich","WPBC Burger","Buffalo Chik Sub","Loaded Fries","The SEC","Strawberry Preserves","Vegan Mayo"]},
{key:"WPBC-uber",url:"https://www.ubereats.com/store/winter-park-biscuit-co/zWzPfF3KVgmkRjZRGu7AZA?diningMode=DELIVERY",names:["Crispy Chik Sandwich","Death Valley Chik Sandwich","WPBC Burger","Loaded Fries","The SEC","Sausage Gravy","Side Kale Salad"]},
{key:"WPBC-home",url:"https://www.winterparkbiscuitco.com/",names:["MENU","wpbco_menu_items","burger","sandwich"]},
{key:"Pizza-Curry",url:"https://pizzabrunofl.com/order/pizza-bruno-curry-ford-3990-curry-ford-road",names:["Margherita","Roni","BIG RIG","Blanca","Viva Verde","Tiramisu TOGO","Classic Cannoli","Brussel Sprouts"]},
{key:"Pizza-toast",url:"https://order.toasttab.com/online/pizza-bruno-curry-ford-3990-curry-ford-road",names:["Margherita","Roni","BIG RIG","Blanca","Viva Verde","Tiramisu TOGO","Classic Cannoli","Brussel Sprouts"]},
{key:"Pizza-uber",url:"https://www.ubereats.com/store/pizza-bruno-curry-ford",names:["Margherita","Roni","Blanca"]}
];
const expand=(s)=>s.replace(/\\u002F/g,"/").replace(/\\u003A/g,":").replace(/\\u0026/g,"&").replace(/\\\//g,"/").replace(/&quot;/g,'"').replace(/&amp;/g,"&");
function imagesNear(s){
 const xs=[...s.matchAll(/https?:[^\s"'<>\\]{5,600}(?:jpg|png|webp|jpeg|avif)(?:\?[^\s"'<>]{0,100})?/gi)].map(x=>x[0]);
 return [...new Set(xs)].slice(0,8);
}
for(const site of sites){
 try{
 const r=await fetch(site.url,{headers:{"user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36","accept":"text/html"},signal:AbortSignal.timeout(18000)});
 const s=expand(await r.text());
 console.log("SITE",JSON.stringify({key:site.key,status:r.status,length:s.length,final:r.url,totalImages:imagesNear(s).length,firstImages:imagesNear(s).slice(0,5)}));
 for(const name of site.names){const positions=[...s.matchAll(new RegExp(name.replace(/[.*+?^$\{\}()|[\]\\]/g,"\\$&"),"gi"))].slice(0,3).map(m=>m.index);
 const nearby=positions.map(index=>{const area=s.slice(Math.max(0,index-2200),Math.min(s.length,index+3600));return {index,images:imagesNear(area),snippet:area.slice(2000,2460).replace(/\s+/g," ").slice(0,460)}});
 console.log("ITEM",JSON.stringify({site:site.key,name,found:positions.length,nearby}));}
 }catch(e){console.log("ERROR",site.key,String(e).slice(0,350))}
}
