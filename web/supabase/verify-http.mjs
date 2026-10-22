// Opt-in integration verification. Credentials belong to disposable, pre-provisioned test users.
// Supply VERIFED_TEST_CREDENTIALS JSON or a base64 JSON argument; never commit credentials.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

const credentials=JSON.parse(process.env.VERIFED_TEST_CREDENTIALS||Buffer.from(process.argv[2]||'','base64').toString());
const url='https://dpcxzqovrxvxeladucuz.supabase.co';
const key='sb_publishable_LibLu5_Nro06ZmEZ2jre3w_Z8U8qNtj';
const makeClient=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const owner=makeClient(),diner=makeClient(),visitor=makeClient();
let checks=0;
function okay(response){assert.ifError(response.error);return response.data;}
function pass(label){checks++;console.log(`PASS ${label}`);}
async function command(client,action,payload){return okay(await client.rpc('verifed_command',{p_action:action,p_payload:payload}));}

try {
 const publicMenu=okay(await visitor.from('dishes').select('*'));
 assert.ok(publicMenu.length>=12);pass('anonymous public catalog');
 const forbidden=await visitor.rpc('verifed_command',{p_action:'createRestaurant',p_payload:{name:'Unauthorized'}});
 assert.ok(forbidden.error);pass('anonymous command denied');
 okay(await owner.auth.signInWithPassword({email:credentials.owner,password:credentials.password}));
 okay(await diner.auth.signInWithPassword({email:credentials.diner,password:credentials.password}));
 const ownerUser=okay(await owner.auth.getUser()).user;
 const dinerUser=okay(await diner.auth.getUser()).user;
 assert.notEqual(ownerUser.id,dinerUser.id);pass('two real password sessions and validated users');
 const workspace=await command(owner,'createRestaurant',{name:'HTTP verification workspace'});
 const dish=await command(owner,'addDish',{restaurantId:workspace.id,name:'HTTP test bowl',ingredients:['Rice','Chicken'],allergens:[],price:10,informationComplete:true});
 assert.equal(dish.revision,1);pass('owner creates workspace and dish atomically authorized');
 const forbiddenDish=await diner.rpc('verifed_command',{p_action:'addDish',p_payload:{restaurantId:workspace.id,name:'Forbidden',ingredients:[],allergens:[]}});
 assert.ok(forbiddenDish.error);pass('other user cannot edit owner catalog');
 okay(await diner.from('profiles').upsert({id:dinerUser.id,name:'HTTP test diner',allergies:['Milk']}));
 assert.equal(okay(await owner.from('profiles').select('*').eq('id',dinerUser.id)).length,0);pass('profile CRUD and cross-user read isolation');
 const meal=okay(await diner.from('meals').insert({user_id:dinerUser.id,body:{dishName:'Custom meal',restaurantName:'Test',rating:4,notes:'First note',tags:['Fresh'],createdAt:'2026-10-19T00:00:00Z'}}).select('*').single());
 okay(await diner.from('meals').update({body:{...meal.body,rating:5,notes:'Edited note'}}).eq('id',meal.id));
 assert.equal(okay(await diner.from('meals').select('*').eq('id',meal.id).single()).body.rating,5);pass('meal insert and update');
 let request=await command(diner,'createRequest',{dishId:dish.id,allergies:['Milk'],question:'Separate utensils?'});
 assert.equal(okay(await owner.from('requests').select('body').eq('id',request.id)).length,1);pass('diner request visible to its restaurant staff');
 request=await command(owner,'actOnRequest',{id:request.id,action:'respond',expectedRevision:1,decision:'accommodate',message:'Separate utensils; ingredients checked.'});
 const responseId=request.response.id;
 request=await command(diner,'actOnRequest',{id:request.id,action:'acknowledge',expectedRevision:1,responseId});
 assert.equal(request.status,'acknowledged');pass('cross-session response and acknowledgment');
 await command(owner,'saveDish',{...dish,ingredients:['Rice','Chicken','Butter'],allergens:['Milk']});
 request=okay(await diner.from('requests').select('body').eq('id',request.id).single()).body;
 assert.equal(request.status,'review_required');assert.equal(request.response,null);assert.equal(request.revision,2);pass('catalog edit invalidates active response across sessions');
 const stale=await diner.rpc('verifed_command',{p_action:'actOnRequest',p_payload:{id:request.id,action:'acknowledge',expectedRevision:1,responseId}});
 assert.ok(stale.error?.message.includes('changed'));pass('stale HTTP request rejected');
 request=await command(owner,'actOnRequest',{id:request.id,action:'respond',expectedRevision:2,decision:'decline',message:'We cannot meet this request.'});
 assert.equal(request.status,'declined');pass('decline closes request');
 await command(diner,'deleteMyData',{});
 assert.equal(okay(await diner.from('requests').select('*')).length,0);assert.equal(okay(await diner.from('meals').select('*')).length,0);pass('personal data deletion');
 console.log(JSON.stringify({status:'passed',checks,workspaceId:workspace.id,auth:'real password sessions on disposable pre-confirmed identities',emailDelivery:'not tested'}));
} finally {
 await Promise.all([owner.auth.signOut(),diner.auth.signOut()]);
}
