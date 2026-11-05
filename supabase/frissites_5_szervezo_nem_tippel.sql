-- =====================================================================
--  MECHWART TIPPVERSENY – 5. frissítés: a szervezők nem vesznek részt a tippversenyben
--  Supabase → SQL Editor → New query → az egész fájl bemásolva → Run
--  (a 4. frissítés után; többször is lefuttatható)
--
--  Aki az admins táblában van (most: d3lta4k):
--   • nem tud tippet leadni vagy módosítani,
--   • nem jelenik meg a ranglistán,
--   • a tippmegoszlásba sem számít bele,
--   • az eddigi tippjei törlődnek.
-- =====================================================================

-- szervező-e egy adott felhasználó (a ranglistához és a megoszláshoz)
create or replace function private.is_admin_user(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = p_user);
$$;
revoke all on function private.is_admin_user(uuid) from public;

-- ---------- tippelés: szervezőnek tilos ----------
drop policy if exists "tipp leadasa" on public.tips;
create policy "tipp leadasa" on public.tips for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_tip(match_id) and not (select private.is_admin()));

drop policy if exists "tipp modositasa" on public.tips;
create policy "tipp modositasa" on public.tips for update to authenticated
  using (user_id = (select auth.uid()) and public.can_tip(match_id) and not (select private.is_admin()))
  with check (user_id = (select auth.uid()) and public.can_tip(match_id) and not (select private.is_admin()));

-- ---------- ranglista és megoszlás: szervező nélkül ----------
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
  where not private.is_admin_user(p.id)
  group by p.id
  having count(*) filter (where m.winner is not null) > 0;
$$;

create or replace function private.tip_stats()
returns table (match_id text, total int, pick1 int, pick2 int)
language sql stable security definer set search_path = '' as $$
  select m.id,
         count(t.match_id)::int,
         case when m.kickoff <= now() then (count(*) filter (where t.pick = 1))::int end,
         case when m.kickoff <= now() then (count(*) filter (where t.pick = 2))::int end
  from public.matches m
  left join public.tips t on t.match_id = m.id and not private.is_admin_user(t.user_id)
  group by m.id, m.kickoff;
$$;

-- ---------- a szervezők eddigi tippjei törlődnek ----------
delete from public.tips t using public.admins a where a.user_id = t.user_id;

-- ellenőrzés: a szervezők és a megmaradt tippjeik száma (0 kell legyen)
select a.note, (select count(*) from public.tips t where t.user_id = a.user_id) as tippek
from public.admins a;
