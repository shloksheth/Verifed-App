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
