-- =====================================================================
--  MECHWART TIPPVERSENY – 6. frissítés: pályaválasztás (veto) kezelése a weboldalról
--  Supabase → SQL Editor → New query → az egész fájl bemásolva → Run   (többször is lefuttatható)
--
--  • public.veto: egyetlen sor (id = 1), benne a stream pályaválasztás-képernyőjének állapota.
--    Mindenki olvashatja (ezt olvassa a streamen futó veto.html), írni csak a kezelők tudják.
--  • public.veto_kezelok: akik a szervezőkön (admins) kívül kezelhetik a pályaválasztást.
--    Ők NEM lesznek szervezők: tippelhetnek, meccseredményt nem írhatnak.
-- =====================================================================

create table if not exists public.veto (
  id         int primary key,
  data       jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.veto enable row level security;
insert into public.veto (id, data) values (1, null) on conflict (id) do nothing;

create table if not exists public.veto_kezelok (
  user_id    uuid primary key references auth.users on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.veto_kezelok enable row level security;
revoke all on public.veto_kezelok from anon, authenticated;

-- kezelheti-e a belépett felhasználó a pályaválasztást (szervező vagy vetókezelő)
create or replace function private.can_veto()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin() or exists (select 1 from public.veto_kezelok k where k.user_id = (select auth.uid()));
$$;
revoke all on function private.can_veto() from public;
grant execute on function private.can_veto() to authenticated;

create or replace function public.can_veto()
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.can_veto();
$$;
revoke all on function public.can_veto() from public, anon;
grant execute on function public.can_veto() to authenticated;

-- jogosultságok
revoke all on public.veto from anon, authenticated;
grant select on public.veto to anon, authenticated;
grant update (data) on public.veto to authenticated;

drop policy if exists "veto olvasas" on public.veto;
create policy "veto olvasas" on public.veto for select to anon, authenticated using (true);

drop policy if exists "veto iras" on public.veto;
create policy "veto iras" on public.veto for update to authenticated
  using ((select private.can_veto())) with check ((select private.can_veto()));

-- ki és mikor módosította utoljára
create or replace function private.veto_touch()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.updated_at := now(); new.updated_by := (select auth.uid()); return new; end $$;
drop trigger if exists veto_touch on public.veto;
create trigger veto_touch before update on public.veto for each row execute function private.veto_touch();

-- ellenőrzés
select id, data is null as ures, updated_at from public.veto;

-- =====================================================================
--  Vetókezelő hozzáadása (Discord-felhasználónévvel, előtte egyszer lépjen be az oldalra):
--    insert into public.veto_kezelok (user_id, note)
--    select user_id, 'tatreaso' from auth.identities
--    where provider = 'discord' and lower(identity_data->>'full_name') = 'tatreaso'
--    on conflict do nothing;
--  Eltávolítás:
--    delete from public.veto_kezelok where note = 'tatreaso';
-- =====================================================================
