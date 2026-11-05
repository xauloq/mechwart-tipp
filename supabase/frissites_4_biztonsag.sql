-- =====================================================================
--  MECHWART TIPPVERSENY – 4. frissítés: a Supabase biztonsági figyelmeztetéseinek javítása
--  Supabase → SQL Editor → New query → az egész fájl bemásolva → Run
--
--  A 2. és 3. frissítést is tartalmazza, tehát ha azok még nem futottak le, elég ez az egy.
--  Többször is lefuttatható. A meccsek, tippek, profilok megmaradnak.
--
--  Mit javít:
--   • Security Definer View (leaderboard, tip_stats): a nézetek a hívó jogával futnak,
--     az összesítést egy nem nyilvános sémában lévő függvény végzi
--   • Public Can Execute SECURITY DEFINER Function: a kiemelt jogú függvények a nem
--     nyilvános „private” sémába kerülnek, a régi, nem használt függvények törlődnek
--   • Auth RLS Initialization Plan: auth.uid() → (select auth.uid()) a szabályokban
-- =====================================================================

-- ---------- 0. Nem nyilvános séma a kiemelt jogú függvényeknek ----------
-- (a „private” séma nincs kitéve az API-ra, így ezek a függvények kívülről közvetlenül nem hívhatók)
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- ---------- 1. Szervezők (a 3. frissítésből, ha még nem futott le) ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

insert into public.admins (user_id, note)
select i.user_id, 'd3lta4k · Discord ID ' || coalesce(i.identity_data->>'provider_id', i.provider_id)
from auth.identities i
where i.provider = 'discord'
  and lower(regexp_replace(coalesce(i.identity_data->>'full_name', i.identity_data->>'name', ''), '#0$', '')) = 'd3lta4k'
on conflict (user_id) do nothing;

-- ---------- 2. Kiemelt jogú függvények a private sémában ----------
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

create or replace function private.match_has_tips(p_match text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tips t where t.match_id = p_match);
$$;

create or replace function private.leaderboard()
returns table (user_id uuid, name text, avatar_url text, points int, correct int, decided int, tips int)
language sql stable security definer set search_path = '' as $$
  select p.id,
         coalesce(nullif(p.display_name, ''), p.username),
         p.avatar_url,
         coalesce(sum(case when m.winner is not null and t.pick = m.winner
                           then m.points + case when m.exact_bonus > 0 and t.series = m.score1 || '-' || m.score2
                                                then m.exact_bonus else 0 end
                           else 0 end), 0)::int,
         (count(*) filter (where m.winner is not null and t.pick = m.winner))::int,
         (count(*) filter (where m.winner is not null))::int,
         count(t.match_id)::int
  from public.profiles p
  join public.tips t on t.user_id = p.id
  join public.matches m on m.id = t.match_id
  group by p.id
  having count(*) filter (where m.winner is not null) > 0;   -- csak akinek már van kiértékelt tippje
$$;

create or replace function private.tip_stats()
returns table (match_id text, total int, pick1 int, pick2 int)
language sql stable security definer set search_path = '' as $$
  select m.id,
         count(t.match_id)::int,
         case when m.kickoff <= now() then (count(*) filter (where t.pick = 1))::int end,
         case when m.kickoff <= now() then (count(*) filter (where t.pick = 2))::int end
  from public.matches m
  left join public.tips t on t.match_id = m.id
  group by m.id, m.kickoff;
$$;

revoke all on all functions in schema private from public;
grant execute on function private.leaderboard(), private.tip_stats() to anon, authenticated;
grant execute on function private.is_admin(), private.match_has_tips(text) to authenticated;

-- ---------- 3. Nyilvános rész: csak a hívó jogával futó elemek ----------
-- lehet-e még tippelni (a meccsek amúgy is nyilvánosak, ezért nem kell kiemelt jog)
create or replace function public.can_tip(p_match text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.matches m
                 where m.id = p_match and m.kickoff > now() and m.winner is null);
$$;

-- a weboldal ezzel kérdezi le, hogy a belépett felhasználó szervező-e
drop function if exists public.is_admin() cascade;
create function public.is_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_admin();
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop view if exists public.leaderboard;
create view public.leaderboard with (security_invoker = true) as select * from private.leaderboard();
drop view if exists public.tip_stats;
create view public.tip_stats with (security_invoker = true) as select * from private.tip_stats();
grant select on public.leaderboard, public.tip_stats to anon, authenticated;

-- ---------- 4. Szabályok újra, gyorsabb formában ----------
drop policy if exists "sajat tippek olvasasa" on public.tips;
create policy "sajat tippek olvasasa" on public.tips for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "tipp leadasa" on public.tips;
create policy "tipp leadasa" on public.tips for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_tip(match_id));

drop policy if exists "tipp modositasa" on public.tips;
create policy "tipp modositasa" on public.tips for update to authenticated
  using (user_id = (select auth.uid()) and public.can_tip(match_id))
  with check (user_id = (select auth.uid()) and public.can_tip(match_id));

drop policy if exists "tipp torlese" on public.tips;
create policy "tipp torlese" on public.tips for delete to authenticated
  using (user_id = (select auth.uid()) and public.can_tip(match_id));

grant insert, update, delete on public.matches to authenticated;

drop policy if exists "szervezo uj meccs" on public.matches;
create policy "szervezo uj meccs" on public.matches for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists "szervezo modositas" on public.matches;
create policy "szervezo modositas" on public.matches for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "szervezo torles" on public.matches;
create policy "szervezo torles" on public.matches for delete to authenticated
  using ((select private.is_admin()) and not private.match_has_tips(id));

alter table public.matches drop constraint if exists matches_score_ok;
alter table public.matches add constraint matches_score_ok
  check ((score1 is null or score1 >= 0) and (score2 is null or score2 >= 0));

-- ---------- 5. Takarítás ----------
-- a belépéskor futó profil-függvényt csak az adatbázis hívhatja, a böngésző nem
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
-- régi, már nem használt függvények
drop function if exists public.my_own_matches();
drop function if exists public.is_own_match(text);
drop function if exists public.match_has_tips(text);

-- ellenőrzés: itt a d3lta4k sornak kell látszania
select a.note, p.display_name from public.admins a left join public.profiles p on p.id = a.user_id;
