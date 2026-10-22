-- Persist every field exposed by the menu editor; preserve transactional invalidation.
create or replace function verifed_private.command_impl(p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); rid uuid; did uuid; reqid uuid;
 d public.dishes%rowtype; r public.requests%rowtype;
 b jsonb; snap jsonb; resp jsonb; event jsonb; member boolean;
 action text; message text; status text; revision int;
 at text:=to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 if uid is null then raise exception 'Sign in to continue.' using errcode='42501'; end if;
 if jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>30000 then raise exception 'Invalid request payload.'; end if;
 if p_action='createRestaurant' then
   if length(trim(coalesce(p_payload->>'name',''))) not between 1 and 120 then raise exception 'Enter a restaurant name.'; end if;
   if (select count(*) from public.memberships where user_id=uid)>=3 then raise exception 'You can create up to three fictional workspaces.'; end if;
   insert into public.restaurants(name,location,description,confirmed)
    values(trim(p_payload->>'name'),left(coalesce(p_payload->>'location','Fictional workspace'),200),left(coalesce(p_payload->>'description','Your fictional restaurant workspace'),500),true) returning id into rid;
   insert into public.memberships(user_id,restaurant_id) values(uid,rid);
   -- Clone only public demonstration dishes; never copy diner data.
   for d in select di.* from public.dishes di join public.restaurants re on re.id=di.restaurant_id where re.slug='citrus-table' loop
    did:=gen_random_uuid();
    insert into public.dishes(id,restaurant_id,body) values(did,rid,d.body||jsonb_build_object('id',did,'restaurantId',rid,'revision',1));
   end loop;
   return jsonb_build_object('id',rid);
 elsif p_action='createRequest' then
   -- Lock the catalog row so a simultaneous ingredient edit cannot slip past request creation.
   select * into d from public.dishes where id=(p_payload->>'dishId')::uuid for update;
   if not found then raise exception 'Dish no longer exists.'; end if;
   if not exists(select 1 from public.restaurants where id=d.restaurant_id and confirmed) then raise exception 'This menu is unconfirmed; contact the restaurant directly.'; end if;
   snap:=jsonb_build_object('dishName',d.body->'name','ingredients',d.body->'ingredients','allergens',d.body->'allergens','preparation',d.body->'preparation','dishRevision',d.body->'revision','allergies',coalesce(p_payload->'allergies','[]'),'restrictions',coalesce(p_payload->'restrictions','[]'),'modifications',coalesce(p_payload->'modifications','[]'),'question',left(coalesce(p_payload->>'question',''),2000));
   reqid:=gen_random_uuid();
   b:=jsonb_build_object('id',reqid,'userId',uid,'restaurantId',d.restaurant_id,'dishId',d.id,'dishName',d.body->'name','revision',1,'status','submitted','snapshot',snap,'response',null,'acknowledgedResponseId',null,'createdAt',at,'updatedAt',at,'events',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'type','submitted','revision',1,'actor','diner','message','Request sent to kitchen','at',at,'snapshot',snap)));
   insert into public.requests(id,user_id,restaurant_id,dish_id,body) values(reqid,uid,d.restaurant_id,d.id,b);
   return b;
 elsif p_action='actOnRequest' then
   select * into r from public.requests where id=(p_payload->>'id')::uuid for update;
   if not found then raise exception 'Request not found.'; end if;
   member:=exists(select 1 from public.memberships where user_id=uid and restaurant_id=r.restaurant_id);
   action:=p_payload->>'action'; b:=r.body; revision:=(b->>'revision')::int;
   if action in ('respond','change') then
    if not member then raise exception 'Restaurant staff permission required.' using errcode='42501'; end if;
   elsif action in ('acknowledge','resubmit','cancel','complete') then
    if uid<>r.user_id then raise exception 'Only the diner can do that.' using errcode='42501'; end if;
   else raise exception 'Unknown request action.'; end if;
   if (p_payload->>'expectedRevision')::int is distinct from revision then raise exception 'This request changed. Refresh it before continuing.'; end if;
   if b->>'status' in ('completed','cancelled','declined') then raise exception 'This request is closed. Start a new request.'; end if;
   snap:=b->'snapshot'; resp:=b->'response'; status:=b->>'status';
   if action='respond' then
    if p_payload->>'decision' not in ('accommodate','clarify','decline') or p_payload->>'decision' is null or length(trim(coalesce(p_payload->>'message','')))=0 then raise exception 'Choose a response and explain preparation details.'; end if;
    if status='acknowledged' then raise exception 'Record a change before replacing an acknowledged response.'; end if;
    message:=left(trim(p_payload->>'message'),2000);
    resp:=jsonb_build_object('id',gen_random_uuid(),'revision',revision,'decision',p_payload->>'decision','message',message,'createdAt',at);
    status:=case p_payload->>'decision' when 'accommodate' then 'responded' when 'clarify' then 'clarification' else 'declined' end;
    b:=b||jsonb_build_object('acknowledgedResponseId',null);
   elsif action='acknowledge' then
    if status<>'responded' or resp->>'decision' is distinct from 'accommodate' or (resp->>'revision')::int is distinct from revision or p_payload->>'responseId' is distinct from resp->>'id' then raise exception 'This response is outdated or not ready to acknowledge.'; end if;
    b:=b||jsonb_build_object('acknowledgedResponseId',resp->>'id');status:='acknowledged';message:='Diner read the current kitchen response';
   elsif action in ('change','resubmit') then
    if action='change' then
     if length(trim(coalesce(p_payload->>'reason','')))=0 then raise exception 'Explain what changed.'; end if;
     snap:=snap||jsonb_strip_nulls(jsonb_build_object('ingredients',p_payload->'ingredients','allergens',p_payload->'allergens','preparation',p_payload->'preparation'));
     status:='review_required';message:=left(p_payload->>'reason',2000);
    else
     snap:=snap||jsonb_strip_nulls(jsonb_build_object('allergies',p_payload->'allergies','restrictions',p_payload->'restrictions','modifications',p_payload->'modifications','question',p_payload->'question'));
     status:='submitted';message:='Diner updated their request';
    end if;
    revision:=revision+1;resp:='null';b:=b||jsonb_build_object('acknowledgedResponseId',null);
   elsif action='cancel' then status:='cancelled';message:='Diner cancelled this request';
   elsif action='complete' then
    if status<>'acknowledged' or resp->>'id' is distinct from b->>'acknowledgedResponseId' or (resp->>'revision')::int is distinct from revision then raise exception 'Read and acknowledge the current response first.'; end if;
    status:='completed';message:='Diner finished this request';
   end if;
   event:=jsonb_build_object('id',gen_random_uuid(),'type',action,'revision',revision,'actor',case when action in ('respond','change') then 'staff' else 'diner' end,'message',message,'at',at,'snapshot',snap,'response',resp);
   b:=b||jsonb_build_object('revision',revision,'status',status,'snapshot',snap,'response',resp,'updatedAt',at,'events',(b->'events')||jsonb_build_array(event));
   update public.requests set body=b where id=r.id;
   return b;
 elsif p_action='saveDish' then
   select * into d from public.dishes where id=(p_payload->>'id')::uuid for update;
   if not found then raise exception 'Dish not found.'; end if;
   if not exists(select 1 from public.memberships where user_id=uid and restaurant_id=d.restaurant_id) then raise exception 'Restaurant staff permission required.' using errcode='42501'; end if;
   if (p_payload->>'revision')::int is distinct from (d.body->>'revision')::int then raise exception 'Menu changed. Refresh before saving.'; end if;
   if length(trim(coalesce(p_payload->>'name',''))) not between 1 and 120 or jsonb_typeof(p_payload->'ingredients') is distinct from 'array' or jsonb_typeof(p_payload->'allergens') is distinct from 'array' then raise exception 'Provide a name, ingredients, and allergens.'; end if;
   b:=d.body||jsonb_build_object('name',p_payload->'name','description',coalesce(p_payload->'description',d.body->'description'),'price',coalesce(p_payload->'price',d.body->'price'),'category',coalesce(p_payload->'category',d.body->'category'),'emoji',coalesce(p_payload->'emoji',d.body->'emoji'),'tags',coalesce(p_payload->'tags',d.body->'tags'),'modifications',coalesce(p_payload->'modifications',d.body->'modifications'),'ingredients',p_payload->'ingredients','allergens',p_payload->'allergens','preparation',coalesce(p_payload->'preparation',d.body->'preparation'),'informationComplete',coalesce(p_payload->'informationComplete',d.body->'informationComplete'),'revision',(d.body->>'revision')::int+1);
   update public.dishes set body=b where id=d.id;
   for r in select * from public.requests where dish_id=d.id and body->>'status' not in ('completed','cancelled','declined') order by id for update loop
    revision:=(r.body->>'revision')::int+1;
    snap:=(r.body->'snapshot')||jsonb_build_object('dishName',b->'name','ingredients',b->'ingredients','allergens',b->'allergens','preparation',b->'preparation','dishRevision',b->'revision');
    event:=jsonb_build_object('id',gen_random_uuid(),'type','menu_changed','revision',revision,'actor','staff','message','Restaurant updated this dish. A new response is required.','at',at,'snapshot',snap);
    update public.requests set body=r.body||jsonb_build_object('dishName',b->'name','revision',revision,'snapshot',snap,'response',null,'acknowledgedResponseId',null,'status','review_required','updatedAt',at,'events',(r.body->'events')||jsonb_build_array(event)) where id=r.id;
   end loop;
   return b;
 elsif p_action='deleteMyData' then
   delete from public.requests where user_id=uid;
   delete from public.meals where user_id=uid;
   delete from public.favorites where user_id=uid;
   delete from public.profiles where id=uid;
   return jsonb_build_object('deleted',true);
 end if;
 raise exception 'Unknown command.';
