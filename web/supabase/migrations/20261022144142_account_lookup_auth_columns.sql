-- The invoker resolver needs only identity columns; password hashes stay inaccessible.
grant select(id, email) on auth.users to service_role;
