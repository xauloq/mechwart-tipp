-- =====================================================================
--  MECHWART TIPPVERSENY – Supabase adatbázis
--  Futtatás: Supabase → SQL Editor → New query → az egész fájl bemásolva → Run
--  Többször is lefuttatható: a meglévő táblákat és adatokat nem törli.
--  UTÁNA MINDIG futtasd a frissites_4_biztonsag.sql-t is (biztonsági javítások + szervezői felület).
-- =====================================================================

-- ---------- 1. Táblák ----------
create table if not exists public.matches (
  id          text primary key,                         -- pl. cs-r1-105 (a MatchZy meccs-ID-val)
  game        text not null check (game in ('cs2','lol')),
  round       text not null,                            -- pl. 'Svájci 1. kör'
  format      text not null default 'Bo1',
  team1       text not null,
  team2       text not null,
  kickoff     timestamptz not null,                     -- eddig lehet tippelni
  points      int  not null default 1,                  -- jó győztes pontértéke (playoff: 2)
  exact_bonus int  not null default 0,                  -- pontos sorozatállás bónusz (playoff: 1)
  winner      smallint check (winner in (1,2)),         -- 1 = team1, 2 = team2, üres = még nincs eredmény
  score1      int,
  score2      int,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  username     text,                                    -- Discord felhasználónév (kisbetűvel)
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- a nevezési lista Discord-nevei (jelenleg nem korlátoz semmit, csak nyilvántartás)
create table if not exists public.team_members (
  game    text not null,
  team    text not null,
  discord text not null,
  primary key (game, team, discord)
);

create table if not exists public.tips (
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  match_id   text not null references public.matches(id) on delete cascade,
  pick       smallint not null check (pick in (1,2)),
  series     text check (series ~ '^[0-9]-[0-9]$'),     -- csak Bo3/Bo5: tippelt sorozatállás, pl. '2-1'
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

-- ---------- 2. Profil automatikusan a Discord-belépésből ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  u text;
begin
  u := regexp_replace(coalesce(m->>'user_name', m->>'name', m->>'full_name', ''), '#0$', '');
  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, lower(u), coalesce(m->'custom_claims'->>'global_name', m->>'full_name', u), m->>'avatar_url')
  on conflict (id) do update
    set username = excluded.username, display_name = excluded.display_name, avatar_url = excluded.avatar_url;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists tips_touch on public.tips;
create trigger tips_touch before update on public.tips
  for each row execute function public.touch_updated_at();

-- ---------- 3. Szabályok ----------
-- a belépett felhasználó játszik-e az adott meccsen
create or replace function public.is_own_match(p_match text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.matches m
    join public.team_members t on t.game = m.game and t.team in (m.team1, m.team2)
    join public.profiles p on p.id = auth.uid()
    where m.id = p_match
      and (t.discord = p.username or t.discord = lower(p.display_name))
  );
$$;

-- lehet-e még tippelni: a kezdés előtt, amíg nincs eredmény (a saját csapatára is bárki tippelhet)
create or replace function public.can_tip(p_match text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.matches m
                 where m.id = p_match and m.kickoff > now() and m.winner is null);
$$;

-- a belépett felhasználó saját meccsei (a weboldal ezeket szürkén mutatja)
create or replace function public.my_own_matches()
returns setof text language sql stable security definer set search_path = '' as $$
  select m.id from public.matches m where public.is_own_match(m.id);
$$;
revoke all on function public.my_own_matches() from public, anon;
grant execute on function public.my_own_matches() to authenticated;

alter table public.matches      enable row level security;
alter table public.profiles     enable row level security;
alter table public.team_members enable row level security;
alter table public.tips         enable row level security;

drop policy if exists "meccsek mindenkinek" on public.matches;
create policy "meccsek mindenkinek" on public.matches for select to anon, authenticated using (true);

drop policy if exists "profilok mindenkinek" on public.profiles;
create policy "profilok mindenkinek" on public.profiles for select to anon, authenticated using (true);

-- team_members: nincs policy → a böngészőből nem olvasható
revoke all on public.team_members from anon, authenticated;

drop policy if exists "sajat tippek olvasasa" on public.tips;
create policy "sajat tippek olvasasa" on public.tips for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "tipp leadasa" on public.tips;
create policy "tipp leadasa" on public.tips for insert to authenticated
  with check (user_id = auth.uid() and public.can_tip(match_id));

drop policy if exists "tipp modositasa" on public.tips;
create policy "tipp modositasa" on public.tips for update to authenticated
  using (user_id = auth.uid() and public.can_tip(match_id))
  with check (user_id = auth.uid() and public.can_tip(match_id));

drop policy if exists "tipp torlese" on public.tips;
create policy "tipp torlese" on public.tips for delete to authenticated
  using (user_id = auth.uid() and public.can_tip(match_id));

-- ---------- 4. Ranglista és tipp-megoszlás ----------
-- (a nézetek a tulajdonos jogával futnak, így csak összesített adatot adnak ki)
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
having count(*) filter (where m.winner is not null) > 0;   -- csak akinek már van kiértékelt tippje

create or replace view public.tip_stats as
select m.id as match_id,
       count(t.match_id)::int as total,
       case when m.kickoff <= now() then count(*) filter (where t.pick = 1)::int end as pick1,
       case when m.kickoff <= now() then count(*) filter (where t.pick = 2)::int end as pick2
from public.matches m
left join public.tips t on t.match_id = m.id
group by m.id, m.kickoff;

grant select on public.leaderboard, public.tip_stats to anon, authenticated;

-- ---------- 5. Adatok: 1. kör (CS2) és 1. forduló (LoL) ----------
insert into public.matches (id, game, round, format, team1, team2, kickoff, points) values
  ('cs-r1-105', 'cs2', 'Svájci 1. kör', 'Bo1', 'Musor drop', 'MC Isti Fan Club', '2026-11-06 18:20:00+01', 1),
  ('cs-r1-106', 'cs2', 'Svájci 1. kör', 'Bo1', 'knb miracles', 'One Tooth Team', '2026-11-06 19:35:00+01', 1),
  ('cs-r1-103', 'cs2', 'Svájci 1. kör', 'Bo1', 'Tel-Aviv ESL', 'Perui pánsíposok', '2026-11-07 17:00:00+01', 1),
  ('cs-r1-101', 'cs2', 'Svájci 1. kör', 'Bo1', 'Rumogló FC', 'NSG', '2026-11-08 16:00:00+01', 1),
  ('cs-r1-104', 'cs2', 'Svájci 1. kör', 'Bo1', 'ANF', 'PatyiShock', '2026-11-08 17:15:00+01', 1),
  ('cs-r1-102', 'cs2', 'Svájci 1. kör', 'Bo1', 'drift', 'Spray & Pray (S&P)', '2026-11-08 18:30:00+01', 1),
  ('cs-r1-107', 'cs2', 'Svájci 1. kör', 'Bo1', 'ÜssFuss!', 'CCNA Certified Fraggers', '2026-11-08 19:45:00+01', 1),
  ('lol-b1-paladins', 'lol', 'B csoport · 1. forduló', 'Bo1', 'Paladins', 'konzolkábel', '2026-11-14 17:00:00+01', 1),
  ('lol-b1-l9', 'lol', 'B csoport · 1. forduló', 'Bo1', 'L9', 'Zenith', '2026-11-15 17:00:00+01', 1),
  ('lol-a1-minipajtik', 'lol', 'A csoport · 1. forduló', 'Bo1', 'Minipajtik', 'Enable secret', '2026-11-15 18:00:00+01', 1),
  ('lol-a1-elo', 'lol', 'A csoport · 1. forduló', 'Bo1', 'Elo Inflated', 'runitdown', '2026-11-15 19:00:00+01', 1)
on conflict (id) do update set
  round = excluded.round, format = excluded.format, team1 = excluded.team1, team2 = excluded.team2,
  kickoff = excluded.kickoff, points = excluded.points;

insert into public.team_members (game, team, discord) values
('cs2','Musor drop','itob.'),
('cs2','Musor drop','thángosz'),
('cs2','Musor drop','kisspatrik0809'),
('cs2','Musor drop','kr1sykhee'),
('cs2','Musor drop','ferkatsu'),
('cs2','Musor drop','mr_fóka'),
('cs2','Musor drop','fulkrum.'),
('cs2','ANF','davx'),
('cs2','ANF','hörcsög'),
('cs2','ANF','zotyaa'),
('cs2','ANF','cheesecakekf'),
('cs2','ANF','shadow'),
('cs2','ANF','fire201111'),
('cs2','PatyiShock','robeey0913'),
('cs2','PatyiShock','zoli0217'),
('cs2','PatyiShock','eagl18'),
('cs2','PatyiShock','daniel_free'),
('cs2','PatyiShock','bigamer69'),
('cs2','PatyiShock','acsqty'),
('cs2','MC Isti Fan Club','zsolvi56'),
('cs2','MC Isti Fan Club','z3tike'),
('cs2','MC Isti Fan Club','regar111_'),
('cs2','MC Isti Fan Club','bonyee'),
('cs2','MC Isti Fan Club','milanvok._.'),
('cs2','MC Isti Fan Club','yoshiki68'),
('cs2','Tel-Aviv ESL','treviscock'),
('cs2','Tel-Aviv ESL','mate'),
('cs2','Tel-Aviv ESL','arthashun'),
('cs2','Tel-Aviv ESL','miskamestr'),
('cs2','Tel-Aviv ESL','hosszunev'),
('cs2','NSG','nsg saman'),
('cs2','NSG','nsg tekergo'),
('cs2','NSG','nsg matyi'),
('cs2','NSG','nsg koti'),
('cs2','NSG','nsg monster enjoyer'),
('cs2','NSG','.9txe'),
('cs2','NSG','cld_5'),
('cs2','Rumogló FC','terciusz'),
('cs2','Rumogló FC','komoyl'),
('cs2','Rumogló FC','bencehun1'),
('cs2','Rumogló FC','londboy'),
('cs2','Rumogló FC','r0l1'),
('cs2','Rumogló FC','_sass_'),
('cs2','CCNA Certified Fraggers','tarni'),
('cs2','CCNA Certified Fraggers','stephanop28'),
('cs2','CCNA Certified Fraggers','demon'),
('cs2','CCNA Certified Fraggers','nviktor'),
('cs2','CCNA Certified Fraggers','hans'),
('cs2','Perui pánsíposok','finfiassist'),
('cs2','Perui pánsíposok','ddani'),
('cs2','Perui pánsíposok','corleone'),
('cs2','Perui pánsíposok','benjyfv'),
('cs2','Perui pánsíposok','cryox'),
('cs2','knb miracles','miracle'),
('cs2','knb miracles','koxy'),
('cs2','knb miracles','pacal feri'),
('cs2','knb miracles','peterfi'),
('cs2','knb miracles','totenkopf'),
('cs2','knb miracles','bazsi_gaming'),
('cs2','ÜssFuss!','ago'),
('cs2','ÜssFuss!','abya'),
('cs2','ÜssFuss!','z4andorz4'),
('cs2','ÜssFuss!','gerikehh'),
('cs2','ÜssFuss!','billionaire'),
('cs2','One Tooth Team','babbalázs'),
('cs2','One Tooth Team','milka'),
('cs2','One Tooth Team','batman'),
('cs2','One Tooth Team','szultán'),
('cs2','One Tooth Team','jonkler'),
('cs2','Spray & Pray (S&P)','libero'),
('cs2','Spray & Pray (S&P)','madveeee.'),
('cs2','Spray & Pray (S&P)','najdzsi'),
('cs2','Spray & Pray (S&P)','micu'),
('cs2','Spray & Pray (S&P)','xtenet7'),
('cs2','Spray & Pray (S&P)','vinecz'),
('cs2','Spray & Pray (S&P)','abeeel'),
('cs2','drift','summertime'),
('cs2','drift','marci.'),
('cs2','drift','rossi'),
('cs2','drift','gaber'),
('cs2','drift','zaqrol'),
('lol','Zenith','janos_ez'),
('lol','Zenith','__levy__'),
('lol','Zenith','harcimarci12'),
('lol','Zenith','zolikaaa123'),
('lol','Zenith','snickers0740'),
('lol','Zenith','knyghtzy'),
('lol','L9','kopitijr'),
('lol','L9','nincsnevem'),
('lol','L9','sbalazs99'),
('lol','L9','bdkillerhun'),
('lol','L9','kr1sykhee'),
('lol','L9','zamatos123'),
('lol','L9','fulkrum.'),
('lol','Enable secret','csongor480'),
('lol','Enable secret','qtyafarka'),
('lol','Enable secret','bundaskenyer911'),
('lol','Enable secret','rambeszz'),
('lol','Enable secret','gerimester3682'),
('lol','konzolkábel','zsolvi56'),
('lol','konzolkábel','yoshiki'),
('lol','konzolkábel','kaoru0_0'),
('lol','konzolkábel','regar111_'),
('lol','konzolkábel','yenkee_e'),
('lol','Paladins','david4463'),
('lol','Paladins','bercoo4354'),
('lol','Paladins','matekinggg1370'),
('lol','Paladins','bence3324'),
('lol','Paladins','tomixd6170'),
('lol','Elo Inflated','promerga'),
('lol','Elo Inflated','walkr4246'),
('lol','Elo Inflated','the_dangerous_salad'),
('lol','Elo Inflated','makayadam'),
('lol','Elo Inflated','csabattya'),
('lol','Minipajtik','therealbt'),
('lol','Minipajtik','beny0.'),
('lol','Minipajtik','tetyaaa'),
('lol','Minipajtik','kockamen123'),
('lol','Minipajtik','akos_'),
('lol','runitdown','domi4568'),
('lol','runitdown','danisa7281'),
('lol','runitdown','regularmill8'),
('lol','runitdown','gerikesz'),
('lol','runitdown','2602692')
on conflict do nothing;

-- =====================================================================
--  EREDMÉNY BEÍRÁSA (meccs után) – SQL Editorban, vagy a Table Editorban a matches táblában:
--    update public.matches set winner = 1, score1 = 13, score2 = 9 where id = 'cs-r1-105';
--  (winner: 1 = az első csapat nyert, 2 = a második)
--
--  ÚJ MECCS (következő kör):
--    insert into public.matches (id, game, round, format, team1, team2, kickoff, points)
--    values ('cs-r2-201', 'cs2', 'Svájci 2. kör', 'Bo1', 'A csapat', 'B csapat', '2026-11-20 18:00+01', 1);
--  Playoff (Bo3): points = 2, exact_bonus = 1
-- =====================================================================
