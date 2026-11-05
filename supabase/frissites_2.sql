-- =====================================================================
--  MECHWART TIPPVERSENY – 2. frissítés (nov. 5.)
--  Supabase → SQL Editor → New query → bemásol → Run
--  1) mindenki tippelhet a saját csapatára is
--  2) a ranglistán csak az látszik, akinek már van kiértékelt tippje
-- =====================================================================
create or replace function public.can_tip(p_match text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.matches m
                 where m.id = p_match and m.kickoff > now() and m.winner is null);
$$;

create or replace view public.leaderboard as
select p.id as user_id,
       coalesce(nullif(p.display_name, ''), p.username) as name,
       p.avatar_url,
       coalesce(sum(case when m.winner is not null and t.pick = m.winner
                         then m.points + case when m.exact_bonus > 0 and t.series = m.score1 || '-' || m.score2
                                              then m.exact_bonus else 0 end
                         else 0 end), 0)::int as points,
       count(*) filter (where m.winner is not null and t.pick = m.winner)::int as correct,
       count(*) filter (where m.winner is not null)::int as decided,
       count(t.match_id)::int as tips
from public.profiles p
join public.tips t on t.user_id = p.id
join public.matches m on m.id = t.match_id
group by p.id
having count(*) filter (where m.winner is not null) > 0;

grant select on public.leaderboard to anon, authenticated;
