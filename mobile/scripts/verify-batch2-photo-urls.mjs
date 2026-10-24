import { verifiedDishPhotos } from "../src/verified-dish-photos.js";

const restaurantSlugs = [
  "tin-taco-downtown",
  "mamak-colonial",
  "stubborn-mule",
  "pig-floyds-mills",
  "lazy-moon-mills",
];
const photos=restaurantSlugs.flatMap(slug=>
  Object.entries(verifiedDishPhotos[slug]||{}).map(([key,entry])=>({slug,key,...entry}))
);
async function inspect(image){
  try{
    const r=await fetch(image.url,{
      method:"GET",
      redirect:"follow",
      headers:{"Accept":"image/*","Range":"bytes=0-4095","User-Agent":"VerifedPhotoHealth/1.0"},
      signal:AbortSignal.timeout(10000)
    });
    const type=r.headers.get("content-type")||"";
    await r.body?.cancel();
    return {slug:image.slug,key:image.key,status:r.status,type,ok:r.ok&&type.toLowerCase().startsWith("image/")};
  }catch(e){
    return {slug:image.slug,key:image.key,status:"error",ok:false,error:String(e?.message||e)};
  }
}
let checked=[];
for(let i=0;i<photos.length;i+=8){
  checked.push(...await Promise.all(photos.slice(i,i+8).map(inspect)));
}
for(const r of checked)console.log("BATCH2_IMAGE",JSON.stringify(r));
console.log("BATCH2_TOTAL",JSON.stringify({
  entries:photos.length,healthy:checked.filter(x=>x.ok).length,
  failed:checked.filter(x=>!x.ok).map(x=>x.slug+"/"+x.key)
}));
