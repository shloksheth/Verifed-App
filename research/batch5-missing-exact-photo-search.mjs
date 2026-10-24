const jobs=[
["paris","https://www.tacobell.com/food/featured?store=026080",["Paris Hilton's Usual"]],
["paris-product","https://www.tacobell.com/food/featured/paris-hiltons-usual",["Paris Hilton's Usual"]],
["hawkers-bethesda","https://order.online/store/hawkers-asian-street-food-bethesda-1238930",["Po Po Lo's Shrimp Curry","Po Po Lo's Steak Curry","Thai Fried Egg"]],
["hawkers-uber-jax","https://www.ubereats.com/store/hawkers-asian-street-food-jacksonville/3Wz1AILWRPCFVCUTuB-IQQ",["Po Po Lo's Shrimp Curry","Po Po Lo's Steak Curry"]]
];
for(const [job,url,names] of jobs){
 try{
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36","Accept":"text/html"},redirect:"follow",signal:AbortSignal.timeout(17000)});
  const body=await r.text();
  console.log("PAGE",job,r.status,r.url,body.length);
  for(const name of names){
   const at=body.toLowerCase().indexOf(name.toLowerCase());
   console.log("NAME",job,name,at);
   if(at<0)continue;
   console.log("WINDOW",job,name,JSON.stringify(body.slice(Math.max(0,at-1800),at+1100).slice(0,2800)));
  }
  for(const m of body.matchAll(/<img\s+[^>]*alt="([^"]+)"[^>]*src="([^"]+)"[^>]*>/g)){
   if(names.some(x=>m[1].toLowerCase().includes(x.toLowerCase())))console.log("IMG",job,JSON.stringify({alt:m[1],src:m[2]}));
  }
 }catch(e){console.log("ERR",job,String(e))}
}
