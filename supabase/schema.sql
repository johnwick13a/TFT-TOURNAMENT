create table if not exists public.tournaments (
    id text primary key check (id = 'main'),
    owner_id uuid not null references auth.users(id) on delete cascade,
    state jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.tournaments enable row level security;

drop policy if exists "Anyone can view the shared tournament"
    on public.tournaments;
drop policy if exists "Authenticated users can view the shared tournament"
    on public.tournaments;
create policy "Authenticated users can view the shared tournament"
    on public.tournaments
    for select
    to authenticated
    using (id = 'main');

drop policy if exists "Tournament owner can create shared data"
    on public.tournaments;
create policy "Tournament owner can create shared data"
    on public.tournaments
    for insert
    to authenticated
    with check (
        id = 'main'
        and owner_id = (select auth.uid())
        and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
    );

drop policy if exists "Tournament owner can update shared data"
    on public.tournaments;
create policy "Tournament owner can update shared data"
    on public.tournaments
    for update
    to authenticated
    using (
        id = 'main'
        and owner_id = (select auth.uid())
        and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
    )
    with check (
        id = 'main'
        and owner_id = (select auth.uid())
        and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
    );

drop policy if exists "Tournament owner can delete shared data"
    on public.tournaments;
create policy "Tournament owner can delete shared data"
    on public.tournaments
    for delete
    to authenticated
    using (
        id = 'main'
        and owner_id = (select auth.uid())
        and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
    );

revoke select on public.tournaments from anon;
grant select on public.tournaments to authenticated;
grant insert, update, delete on public.tournaments to authenticated;

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'tournaments'
    ) then
        alter publication supabase_realtime
            add table public.tournaments;
    end if;
end
$$;