end $$;

create or replace function verifed_private.command(p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare key text; did uuid; rid uuid; b jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in to continue.' using errcode='42501'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or length(p_payload::text)>30000 then raise exception 'Invalid request payload.'; end if;
 foreach key in array array['ingredients','allergens','allergies','restrictions','modifications','tags'] loop
  if p_payload ? key and not verifed_private.string_array(p_payload->key) then raise exception 'Invalid list: %',key; end if;
 end loop;
 foreach key in array array['name','location','description','question','preparation','message','reason','decision','action','id','dishId','responseId','restaurantId','category','emoji'] loop
  if p_payload ? key and (jsonb_typeof(p_payload->key) is distinct from 'string' or length(p_payload->>key)>2000) then raise exception 'Invalid text: %',key; end if;
 end loop;
 if p_payload ? 'informationComplete' and jsonb_typeof(p_payload->'informationComplete') is distinct from 'boolean' then raise exception 'Invalid menu information status.'; end if;
 if p_payload ? 'price' and (jsonb_typeof(p_payload->'price') is distinct from 'number' or (p_payload->>'price')::numeric<0 or (p_payload->>'price')::numeric>10000) then raise exception 'Enter a valid price.'; end if;
 if p_action='addDish' then
  rid:=(p_payload->>'restaurantId')::uuid;
  if not exists(select 1 from public.memberships where user_id=auth.uid() and restaurant_id=rid) then raise exception 'Restaurant staff permission required.' using errcode='42501'; end if;
  if length(trim(coalesce(p_payload->>'name',''))) not between 1 and 120 or not p_payload ? 'ingredients' or not p_payload ? 'allergens' then raise exception 'Provide a name, ingredients, and allergens.'; end if;
  if p_payload ? 'price' and (jsonb_typeof(p_payload->'price') is distinct from 'number' or (p_payload->>'price')::numeric<0 or (p_payload->>'price')::numeric>10000) then raise exception 'Enter a valid price.'; end if;
  did:=gen_random_uuid();
  b:=jsonb_build_object('id',did,'restaurantId',rid,'name',trim(p_payload->>'name'),'description',coalesce(p_payload->>'description',''),'price',coalesce(p_payload->'price','0'::jsonb),'emoji',coalesce(p_payload->>'emoji','🍽️'),'category',coalesce(p_payload->>'category','Plates'),'ingredients',p_payload->'ingredients','allergens',p_payload->'allergens','tags',coalesce(p_payload->'tags','[]'),'modifications',coalesce(p_payload->'modifications','[]'),'preparation',coalesce(p_payload->>'preparation','Ask staff about preparation and shared equipment.'),'informationComplete',coalesce(p_payload->'informationComplete','false'),'revision',1);
  insert into public.dishes(id,restaurant_id,body) values(did,rid,b);
  return b;
 end if;
 return verifed_private.command_impl(p_action,p_payload);
end $$;
