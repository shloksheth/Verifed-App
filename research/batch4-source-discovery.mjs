const urls={
osteria:"https://www.osteriaester.com/menu",
osteriaToast:"https://toast.app/r/osteria-ester-629-east-central-boulevard/order?diningOption=delivery",
seito:"https://www.seitosushibp.com/menu",
yellow:"https://yellowdogeats.com/",
bombay:"https://bombaykitchenorlando.com/menu/",
woodlands:"https://www.woodlandsusa.com/"
};
const names={osteria:["Focaccia","Gnocchi Sardo","Pappardelle Bolognese"],osteriaToast:["Focaccia","Gnocchi Sardo","Pappardelle Bolognese"],seito:["Pacific Oysters","Tuna Crispy Rice","Edamame"],yellow:["Bleu Suede Shoes","Club Elvis","What the Fig"],bombay:["Mini Papad Bhel","Vegetable Samosa","Kale Chaat"],woodlands:["Iddly","Masala Dosai","Vegetable Samosa"]};
for(const [key,url] of Object.entries(urls)) {
 try{
 const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36","Accept":"text/html"},signal:AbortSignal.timeout(16000)});
 const html=await r.text();console.log("SITE",key,r.status,html.length,r.url);
 const imgs=[...html.matchAll(/<img\b[^>]*>/gi)].map(x=>x[0]);console.log("IMGCOUNTS",key,imgs.length);
 console.log("IMGEXAMPLES",key,JSON.stringify(imgs.slice(0,10).map(x=>x.slice(0,400))));
 for(const n of names[key]){
  const positions=[];let start=0;while(positions.length<3){const i=html.toLowerCase().indexOf(n.toLowerCase(),start);if(i<0)break;positions.push(i);start=i+n.length}
  console.log("NAME",key,n,JSON.stringify(positions));
  for(const i of positions.slice(0,2))console.log("SNIP",key,n,JSON.stringify(html.slice(Math.max(0,i-800),Math.min(html.length,i+800))));
 }
 console.log("SRCSET",key,JSON.stringify([...new Set([...html.matchAll(/https?:[^"'\s<>\\]+?\.(?:webp|jpg|jpeg|png)(?:\?[^"'\s<>\\]{0,120})?/gi)].map(x=>x[0]))].slice(0,35)));
 }catch(e){console.log("ERROR",key,String(e))}
}