-- Run against the new project as postgres. Everything, including test users, rolls back.
begin;
insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','verifed-owner-test@example.invalid'),
 ('10000000-0000-4000-8000-000000000002','verifed-diner-test@example.invalid'),
 ('10000000-0000-4000-8000-000000000003','verifed-outsider-test@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$
declare workspace jsonb; dish uuid;
begin
 workspace:=public.verifed_command('createRestaurant','{"name":"Rollback test restaurant"}');
 perform set_config('test.restaurant',workspace->>'id',true);
 select id into dish from public.dishes where restaurant_id=(workspace->>'id')::uuid limit 1;
 if dish is null then raise exception 'FAIL: workspace did not clone dishes'; end if;
 perform set_config('test.dish',dish::text,true);
 if not exists(select 1 from public.memberships where restaurant_id=(workspace->>'id')::uuid) then raise exception 'FAIL: missing owner membership'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$
declare request jsonb;
begin
 request:=public.verifed_command('createRequest',jsonb_build_object('dishId',current_setting('test.dish'),'allergies',jsonb_build_array('Milk'),'question','Separate utensils?'));
 perform set_config('test.request',request->>'id',true);
 if request->>'status'<>'submitted' then raise exception 'FAIL: request not submitted'; end if;
 begin
  perform public.verifed_command('actOnRequest',jsonb_build_object('id',request->>'id','action','respond','expectedRevision',1,'decision','accommodate','message','Forged staff response'));
  raise exception 'FAIL: diner could respond';
 exception when insufficient_privilege then null;
 end;
 begin
  update public.requests set body='{}' where id=(request->>'id')::uuid;
  raise exception 'FAIL: direct request mutation allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.memberships(user_id,restaurant_id) values(auth.uid(),current_setting('test.restaurant')::uuid);
  raise exception 'FAIL: staff self-assignment allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.verifed_command('createRequest',jsonb_build_object('dishId',current_setting('test.dish'),'allergies','{}'::jsonb));
  raise exception 'FAIL: malformed allergy payload accepted';
 exception when raise_exception then
  if sqlerrm not like 'Invalid list:%' then raise; end if;
 end;
 begin
  insert into public.meals(user_id,body) values(auth.uid(),'{}');
  raise exception 'FAIL: empty meal accepted';
 exception when check_violation then null;
 end;
 insert into public.profiles(id,name,allergies) values(auth.uid(),'Rollback diner',array['Milk']);
 insert into public.meals(user_id,body) values(auth.uid(),'{"dishName":"Test meal","restaurantName":"Test","rating":5,"notes":"test","tags":[],"createdAt":"2026-10-19T00:00:00Z"}');
 insert into public.favorites(user_id,dish_id) values(auth.uid(),current_setting('test.dish')::uuid);
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
do $$ begin
 if exists(select 1 from public.requests) or exists(select 1 from public.profiles) or exists(select 1 from public.meals) or exists(select 1 from public.favorites) then raise exception 'FAIL: outsider read private data'; end if;
 begin
  perform public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','cancel','expectedRevision',1));
  raise exception 'FAIL: outsider could cancel';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$ declare request jsonb; begin
 if not exists(select 1 from public.requests where id=current_setting('test.request')::uuid) then raise exception 'FAIL: owner cannot read workspace request'; end if;
 if exists(select 1 from public.profiles where id='10000000-0000-4000-8000-000000000002') then raise exception 'FAIL: staff could read full diner profile'; end if;
 request:=public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','respond','expectedRevision',1,'decision','accommodate','message','Fresh utensils; dressing checked.'));
 perform set_config('test.old_response',request->'response'->>'id',true);
 request:=public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','respond','expectedRevision',1,'decision','accommodate','message','Updated preparation explanation.'));
 perform set_config('test.response',request->'response'->>'id',true);
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$ declare request jsonb; begin
 begin
  perform public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','acknowledge','expectedRevision',1,'responseId',current_setting('test.old_response')));
  raise exception 'FAIL: replaced response acknowledged';
 exception when raise_exception then
  if sqlerrm not like 'This response is outdated%' then raise; end if;
 end;
 request:=public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','acknowledge','expectedRevision',1,'responseId',current_setting('test.response')));
 if request->>'status'<>'acknowledged' then raise exception 'FAIL: current response acknowledgment failed'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$ declare dish jsonb; request jsonb; begin
 select body into dish from public.dishes where id=current_setting('test.dish')::uuid;
 perform public.verifed_command('saveDish',dish||'{"name":"Changed test dish","ingredients":["Chicken","Butter"],"allergens":["Milk"],"price":23,"category":"Specials","emoji":"🥣","tags":["Savory"],"modifications":["No butter"]}'::jsonb);
 select body into dish from public.dishes where id=current_setting('test.dish')::uuid;
 if dish->>'price'<>'23' or dish->>'category'<>'Specials' or dish->'tags'<>'["Savory"]'::jsonb or dish->'modifications'<>'["No butter"]'::jsonb then raise exception 'FAIL: exposed menu fields did not persist'; end if;
 select body into request from public.requests where id=current_setting('test.request')::uuid;
 if request->>'status'<>'review_required' or (request->>'revision')::int<>2 or request->'response'<>'null'::jsonb or request->'acknowledgedResponseId'<>'null'::jsonb then raise exception 'FAIL: menu edit failed to invalidate response'; end if;
 if request->'events'->0->'snapshot'->>'dishName'='Changed test dish' then raise exception 'FAIL: old snapshot mutated'; end if;
 begin
  perform public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','respond','expectedRevision',1,'decision','accommodate','message','Outdated screen'));
  raise exception 'FAIL: stale revision accepted';
 exception when raise_exception then
  if sqlerrm not like 'This request changed%' then raise; end if;
 end;
 request:=public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','respond','expectedRevision',2,'decision','clarify','message','Is butter a conflict?'));
 if request->>'status'<>'clarification' then raise exception 'FAIL: clarify failed'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$ declare request jsonb; begin
 request:=public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','resubmit','expectedRevision',2,'question','Yes, no butter please.'));
 if request->>'status'<>'submitted' or (request->>'revision')::int<>3 then raise exception 'FAIL: resubmit failed'; end if;
 request:=public.verifed_command('actOnRequest',jsonb_build_object('id',current_setting('test.request'),'action','cancel','expectedRevision',3));
 if request->>'status'<>'cancelled' then raise exception 'FAIL: cancel failed'; end if;
 perform public.verifed_command('deleteMyData','{}');
 if exists(select 1 from public.requests) or exists(select 1 from public.profiles) or exists(select 1 from public.meals) or exists(select 1 from public.favorites) then raise exception 'FAIL: personal data deletion incomplete'; end if;
end $$;
set local role anon;
do $$ begin
 if (select count(*) from public.dishes)<12 then raise exception 'FAIL: anonymous catalog unavailable'; end if;
 begin
  perform public.verifed_command('createRestaurant','{"name":"Unauthorized"}');
  raise exception 'FAIL: anonymous command permitted';
 exception when insufficient_privilege then null;
 end;
 begin
  perform * from public.profiles;
  raise exception 'FAIL: anonymous profiles readable';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
select 'PASS: RLS isolation, membership, payload validation, stale revision/response, catalog invalidation, immutable history, clarification/resubmission/cancellation, data deletion, anonymous grants' as verification;
rollback;
