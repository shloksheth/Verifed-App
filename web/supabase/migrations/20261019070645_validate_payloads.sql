create function verifed_private.string_array(value jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
 select case when jsonb_typeof(value)='array' then
  jsonb_array_length(value)<=30 and not exists(select 1 from jsonb_array_elements(value) element where jsonb_typeof(element)<>'string' or length(element#>>'{}') not between 1 and 100)
 else false end;
$$;
revoke all on function verifed_private.string_array(jsonb) from public,anon;
grant execute on function verifed_private.string_array(jsonb) to authenticated;

alter function verifed_private.command(text,jsonb) rename to command_impl;
revoke all on function verifed_private.command_impl(text,jsonb) from public,anon,authenticated;
create function verifed_private.command(p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare key text;
begin
 if auth.uid() is null then raise exception 'Sign in to continue.' using errcode='42501'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Invalid request payload.'; end if;
 foreach key in array array['ingredients','allergens','allergies','restrictions','modifications'] loop
  if p_payload ? key and not verifed_private.string_array(p_payload->key) then raise exception 'Invalid list: %',key; end if;
 end loop;
 foreach key in array array['name','location','description','question','preparation','message','reason','decision','action','id','dishId','responseId'] loop
  if p_payload ? key and (jsonb_typeof(p_payload->key) is distinct from 'string' or length(p_payload->>key)>2000) then raise exception 'Invalid text: %',key; end if;
 end loop;
 if p_payload ? 'informationComplete' and jsonb_typeof(p_payload->'informationComplete') is distinct from 'boolean' then raise exception 'Invalid menu information status.'; end if;
 return verifed_private.command_impl(p_action,p_payload);
end $$;
revoke all on function verifed_private.command(text,jsonb) from public,anon;
grant execute on function verifed_private.command(text,jsonb) to authenticated;
-- Rebind the SQL wrapper after renaming the implementation.
create or replace function public.verifed_command(p_action text,p_payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$ select verifed_private.command(p_action,p_payload); $$;

alter table public.profiles add constraint profile_lists_bounded check(
 verifed_private.string_array(to_jsonb(allergies)) and verifed_private.string_array(to_jsonb(restrictions)) and
 verifed_private.string_array(to_jsonb(likes)) and verifed_private.string_array(to_jsonb(dislikes)));
alter table public.meals add constraint meal_shape check(
 coalesce(jsonb_typeof(body->'dishName')='string' and length(body->>'dishName') between 1 and 120 and
 jsonb_typeof(body->'rating')='number' and (body->>'rating')::numeric between 1 and 5 and
 (body->>'rating')::numeric=trunc((body->>'rating')::numeric) and
 jsonb_typeof(body->'restaurantName')='string' and length(body->>'restaurantName')<=120 and
 jsonb_typeof(body->'notes')='string' and length(body->>'notes')<=2000 and
 jsonb_typeof(body->'createdAt')='string' and length(body->>'createdAt')<=50 and
 verifed_private.string_array(body->'tags'),false));

-- Public examples have no real kitchen operator. Only a user's own workspace accepts cloud requests.
update public.restaurants set confirmed=false where slug is not null;
