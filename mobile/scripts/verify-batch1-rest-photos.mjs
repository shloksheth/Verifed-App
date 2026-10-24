import { verifiedDishPhotos } from "../src/verified-dish-photos.js";
const slugs=["pizza-bruno-curry","winter-park-biscuit"];
const records=slugs.flatMap(slug=>Object.entries(verifiedDishPhotos[slug]||{}).map(([key,photo])=>({slug,key,...photo})));
async function check(photo){
  try {
    const r=await fetch(photo.url,{headers:{"user-agent":"Mozilla/5.0","accept":"image/*","range":"bytes=0-4095"},redirect:"follow",signal:AbortSignal.timeout(11000)});
    const ct=r.headers.get("content-type")||"";
    await r.body?.cancel();
    return {slug:photo.slug,key:photo.key,url:photo.url,status:r.status,contentType:ct,healthy:r.ok&&ct.startsWith("image/")};
  }catch(e){return {slug:photo.slug,key:photo.key,healthy:false,error:String(e).slice(0,150)};}
}
let results=[];
for(let i=0;i<records.length;i+=6)results.push(...await Promise.all(records.slice(i,i+6).map(check)));
for(const r of results)console.log("PHOTO_PROBE",JSON.stringify(r));
console.log("PHOTO_SUMMARY",JSON.stringify({total:results.length,healthy:results.filter(x=>x.healthy).length,failed:results.filter(x=>!x.healthy).map(x=>x.slug+"/"+x.key)}));
