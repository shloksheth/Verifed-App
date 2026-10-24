import {localDishes,localRestaurants} from "../src/local-catalog.js";
import {menuPhotoFor} from "../src/menu-photos.js";
const targets=new Set(["hawkers-orlando","loving-hut-orlando","taco-bell-south-orange","taco-bell-east-colonial","taco-bell-orlando-west"]);
const restaurants=new Map(localRestaurants.map(x=>[x.slug,x]));
const items=localDishes.filter(d=>targets.has(d.restaurantId)).map(d=>({dish:d,photo:menuPhotoFor(d,restaurants.get(d.restaurantId))}));
const urls=new Map(items.filter(x=>x.photo?.url).map(x=>[x.photo.url,x.dish.catalogKey]));
const all=[...urls.entries()];
const results=[];
for(let i=0;i<all.length;i+=12)results.push(...await Promise.all(all.slice(i,i+12).map(async ([url,item])=>{
 try{
  const r=await fetch(url,{headers:{"Accept":"image/*","Range":"bytes=0-8191","User-Agent":"Mozilla/5.0 Verifed QA"},redirect:"follow",signal:AbortSignal.timeout(14000)});
  let type=r.headers.get("content-type")||"";
  await r.body?.cancel();
  return {item,url,status:r.status,kind:type,ok:r.ok&&type.startsWith("image/")};
 }catch(e){return {item,url,ok:false,reason:String(e).slice(0,200)}}
})));
for(const r of results)if(!r.ok)console.log("IMAGE_FAILURE",JSON.stringify(r));
console.log("BATCH5_SUMMARY",JSON.stringify({items:items.length,referenced:items.filter(x=>x.photo).length,uniqueURLs:all.length,loaded:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length}));
