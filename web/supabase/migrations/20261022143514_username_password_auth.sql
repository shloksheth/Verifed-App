-- Identity lookup is private. Password hashes remain entirely in Supabase Auth.
create table verifed_private.usernames (
  username text primary key check (username ~ '^[a-z0-9_]{3,24}$'),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table verifed_private.usernames enable row level security;
revoke all on verifed_private.usernames from public, anon, authenticated;
grant usage on schema verifed_private to service_role;
grant all on verifed_private.usernames to service_role;

create function verifed_private.register_username()
returns trigger language plpgsql security definer set search_path = '' as $$
declare requested text;
begin
  requested := lower(btrim(new.raw_user_meta_data ->> 'username'));
  -- Google accounts can keep using their email without claiming a username.
  if requested is null then return new; end if;
  if requested !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'Invalid username';
  end if;
  insert into verifed_private.usernames(username, user_id) values(requested, new.id);
  insert into public.profiles(id, name) values(new.id, requested)
    on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function verifed_private.register_username() from public, anon, authenticated;
create trigger register_verifed_username after insert on auth.users
  for each row execute function verifed_private.register_username();

-- Only the Edge Function's service role can resolve a username to an email.
-- The bucket stores a SHA-256 identifier hash, never a password or raw email.
create table verifed_private.account_attempts (
  bucket text primary key,
  minute timestamptz not null,
  attempts integer not null
);
alter table verifed_private.account_attempts enable row level security;
revoke all on verifed_private.account_attempts from public, anon, authenticated;
grant all on verifed_private.account_attempts to service_role;

create function public.verifed_account_lookup(p_username text, p_bucket text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare count_now integer; found_email text;
begin
  if p_bucket !~ '^[a-f0-9]{64}$' or p_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'Invalid lookup';
  end if;
  delete from verifed_private.account_attempts where minute < now() - interval '10 minutes';
  insert into verifed_private.account_attempts(bucket, minute, attempts)
    values(p_bucket, date_trunc('minute', now()), 1)
  on conflict (bucket) do update set
    attempts = case when account_attempts.minute = date_trunc('minute', now())
      then account_attempts.attempts + 1 else 1 end,
    minute = date_trunc('minute', now())
  returning attempts into count_now;
  if count_now > 12 then return jsonb_build_object('limited', true); end if;
  select u.email into found_email from verifed_private.usernames n
    join auth.users u on u.id = n.user_id where n.username = p_username;
  return jsonb_build_object('email', found_email, 'limited', false);
end;
$$;
revoke all on function public.verifed_account_lookup(text, text) from public, anon, authenticated;
grant execute on function public.verifed_account_lookup(text, text) to service_role;
