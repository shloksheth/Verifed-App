import { writeFile } from "node:fs/promises";
import { localRestaurants, localDishes } from "../verifed-mobile/src/local-catalog.js";

// This file prepares SQL for the connected database tool. It holds public menu
// facts only. UUIDs are allocated by Postgres, never guessed in application code.
const selected = process.argv[2];
const offset = Number(process.argv[3] || 0);
const size = Number(process.argv[4] || Number.MAX_SAFE_INTEGER);
if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(size) || size < 1)
  throw new Error("Use a nonnegative row offset and a positive batch size.");
if (selected && !localRestaurants.some((restaurant) => restaurant.slug === selected))
  throw new Error("Unknown restaurant selection.");
const restaurantRows = localRestaurants.filter((restaurant) => !selected || restaurant.slug === selected);
const dishRows = localDishes.filter((dish) => !selected || dish.restaurantId === selected).slice(offset, offset + size);
const restaurants = JSON.stringify(restaurantRows);
const dishes = JSON.stringify(dishRows);
const sql = `begin;
insert into public.restaurants (slug,name,location,description,emoji,fictional,confirmed,details)
select r->>'slug',r->>'name',r->>'location',r->>'description',r->>'emoji',false,false,
  r - array['id','slug','name','location','description','emoji','fictional','confirmed']
from jsonb_array_elements($catalog$${restaurants}$catalog$::jsonb) r
on conflict(slug) do update set name=excluded.name,location=excluded.location,
  description=excluded.description,emoji=excluded.emoji,fictional=false,confirmed=false,details=excluded.details;
with incoming as (
  select value as body from jsonb_array_elements($catalog$${dishes}$catalog$::jsonb)
), resolved as (
  select coalesce((select d.id from public.dishes d where d.body->>'catalogKey'=i.body->>'catalogKey'),gen_random_uuid()) id,
    r.id restaurant_id,i.body
  from incoming i join public.restaurants r on r.slug=i.body->>'restaurantId'
)
insert into public.dishes(id,restaurant_id,body)
select id,restaurant_id,body || jsonb_build_object('id',id,'restaurantId',restaurant_id) from resolved
on conflict(id) do update set body=excluded.body;
commit;
select r.slug,count(d.id) as menu_entries,r.confirmed,r.fictional from public.restaurants r
join public.dishes d on d.restaurant_id=r.id where not r.fictional group by r.id order by r.slug;
`;
await writeFile(new URL(`./orlando-catalog-seed${selected ? '-' + selected : ''}${process.argv[3] ? '-part' + offset : ''}.sql`, import.meta.url), sql);
console.log("Prepared public catalog seed: " + restaurantRows.length + " restaurants, " + dishRows.length + " entries.");
