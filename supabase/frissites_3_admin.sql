-- =====================================================================
--  MECHWART TIPPVERSENY – 3. frissítés: szervezői felület (mechwartesport.xyz/admin)
--  Supabase → SQL Editor → New query → az egész fájl bemásolva → Run
--
--  FONTOS: előtte lépj be egyszer az oldalra a d3lta4k Discord-fiókkal,
--  mert a script a már belépett fiókot teszi szervezővé.
--  A végén egy sornak kell megjelennie a d3lta4k névvel. Ha üres, lépj be,
--  és futtasd újra (többször is lefuttatható, nem ront el semmit).
-- =====================================================================

-- ---------- 1. Szervezők listája ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;   -- a böngészőből nem olvasható, nem írható

-- a belépett felhasználó szervező-e
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- van-e már tipp a meccsre (ilyen meccset nem lehet törölni, csak áttenni)
create or replace function public.match_has_tips(p_match text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tips t where t.match_id = p_match);
$$;
revoke all on function public.match_has_tips(text) from public, anon;
grant execute on function public.match_has_tips(text) to authenticated;

-- ---------- 2. Meccsek szerkesztése: csak szervező ----------
grant insert, update, delete on public.matches to authenticated;

drop policy if exists "szervezo uj meccs" on public.matches;
create policy "szervezo uj meccs" on public.matches for insert to authenticated
  with check (public.is_admin());

drop policy if exists "szervezo modositas" on public.matches;
create policy "szervezo modositas" on public.matches for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "szervezo torles" on public.matches;
create policy "szervezo torles" on public.matches for delete to authenticated
  using (public.is_admin() and not public.match_has_tips(id));

-- ép eredmény: nem negatív állás
alter table public.matches drop constraint if exists matches_score_ok;
alter table public.matches add constraint matches_score_ok
  check ((score1 is null or score1 >= 0) and (score2 is null or score2 >= 0));

-- ---------- 3. d3lta4k szervezővé tétele ----------
-- A Discord-azonosító alapján (auth.identities), amit a felhasználó maga nem tud átírni.
insert into public.admins (user_id, note)
select i.user_id, 'd3lta4k · Discord ID ' || coalesce(i.identity_data->>'provider_id', i.provider_id)
from auth.identities i
where i.provider = 'discord'
  and lower(regexp_replace(coalesce(i.identity_data->>'full_name', i.identity_data->>'name', ''), '#0$', '')) = 'd3lta4k'
on conflict (user_id) do nothing;

-- ellenőrzés: itt a d3lta4k sornak kell látszania
select a.note, p.display_name, a.created_at
from public.admins a left join public.profiles p on p.id = a.user_id;

-- =====================================================================
--  Később másik szervező hozzáadása (Discord-felhasználónévvel):
--    insert into public.admins (user_id, note)
--    select user_id, 'masiknev' from auth.identities
--    where provider = 'discord' and lower(identity_data->>'full_name') = 'masiknev';
--  Eltávolítás:
--    delete from public.admins where note like 'masiknev%';
-- =====================================================================
