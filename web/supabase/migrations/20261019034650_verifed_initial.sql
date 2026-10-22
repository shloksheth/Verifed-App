-- Public catalog, private diner records, and one transactional command boundary.
create schema if not exists verifed_private;
revoke all on schema verifed_private from public, anon;
grant usage on schema verifed_private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '' check(length(name)<=100),
 allergies text[] not null default '{}', restrictions text[] not null default '{}',
 likes text[] not null default '{}', dislikes text[] not null default '{}'
);
create table public.restaurants (
 id uuid primary key default gen_random_uuid(), slug text unique,
 name text not null check(length(name) between 1 and 120),
 location text not null default '', description text not null default '',
 emoji text not null default '🍽️', confirmed boolean not null default false,
 fictional boolean not null default true check(fictional)
);
create table public.memberships (
 user_id uuid not null references auth.users(id) on delete cascade,
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 role text not null default 'owner' check(role='owner'), primary key(user_id,restaurant_id)
);
create index memberships_restaurant_idx on public.memberships(restaurant_id);
create table public.dishes (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 body jsonb not null check(jsonb_typeof(body)='object')
);
create index dishes_restaurant_idx on public.dishes(restaurant_id);
create table public.requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 restaurant_id uuid not null references public.restaurants(id),
 dish_id uuid not null references public.dishes(id),
 body jsonb not null check(jsonb_typeof(body)='object')
);
create index requests_user_idx on public.requests(user_id);
create index requests_restaurant_idx on public.requests(restaurant_id);
create index requests_dish_idx on public.requests(dish_id);
create table public.meals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 body jsonb not null check(jsonb_typeof(body)='object' and (body->>'rating')::int between 1 and 5 and length(body->>'dishName') between 1 and 120)
);
create index meals_user_idx on public.meals(user_id);
create table public.favorites (
 user_id uuid not null references auth.users(id) on delete cascade,
 dish_id uuid not null references public.dishes(id) on delete cascade,
 primary key(user_id,dish_id)
);
create index favorites_dish_idx on public.favorites(dish_id);

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.memberships enable row level security;
alter table public.dishes enable row level security;
alter table public.requests enable row level security;
alter table public.meals enable row level security;
alter table public.favorites enable row level security;
revoke all on public.profiles,public.restaurants,public.memberships,public.dishes,public.requests,public.meals,public.favorites from anon,authenticated;
grant select on public.restaurants,public.dishes to anon,authenticated;
grant select on public.memberships,public.requests to authenticated;
grant select,insert,update,delete on public.profiles,public.meals,public.favorites to authenticated;

create policy catalog_read on public.restaurants for select to anon,authenticated using(true);
create policy dishes_read on public.dishes for select to anon,authenticated using(true);
create policy own_memberships on public.memberships for select to authenticated using(user_id=(select auth.uid()));
create policy own_profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy own_profile_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_profile_delete on public.profiles for delete to authenticated using(id=(select auth.uid()));
create policy request_read on public.requests for select to authenticated using(user_id=(select auth.uid()) or restaurant_id in (select m.restaurant_id from public.memberships m where m.user_id=(select auth.uid())));
create policy own_meals_read on public.meals for select to authenticated using(user_id=(select auth.uid()));
create policy own_meals_insert on public.meals for insert to authenticated with check(user_id=(select auth.uid()));
create policy own_meals_update on public.meals for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_meals_delete on public.meals for delete to authenticated using(user_id=(select auth.uid()));
create policy own_favorites_read on public.favorites for select to authenticated using(user_id=(select auth.uid()));
create policy own_favorites_insert on public.favorites for insert to authenticated with check(user_id=(select auth.uid()));
create policy own_favorites_update on public.favorites for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_favorites_delete on public.favorites for delete to authenticated using(user_id=(select auth.uid()));

