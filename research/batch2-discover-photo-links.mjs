// Discovery-only diagnostics. Never assign photos based on text proximity alone.
// Print title/alt/image URL for human review; does not mutate catalog.
const sites = [
  ...["","menu/asian-street-food","menu/dine-in","menu/lunch","menu/curry","menu/noodles","menu/rice","menu/soup","food-menu"].map(x=>({id:"mamak:"+x,url:"https://www.mamakeats.com/"+x})),
  {id:"pigfloyds",url:"https://www.pigfloyds.com/"},
  {id:"pigfloyds-menu",url:"https://www.pigfloyds.com/menu"},
  {id:"lazy",url:"https://www.lazymoonpizza.com/menu"},
  {id:"tin",url:"https://order.toasttab.com/online/tin-and-taco-downtown-orlando-40-w-washington-st"},
  {id:"stubborn",url:"https://order.toasttab.com/online/the-stubborn-mule-100-s-eola-drive"}
];
const entity = s => (s||"").replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n));
const attr=(tag,k)=>{const r=tag.match(new RegExp("(?:^|\\s)"+k+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]*))","i"));return entity(r?.[1]||r?.[2]||r?.[3]||"")};
function run(s,id) {
 const arr = [...s.matchAll(/<img\b[^>]*>/gi)].map(m=>({index:m.index,tag:m[0]}));
 const out=[];
 for(const item of arr){const a=attr(item.tag,"alt"),src=attr(item.tag,"src")||attr(item.tag,"data-src"),set=attr(item.tag,"srcset"); const before=s.slice(Math.max(0,item.index-500),item.index).replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(-120);if(src||set){out.push({alt:a,src:src.slice(0,500),srcset:set.slice(0,150),before:before.slice(-85)});}}
 console.log("SITE_IMAGES",JSON.stringify({site:id,count:out.length,images:out.slice(0,150)}));
}
for(const site of sites){
 try{const r=await fetch(site.url,{headers:{"user-agent":"Mozilla/5.0 (compatible; image-audit/1.0)","accept":"text/html"},signal:AbortSignal.timeout(13000)});const s=await r.text();console.log("SITE_STATUS",JSON.stringify({id:site.id,status:r.status,bytes:s.length,url:r.url}));if(r.ok)run(s,site.id);}
 catch(e){console.log("SITE_ERROR",site.id,String(e));}
}
