import fs from "node:fs";
import { publishedMenus } from "../mobile/src/restaurant-menus.js";
const slugs=["osteria-ester","seito-baldwin-park","yellow-dog-eats-gotha","woodlands-orlando","bombay-street-kitchen"];
const menu=publishedMenus.filter(x=>slugs.includes(x.key));
const excluded=/^(?:logo|restaurant|kitchen interior|street view|map|portrait|signage|painting|artwork|menu |poster|advertisement|product label)/i;
const stopwords=new Set(["and","the","with","of","a","an","in","on","to","for","is","at","de","di","del","alla","plate","dish","food","indian","italian","sushi","served","house","style","fried"]);
const typo={iddly:"idli",dosai:"dosa",uthappam:"uttapam",pullavs:"pulao",dhai:"dahi",bhendi:"bhindi",samasa:"samosa",puri:"puri",samber:"sambar",vadai:"vada",aloo:"potato",medhu:"medu",chilly:"chili",vegitables:"vegetables"};
const animal=["chicken","pork","beef","shrimp","prawn","lamb","salmon","tuna","crab","fish","egg","duck","turkey","squid","scallop","octopus","oyster"];
const formWords=["sandwich","salad","pizza","pasta","gnocchi","tortelloni","pappardelle","paccheri","risotto","crostini","tiramisu","cannoli","focaccia","soup","ramen","sushi","sashimi","nigiri","poke","roll","tempura","edamame","udon","rice","noodles","katsu","yakitori","biryani","tikka","curry","paneer","samosa","chaat","dosa","idli","vada","uttapam","paratha","naan","roti","thali","pakora","kebab","chutney","dessert","cake","pudding","wrap","nachos","tacos","ribs","fries","quesadilla","potatoes","burger","sandwiches","bhel","lassi"];
const tok=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").split(" ").map(x=>typo[x]||x).filter(x=>x&&!stopwords.has(x)&&x.length>=3);
const clean=s=>tok(s).join(" ");
const normTitle=item=>item.name.replace(/\([^)]*\)/g," ").replace(/\s+-\s+(?:Half|Full) Rack$/i,"").replace(/^(?:Dinner|Lunch)\s+/i,"").trim();
const dominant=(item,slug)=>{
 let tokens=tok(item.name+" "+(item.description||""));let form=formWords.find(x=>tokens.includes(x));
 if(slug==="yellow-dog-eats-gotha"&&!form){form=/taco|nacho/i.test(item.category)?"taco":/salad/i.test(item.category)?"salad":/wrap/i.test(item.category)?"wrap":"sandwich";}
 if(slug==="seito-baldwin-park"&&!form){form=/Nigiri/.test(item.category)?"nigiri":/Makimono/.test(item.category)?"sushi roll":"Japanese entree";}
 return {form,protein:animal.find(x=>tokens.includes(x)),tokens};
};
function plans(item,slug){
 const name=normTitle(item),x=dominant(item,slug);
 const shorter=name.replace(/^(?:House-|Classic |The |Signature |Baked |Crispy )/i,"").replace(/\s+-\s+.*/,"").trim();
 const desc=tok(item.description||"").slice(0,5).join(" ");
 let alternatives=[name,shorter+(x.form&& !clean(shorter).includes(x.form)?" "+x.form:""),(x.protein||tok(item.description||"")[0]||"")+" "+(x.form||"food")+(desc?" "+desc.split(" ").slice(0,2).join(" "):""),x.form||"food"];
 const keys=new Set();return alternatives.map(s=>s.trim()).filter(s=>{let k=clean(s);if(k.length<3||keys.has(k))return false;keys.add(k);return true});
}
const licenses=["CC0","Public domain","CC BY","CC BY-SA"];
let requests=0,errors=0;
async function search(query){
 for(let attempt=0;attempt<2;attempt++){
 try{
 const api="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url%7Cextmetadata%7Csize&iiurlwidth=720&format=json";
 const r=await fetch(api,{headers:{"User-Agent":"VerifedEducationMenuPhotoAudit/1.0 (research; Wikimedia Commons attribution)","Accept":"application/json"},signal:AbortSignal.timeout(15000)});requests++;
 if(!r.ok){errors++;await new Promise(res=>setTimeout(res,250*(attempt+1)));continue;}
 const j=await r.json();
 return Object.values(j.query?.pages||{}).map(p=>{
 const i=p.imageinfo?.[0]||{},meta=i.extmetadata||{};
 const t=String(p.title||"");
 return {fileTitle:t,title:t.replace(/^File:/,"").replace(/\.[^.]+$/,"").replace(/_/g," "),url:i.thumburl||i.url,sourceUrl:i.descriptionurl||"https://commons.wikimedia.org/wiki/"+encodeURIComponent(t.replaceAll(" ","_")),credit:String(meta.Artist?.value||"Wikimedia Commons contributor").replace(/<[^>]*>/g," ").slice(0,180),license:String(meta.LicenseShortName?.value||""),licenseUrl:String(meta.LicenseUrl?.value||""),description:String(meta.ImageDescription?.value||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(0,240),mime:i.mime,width:i.thumbwidth||i.width,height:i.thumbheight||i.height};
 }).filter(p=>p.url&&/image\/(jpeg|png|webp)/i.test(p.mime||"")&& licenses.some(x=>(p.license||"").startsWith(x))&&!excluded.test(p.title));
 }catch(e){errors++;if(attempt===0)await new Promise(res=>setTimeout(res,300));}
 }return [];
}
function scorePhoto(photo,item,slug,q){
 const itemTokens=tok(item.name),pic=tok(photo.title),desc=tok(item.description),qTokens=tok(q);
 const x=dominant(item,slug),pt=new Set(pic),overlap=itemTokens.filter(t=>pt.has(t));
 let score=overlap.length/Math.max(1,itemTokens.length);
 if(overlap.length>=2)score+=.15;
 if(clean(photo.title)===clean(item.name))score+=.5;
 if(x.form&&pt.has(x.form))score+=.22;
 if(x.protein&&pt.has(x.protein))score+=.16;
 if(x.protein&&animal.some(a=>a!==x.protein&&pt.has(a)&&!desc.includes(a)))score-=.35;
 if(!overlap.length&&x.form&&pt.has(x.form))score+=.22;
 if(!overlap.length&&!x.form&&qTokens.some(t=>pt.has(t)))score+=.12;
 if(pic.includes("collage")||pic.includes("buffet")||pic.includes("platter")&&!item.name.toLowerCase().includes("platter"))score-=.18;
 if(pic.some(x=>["sign","building","art","portrait","poster","animation","drawing","logo"].includes(x)))score-=.8;
 return Number(score.toFixed(3));
}
const jobs=menu.flatMap(m=>m.items.map(item=>({slug:m.key,restaurant:m.name,item})));
const rows=new Array(jobs.length);
let next=0;
async function worker(){
 while(next<jobs.length){
  const idx=next++,job=jobs[idx],{slug,item}=job;
  const variants=plans(item,slug);
  let found=[],seen=new Set(),searchLog=[];
  for(const q of variants){
   const pics=await search(q);searchLog.push({query:q,found:pics.length});
   for(const p of pics){if(seen.has(p.url))continue;seen.add(p.url);found.push({...p,score:scorePhoto(p,item,slug,q),query:q})}
   if(found.filter(x=>x.score>=.9).length>=5)break;
  }
  found.sort((a,b)=>b.score-a.score);
  const choices=found.slice(0,6),best=choices[0]||null;
  rows[idx]={slug,key:item.key,name:item.name,description:item.description||"",category:item.category,queries:variants,candidateCount:found.length,queriesAttempted:searchLog,candidates:choices,selectedCandidate:best&&best.score>=.47?best:null,sourceType:"commons-representative-not-restaurant",manuallyViewed:false};
  if(idx%25===0)console.log("SCANNED",idx,jobs.length,"queries",requests,"errors",errors,"sample",slug,item.name,"candidates",choices.length);
 }
}
await Promise.all(Array.from({length:6},()=>worker()));
const summary={total:jobs.length,withCandidates:rows.filter(x=>x.candidates.length).length,autoSelected:rows.filter(x=>x.selectedCandidate).length,withoutChoices:rows.filter(x=>!x.candidates.length).length,requests,errors,perRestaurant:Object.fromEntries(slugs.map(s=>[s,{total:rows.filter(x=>x.slug===s).length,autoSelected:rows.filter(x=>x.slug===s&&x.selectedCandidate).length}]))};
fs.writeFileSync("research/batch4-commons-candidates.json",JSON.stringify({generatedAt:"2026-10-24",description:"Up to four independent search formulations per dish; candidates filtered by source description and title, NOT manual visual inspection",summary,entries:rows},null,2)+"\n");
console.log("BATCH4_DISCOVERY_SUMMARY",JSON.stringify(summary));