-- Only this private function can write requests/catalog/membership. Public wrapper is invoker.
-- Every branch authenticates and checks ownership; client metadata never grants a staff role.
create function verifed_private.command(p_action text,p_payload jsonb) returns jsonb
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
   b:=d.body||jsonb_build_object('name',p_payload->'name','description',coalesce(p_payload->'description',d.body->'description'),'ingredients',p_payload->'ingredients','allergens',p_payload->'allergens','preparation',coalesce(p_payload->'preparation',d.body->'preparation'),'informationComplete',coalesce(p_payload->'informationComplete',d.body->'informationComplete'),'revision',(d.body->>'revision')::int+1);
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
revoke all on function verifed_private.command(text,jsonb) from public,anon;
grant execute on function verifed_private.command(text,jsonb) to authenticated;
create function public.verifed_command(p_action text,p_payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$ select verifed_private.command(p_action,p_payload); $$;
revoke all on function public.verifed_command(text,jsonb) from public,anon;
grant execute on function public.verifed_command(text,jsonb) to authenticated;

-- Fictional seed catalog. UUID references are resolved by slug, never assumed.
insert into public.restaurants(slug,name,location,description,emoji,confirmed) values('citrus-table','Citrus & Table','Orlando · Fictional restaurant','Bright bowls, fresh herbs, and a little Florida sunshine.','🍊',true);
insert into public.dishes(restaurant_id,body) select id,'{"name":"Sunshine chicken bowl","description":"Citrus chicken, brown rice, avocado, and garden greens.","price":16,"emoji":"🥗","category":"Bowls","ingredients":["Chicken","Brown rice","Avocado","Orange","Lettuce"],"allergens":[],"tags":["Fresh","Citrus","Savory"],"modifications":["Dressing on the side","No avocado"],"preparation":"Shared preparation area. Ask staff about separate utensils.","informationComplete":true,"revision":1}'::jsonb from public.restaurants where slug='citrus-table';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Roasted harvest bowl","description":"Sweet potato, quinoa, and crunchy toasted seeds.","price":14,"emoji":"🥙","category":"Bowls","ingredients":["Sweet potato","Quinoa","Pumpkin seeds","Tahini"],"allergens":["Sesame"],"tags":["Fresh","Herby","Vegan","Vegetarian","Gluten-free"],"modifications":["No tahini"],"preparation":"Shared equipment; cross-contact information needs staff review.","informationComplete":true,"revision":1}'::jsonb from public.restaurants where slug='citrus-table';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Basil cloud pasta","description":"Warm pasta with basil cream and cherry tomatoes.","price":18,"emoji":"🍝","category":"Comfort","ingredients":["Wheat pasta","Cream","Parmesan","Basil","Tomato"],"allergens":["Wheat","Milk"],"tags":["Creamy","Herby","Vegetarian"],"modifications":["Tomato sauce instead of cream"],"preparation":"Pasta cooked in shared water.","informationComplete":true,"revision":1}'::jsonb from public.restaurants where slug='citrus-table';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Golden citrus cake","description":"A small sunny finish with orange glaze.","price":8,"emoji":"🍰","category":"Dessert","ingredients":["Flour","Egg","Butter","Orange"],"allergens":["Wheat","Egg","Milk"],"tags":["Sweet","Citrus","Vegetarian"],"modifications":[],"preparation":"Prepared in a shared bakery.","informationComplete":true,"revision":1}'::jsonb from public.restaurants where slug='citrus-table';
insert into public.restaurants(slug,name,location,description,emoji,confirmed) values('garden-noodle','Garden Noodle','Winter Park · Fictional restaurant','Colorful noodles and cozy, vegetable-forward plates.','🍜',false);
insert into public.dishes(restaurant_id,body) select id,'{"name":"Ginger garden noodles","description":"Rice noodles, ginger, and seasonal vegetables.","price":15,"emoji":"🍜","category":"Noodles","ingredients":["Rice noodles","Ginger","Carrot","Soy sauce"],"allergens":["Soy","Wheat"],"tags":["Savory","Fresh","Vegetarian","Vegan"],"modifications":["No soy sauce"],"preparation":"Sauce ingredient details are unconfirmed.","informationComplete":false,"revision":1}'::jsonb from public.restaurants where slug='garden-noodle';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Crispy tofu bites","description":"Golden tofu with a tangy dipping sauce.","price":10,"emoji":"🍢","category":"Small plates","ingredients":["Tofu","Cornstarch","Sesame oil"],"allergens":["Soy","Sesame"],"tags":["Crispy","Savory","Vegetarian","Vegan"],"modifications":["Sauce on the side"],"preparation":"Shared fryer. Ask restaurant for details.","informationComplete":false,"revision":1}'::jsonb from public.restaurants where slug='garden-noodle';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Chili peanut ramen","description":"Rich peanut broth with a warm chili kick.","price":17,"emoji":"🍲","category":"Noodles","ingredients":["Wheat noodles","Peanuts","Soy sauce","Chili"],"allergens":["Wheat","Peanuts","Soy"],"tags":["Spicy","Creamy","Vegetarian"],"modifications":[],"preparation":"Broth preparation is unconfirmed.","informationComplete":false,"revision":1}'::jsonb from public.restaurants where slug='garden-noodle';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Mango sticky rice","description":"Coconut rice and ripe mango.","price":9,"emoji":"🥭","category":"Dessert","ingredients":["Rice","Coconut milk","Mango"],"allergens":[],"tags":["Sweet","Fresh","Vegetarian","Vegan","Gluten-free"],"modifications":[],"preparation":"Garnishes and cross-contact are unconfirmed.","informationComplete":false,"revision":1}'::jsonb from public.restaurants where slug='garden-noodle';
insert into public.restaurants(slug,name,location,description,emoji,confirmed) values('little-olive','Little Olive','Orlando · Fictional restaurant','Mediterranean favorites made for sharing.','🫒',false);
insert into public.dishes(restaurant_id,body) select id,'{"name":"Lemon herb falafel","description":"Chickpea falafel, hummus, and warm pita.","price":14,"emoji":"🧆","category":"Plates","ingredients":["Chickpeas","Lemon","Parsley","Tahini","Pita"],"allergens":["Sesame","Wheat"],"tags":["Crispy","Herby","Vegetarian","Vegan"],"modifications":["No pita","No hummus"],"preparation":"Shared fryer and utensils; unconfirmed menu.","informationComplete":false,"revision":1}'::jsonb from public.restaurants where slug='little-olive';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Tomato garden flatbread","description":"Tomatoes, mozzarella, and fragrant basil.","price":16,"emoji":"🍕","category":"Plates","ingredients":["Wheat dough","Mozzarella","Tomato","Basil"],"allergens":["Wheat","Milk"],"tags":["Savory","Herby","Vegetarian"],"modifications":["No cheese"],"preparation":"Shared oven. Ask about ingredients and preparation.","informationComplete":false,"revision":1}'::jsonb from public.restaurants where slug='little-olive';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Olive grove salad","description":"Cucumber, olives, tomato, and feta.","price":13,"emoji":"🥒","category":"Salads","ingredients":["Cucumber","Olives","Tomato","Feta"],"allergens":["Milk"],"tags":["Fresh","Savory","Vegetarian","Gluten-free"],"modifications":["No feta"],"preparation":"Dressing details are unconfirmed.","informationComplete":false,"revision":1}'::jsonb from public.restaurants where slug='little-olive';
insert into public.dishes(restaurant_id,body) select id,'{"name":"Honey pistachio yogurt","description":"Thick yogurt with honey and pistachios.","price":8,"emoji":"🍯","category":"Dessert","ingredients":["Yogurt","Honey","Pistachios"],"allergens":["Milk","Tree nuts"],"tags":["Sweet","Creamy","Vegetarian"],"modifications":["No pistachios"],"preparation":"Shared dessert utensils.","informationComplete":false,"revision":1}'::jsonb from public.restaurants where slug='little-olive';
update public.dishes set body=body||jsonb_build_object('id',id,'restaurantId',restaurant_id);
