import { localDishes } from "../src/local-catalog.js";
const slugs=["chipotle-south-orange","fresh-kitchen-waterford","black-rooster-mills"];
const records=localDishes.filter(d=>slugs.includes(d.restaurantId)&&d.imageUrl);
const unique=[...new Map(records.map(d=>[d.imageUrl,{item:d.catalogKey,url:d.imageUrl,credit:d.imageCredit}])).values()];
async function inspect(x) {
 try {
  const r=await fetch(x.url,{method:"GET",headers:{Accept:"image/*",Range:"bytes=0-8191"},signal:AbortSignal.timeout(13000)});
  let content=r.headers.get("content-type")||"";
  await r.body?.cancel();
  return {item:x.item,status:r.status,contentType:content,ok:r.ok&&content.startsWith("image/")};
 }catch(err){return {item:x.item,status:"unavailable",ok:false,error:String(err)};}
}
let results=[];for(let i=0;i<unique.length;i+=8)results.push(...await Promise.all(unique.slice(i,i+8).map(inspect)));
for(const x of results) console.log("PHOTO_CHECK",JSON.stringify(x));
const good=results.filter(x=>x.ok).length;
console.log("PHOTO_SUMMARY",JSON.stringify({good,total:results.length,failed:results.length-good,slugs}));
