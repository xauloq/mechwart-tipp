'use client';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase, DEMO, asset, loadPublic, loadMine, saveTip, signIn, isAdmin } from '../lib/supabase';
import { demoMatches, demoStats, demoBoard, demoUser, demoTips } from '../lib/demo';
import { MatchDay, SkeletonDay, dayKey, dayTitle, decidedOf, tipResult } from '../components/MatchRow';
import Board, { Avatar, CountUp, rankOf } from '../components/Board';
import Rules from '../components/Rules';
import { Login, Logout, Edit } from '../components/icons';
import { useReveal } from '../components/FX';
import Glass from '../components/Glass';
import Hero from '../components/Hero';
import Prize from '../components/Prize';

const TZ = 'Europe/Budapest';

function userFrom(session) {
  const u = session?.user;
  if (!u) return null;
  const m = u.user_metadata || {};
  return { id: u.id, name: m.custom_claims?.global_name || m.full_name || (m.name || '').replace(/#0$/, '') || 'Tippelő', avatar: m.avatar_url || null };
}

const TABS = [['meccsek', 'Meccsek'], ['eredmenyek', 'Eredmények'], ['ranglista', 'Ranglista'], ['szabalyok', 'Szabályok']];

export default function Page() {
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({});
  const [board, setBoard] = useState([]);
  const [tips, setTips] = useState({});
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('meccsek');
  const [game, setGame] = useState('all');
  const [now, setNow] = useState(() => Date.now());
  const [toasts, setToasts] = useState([]);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);

  const toast = useCallback((text, err = false) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, err }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const refreshPublic = useCallback(async () => {
    if (DEMO) return;
    try {
      const d = await loadPublic();
      setMatches(d.matches);
      setStats(Object.fromEntries(d.stats.map((s) => [s.match_id, s])));
      setBoard(d.board);
    } catch (e) { toast('Nem sikerült betölteni az adatokat. Próbáld újra később.', true); }
    setReady(true);
  }, [toast]);

  const refreshMine = useCallback(async () => {
    if (DEMO || !supabase) return;
    const d = await loadMine();
    setTips(Object.fromEntries(d.tips.map((t) => [t.match_id, t])));
  }, []);

  useEffect(() => {
    if (DEMO) {
      setMatches(demoMatches); setStats(Object.fromEntries(demoStats.map((s) => [s.match_id, s])));
      setBoard(demoBoard); setUser(demoUser); setTips(Object.fromEntries(demoTips.map((t) => [t.match_id, t])));
      setReady(true);
      return;
    }
    refreshPublic();
    supabase.auth.getSession().then(({ data }) => { const u = userFrom(data.session); setUser(u); if (u) { refreshMine(); isAdmin().then(setAdmin); } });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = userFrom(session); setUser(u);
      if (u) { refreshMine(); isAdmin().then(setAdmin); } else { setTips({}); setAdmin(false); }
    });
    const iv = setInterval(refreshPublic, 60000);
    const vis = () => document.visibilityState === 'visible' && refreshPublic();
    document.addEventListener('visibilitychange', vis);
    return () => { sub.subscription.unsubscribe(); clearInterval(iv); document.removeEventListener('visibilitychange', vis); };
  }, [refreshPublic, refreshMine]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const onPick = useCallback(async (matchId, pick, series) => {
    if (admin) { toast('Szervezőként nem tippelsz, így az eredmények beírása tisztességes marad.', true); return; }
    const m = matches.find((x) => x.id === matchId);
    const prev = tips[matchId];
    const next = { match_id: matchId, pick, series: series === undefined ? prev?.series ?? null : series };
    if (prev?.pick !== pick && series === null) next.series = null;
    setTips((t) => ({ ...t, [matchId]: next }));
    if (DEMO) { toast(`Mentve: ${pick === 1 ? m.team1 : m.team2}${next.series ? ` (${next.series})` : ''}`); return; }
    const err = await saveTip(matchId, pick, next.series);
    if (err) {
      setTips((t) => { const c = { ...t }; if (prev) c[matchId] = prev; else delete c[matchId]; return c; });
      toast(/row-level security|violates/i.test(err.message) ? 'Erre a meccsre már nem lehet tippelni.' : 'Nem sikerült menteni a tippet. Próbáld újra!', true);
      refreshPublic();
    } else {
      toast(`Mentve: ${pick === 1 ? m.team1 : m.team2}${next.series ? ` (${next.series})` : ''}`);
    }
  }, [matches, tips, toast, refreshPublic, admin]);

  const needLogin = useCallback(() => toast('A tippeléshez lépj be a Discord-fiókoddal!', true), [toast]);
  const login = async () => { if (DEMO) return toast('Demó mód: a belépéshez állítsd be a Supabase-t (lásd OLVASSEL).', true); const { error } = await signIn(); if (error) toast('A belépés nem sikerült.', true); };
  const logout = async () => { if (!DEMO) await supabase.auth.signOut(); };

  const shown = matches.filter((m) => game === 'all' || m.game === game);
  const byDay = (list) => {
    const g = new Map();
    for (const m of list) { const k = dayKey(m.kickoff); if (!g.has(k)) g.set(k, []); g.get(k).push(m); }
    return [...g.values()];
  };
  const days = byDay(shown.filter((m) => !decidedOf(m)));
  const pastDays = byDay(shown.filter(decidedOf).reverse());
  const results = matches.filter(decidedOf).map((m) => tipResult(m, tips[m.id])).filter(Boolean);
  const hits = results.filter((r) => r.ok).length;

  const me = rankOf(board, user?.id);
  useReveal([tab, game, matches.length, ready]);
  const myTips = Object.keys(tips).length;

  // fül-jelző
  const tabRefs = useRef({}); const [ind, setInd] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const el = tabRefs.current[tab]; if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab, ready]);

  // a lebegő fejléc csak görgetés után kap üveghátteret
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const f = () => setStuck(window.scrollY > 8);
    f(); addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);

  return (
    <>
      <Glass as="header" refract className={`top float${stuck ? ' stuck' : ''}`}>
        <div className="row">
          <div className="mark" />
          <div className="brand"><b>Tippverseny</b></div>
          <div className="sp" />
          {admin && <Link href="/admin/" className="btn ghost sm adm-link"><Edit size={16} /><span>Szervezés</span></Link>}
          {user ? (
            <div className="user">
              <Avatar name={user.name} url={user.avatar} />
              <span className="u-n">{user.name}</span>
              <button type="button" className="btn ghost sm ic" onClick={logout} aria-label="Kilépés"><Logout size={18} /></button>
            </div>
          ) : (
            <button type="button" className="btn sm" onClick={login}><Login size={17} /><span>Belépés<span className="hide-s"> Discorddal</span></span></button>
          )}
        </div>
      </Glass>

      <Hero matches={matches} tips={tips} stats={stats} user={user} now={now} ready={ready} onPick={onPick} onNeedLogin={needLogin} />

      <main className="wrap" id="tartalom">
        {DEMO && <div className="demo">Demó mód – kitalált adatok. A Supabase beállítása után itt az igazi meccsek és tippek látszanak.</div>}

        <section className="mebar rv" aria-label={user ? 'Saját állás' : 'Belépés'}>
          {user && admin ? (
            <p>Szervezőként nem tippelsz · <Link href="/admin/">Szervezői felület →</Link></p>
          ) : user ? (
            <p className="mine"><span><b><CountUp value={me?.points ?? 0} /></b> pont</span><span><b>{me ? `${me.rank}.` : '–'}</b> hely</span><span><b>{myTips}</b> tipp</span></p>
          ) : (
            <div className="join">
              <p>Tippelj a meccsekre, és legyél a szezon Tippkirálya.</p>
              <button type="button" className="btn" onClick={login}><Login size={18} /> Belépés Discorddal</button>
              <small>A belépéssel elfogadod a <Link href="/aszf/">részvételi szabályzatot</Link>.</small>
            </div>
          )}
        </section>

        <Prize />

        <Glass as="nav" refract depth={10} className="tabs float" role="tablist" aria-label="Oldalak">
          {TABS.map(([k, l]) => (
            <button key={k} ref={(el) => (tabRefs.current[k] = el)} type="button" role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
          ))}
          <span className="ind" style={{ left: ind.left, width: ind.width }} />
        </Glass>

        {(tab === 'meccsek' || tab === 'eredmenyek') && (
          <div className="chips" role="group" aria-label="Szűrés játék szerint">
            {[['all', 'Mind'], ['cs2', 'CS2'], ['lol', 'LoL']].map(([k, l]) => (
              <button key={k} type="button" className="chip" aria-pressed={game === k} onClick={() => setGame(k)}>{l}</button>
            ))}
          </div>
        )}

        {tab === 'meccsek' && (
          <section key="meccsek" className="pane">
            {!ready && <SkeletonDay />}
            {ready && days.length === 0 && <div className="empty">Most nincs nyitott meccs. A következő kör párosítása hamarosan érkezik.</div>}
            {days.map((list) => (
              <MatchDay key={dayKey(list[0].kickoff) + game} list={list} title={dayTitle(list[0].kickoff)} tips={tips} stats={stats} user={user} now={now} onPick={onPick} onNeedLogin={needLogin} />
            ))}
          </section>
        )}

        {tab === 'eredmenyek' && (
          <section key="eredmenyek" className="pane">
            {user && !admin && results.length > 0 && <p className="sum"><b>{hits}</b> találat <b>{results.length}</b> tippből</p>}
            {!ready && <SkeletonDay />}
            {ready && pastDays.length === 0 && <div className="empty">Még nincs lejátszott meccs.</div>}
            {pastDays.map((list) => (
              <MatchDay key={dayKey(list[0].kickoff) + game} result list={list} title={dayTitle(list[0].kickoff)} tips={tips} stats={stats} user={user} now={now} onPick={onPick} onNeedLogin={needLogin} />
            ))}
          </section>
        )}
        {tab === 'ranglista' && <div key="rl" className="pane"><Board board={board} me={user?.id} /></div>}
        {tab === 'szabalyok' && <div key="sz" className="pane"><Rules /><p className="rules-more"><Link href="/aszf/">Részvételi szabályzat és adatkezelés →</Link></p></div>}

        <footer className="footer">
          <a className="flogo" href="https://deac.hu/egyeb-szakosztalyok/deac-esport/" target="_blank" rel="noreferrer" title="DEAC E-sport"><img src={asset('/logok/deac.png')} alt="DEAC E-sport" /></a>
          <a className="flogo" href="https://unideb.hu/" target="_blank" rel="noreferrer" title="Debreceni Egyetem"><img src={asset('/logok/de.png')} alt="Debreceni Egyetem" /></a>
          <a className="flogo" href="https://www.dszcmechwart.hu/" target="_blank" rel="noreferrer" title="Debreceni SZC Mechwart András Gépipari és Informatikai Technikum"><img src={asset('/logok/gepipari.png')} alt="Debreceni SZC Mechwart András Gépipari és Informatikai Technikum" /></a>
          <span className="sp" />
          <span>Mechwart Esport Bajnokság · <a href="https://www.twitch.tv/mechwartesport" target="_blank" rel="noreferrer">twitch.tv/mechwartesport</a> · <a href="https://discord.gg/FYTkSyappx" target="_blank" rel="noreferrer">Discord</a> · <Link href="/aszf/">ÁSZF és adatkezelés</Link></span>
        </footer>
      </main>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast${t.err ? ' err' : ''}`}>{t.text}</div>)}
      </div>
    </>
  );
}
