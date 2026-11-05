'use client';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { supabase, DEMO, asset, loadPublic, loadMine, saveTip, signIn } from '../lib/supabase';
import { demoMatches, demoStats, demoBoard, demoUser, demoTips } from '../lib/demo';
import MatchCard from '../components/MatchCard';
import Board, { Avatar, CountUp, ranked } from '../components/Board';
import Rules from '../components/Rules';
import { Login, Logout, Chev } from '../components/icons';
import { Particles, Spotlight, burst, useReveal } from '../components/FX';
import Prize from '../components/Prize';
import Ticker from '../components/Ticker';
import { Countdown } from '../components/Roll';

const TZ = 'Europe/Budapest';
const dayKey = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ });
const dayName = (iso) => new Date(iso).toLocaleDateString('hu-HU', { weekday: 'long', timeZone: TZ });
const dayDate = (iso) => new Date(iso).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', timeZone: TZ });

function userFrom(session) {
  const u = session?.user;
  if (!u) return null;
  const m = u.user_metadata || {};
  return { id: u.id, name: m.custom_claims?.global_name || m.full_name || (m.name || '').replace(/#0$/, '') || 'Tippelő', avatar: m.avatar_url || null };
}

const TABS = [['tippek', 'Tippek'], ['ranglista', 'Ranglista'], ['szabalyok', 'Szabályok']];

export default function Page() {
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({});
  const [board, setBoard] = useState([]);
  const [tips, setTips] = useState({});
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('tippek');
  const [game, setGame] = useState('all');
  const [now, setNow] = useState(() => Date.now());
  const [toasts, setToasts] = useState([]);
  const [ready, setReady] = useState(false);

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
    supabase.auth.getSession().then(({ data }) => { const u = userFrom(data.session); setUser(u); if (u) refreshMine(); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = userFrom(session); setUser(u);
      if (u) refreshMine(); else setTips({});
    });
    const iv = setInterval(refreshPublic, 60000);
    const vis = () => document.visibilityState === 'visible' && refreshPublic();
    document.addEventListener('visibilitychange', vis);
    return () => { sub.subscription.unsubscribe(); clearInterval(iv); document.removeEventListener('visibilitychange', vis); };
  }, [refreshPublic, refreshMine]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const onPick = useCallback(async (matchId, pick, series, at) => {
    const m = matches.find((x) => x.id === matchId);
    const prev = tips[matchId];
    const next = { match_id: matchId, pick, series: series === undefined ? prev?.series ?? null : series };
    if (prev?.pick !== pick && series === null) next.series = null;
    setTips((t) => ({ ...t, [matchId]: next }));
    const party = () => at && burst(at.x, at.y, pick === 1 ? ['#ec1e24', '#ff5a5f', '#ffffff', '#ffcf4a'] : ['#2f6fd6', '#79a8ff', '#ffffff', '#ffcf4a']);
    if (DEMO) { party(); toast(`Tipp mentve: ${pick === 1 ? m.team1 : m.team2}${next.series ? ` (${next.series})` : ''}`); return; }
    const err = await saveTip(matchId, pick, next.series);
    if (err) {
      setTips((t) => { const c = { ...t }; if (prev) c[matchId] = prev; else delete c[matchId]; return c; });
      toast(/row-level security|violates/i.test(err.message) ? 'Erre a meccsre már nem lehet tippelni.' : 'Nem sikerült menteni a tippet. Próbáld újra!', true);
      refreshPublic();
    } else {
      party();
      toast(`Tipp mentve: ${pick === 1 ? m.team1 : m.team2}${next.series ? ` (${next.series})` : ''}`);
    }
  }, [matches, tips, toast, refreshPublic]);

  const needLogin = useCallback(() => toast('A tippeléshez lépj be a Discord-fiókoddal!', true), [toast]);
  const login = async () => { if (DEMO) return toast('Demó mód: a belépéshez állítsd be a Supabase-t (lásd OLVASSEL).', true); const { error } = await signIn(); if (error) toast('A belépés nem sikerült.', true); };
  const logout = async () => { if (!DEMO) await supabase.auth.signOut(); };

  const shown = matches.filter((m) => game === 'all' || m.game === game);
  const upcoming = shown.filter((m) => !(m.winner === 1 || m.winner === 2));
  const past = shown.filter((m) => m.winner === 1 || m.winner === 2).reverse();
  const days = useMemo(() => {
    const g = new Map();
    for (const m of upcoming) { const k = dayKey(m.kickoff); if (!g.has(k)) g.set(k, []); g.get(k).push(m); }
    return [...g.values()];
  }, [upcoming]);

  const me = user ? ranked(board).find((r) => r.user_id === user.id) : null;
  const nextOpen = matches.find((m) => !(m.winner === 1 || m.winner === 2) && new Date(m.kickoff).getTime() > now);
  const ticker = matches.filter((m) => !(m.winner === 1 || m.winner === 2) && new Date(m.kickoff).getTime() > now - 3 * 3600000);
  useReveal([tab, game, matches.length, ready]);
  const myTips = Object.keys(tips).length;

  // fül-jelző
  const tabRefs = useRef({}); const [ind, setInd] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const el = tabRefs.current[tab]; if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab, ready]);

  let n = 0;
  return (
    <>
      <div className="fxw" aria-hidden="true"><Particles /><Spotlight /></div>
      <header className="top">
        <div className="row">
          <div className="mark" />
          <div className="brand"><small>MECHWART</small><b>Tippverseny</b></div>
          <div className="sp" />
          {user ? (
            <div className="user">
              <Avatar name={user.name} url={user.avatar} />
              <span>{user.name}</span>
              <button type="button" className="btn ghost" onClick={logout} aria-label="Kilépés"><Logout size={18} /></button>
            </div>
          ) : (
            <button type="button" className="btn" onClick={login}><Login size={18} /> Belépés Discorddal</button>
          )}
        </div>
      </header>

      <main className="wrap">
        {DEMO && <div className="demo in">Demó mód – kitalált adatok. A Supabase beállítása után itt az igazi meccsek és tippek látszanak.</div>}

        <section className="hero">
          <div className="hero-l">
            <div className="kick in" style={{ '--i': 0 }}>CS2 · LEAGUE OF LEGENDS</div>
            <h1><span className="ttl-w"><span className="sweep">Tippverseny</span><span className="ttl-u" aria-hidden="true" /></span></h1>
            <p className="in" style={{ '--i': 2 }}>Tippelj a Mechwart Esport Bajnokság meccseire, gyűjtsd a pontokat, és legyél te a szezon <b className="gold">Tippkirálya</b>!</p>
            {user ? (
              <div className="stats">
                <div className="stat in" style={{ '--i': 3 }}><b><CountUp value={me?.points ?? 0} /></b><span>Pontod</span></div>
                <div className="stat in" style={{ '--i': 4 }}><b>{me ? `${me.rank}.` : '–'}</b><span>Helyezés</span></div>
                <div className="stat in" style={{ '--i': 5 }}><b><CountUp value={myTips} /></b><span>Tipped</span></div>
              </div>
            ) : (
              <div className="cta in" style={{ '--i': 3 }}>
                <button type="button" className="btn big" onClick={login}><Login size={20} /> Belépés Discorddal</button>
                <span>Egy kattintás – csak a nevedet és a profilképedet látjuk. A belépéssel elfogadod a <Link href="/aszf/">részvételi szabályzatot és az adatkezelést</Link>.</span>
              </div>
            )}
          </div>
          <Prize />
        </section>

        {nextOpen && <Countdown ms={new Date(nextOpen.kickoff).getTime() - now} label="KÖVETKEZŐ TIPPZÁRÁS" sub={`${nextOpen.team1} – ${nextOpen.team2}`} />}
        <Ticker matches={ticker} />

        <nav className="tabs" role="tablist" aria-label="Oldalak">
          {TABS.map(([k, l]) => (
            <button key={k} ref={(el) => (tabRefs.current[k] = el)} type="button" role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
          ))}
          <span className="ind" style={{ left: ind.left, width: ind.width }} />
        </nav>

        {tab === 'tippek' && (
          <section key="tippek" className="pane">
            <div className="chips" role="group" aria-label="Szűrés játék szerint">
              {[['all', 'Mind'], ['cs2', 'CS2'], ['lol', 'LoL']].map(([k, l]) => (
                <button key={k} type="button" className="chip" aria-pressed={game === k} onClick={() => setGame(k)}>{l}</button>
              ))}
            </div>
            {ready && days.length === 0 && <div className="empty in">Most nincs nyitott meccs. A következő kör párosítása hamarosan érkezik!</div>}
            {days.map((list) => (
              <div className="day" key={dayKey(list[0].kickoff) + game}>
                <div className="dh rv"><h2>{dayName(list[0].kickoff)}</h2><span>{dayDate(list[0].kickoff)}</span></div>
                <div className="grid">
                  {list.map((m) => (
                    <MatchCard key={m.id} i={n++} m={m} tip={tips[m.id]} stat={stats[m.id]} user={user} now={now} onPick={onPick} onNeedLogin={needLogin} />
                  ))}
                </div>
              </div>
            ))}
            {past.length > 0 && (
              <details className="past">
                <summary><Chev size={18} /> Lejátszott meccsek ({past.length})</summary>
                <div className="grid">
                  {past.map((m, i) => (
                    <MatchCard key={m.id} i={i} m={m} tip={tips[m.id]} stat={stats[m.id]} user={user} now={now} onPick={onPick} onNeedLogin={needLogin} />
                  ))}
                </div>
              </details>
            )}
          </section>
        )}
        {tab === 'ranglista' && <div key="rl" className="pane"><Board board={board} me={user?.id} /></div>}
        {tab === 'szabalyok' && <div key="sz" className="pane"><Rules /><p className="rules-more">A teljes részvételi szabályzat és az adatkezelési tájékoztató: <Link href="/aszf/">ÁSZF és adatkezelés →</Link></p></div>}

        <footer className="footer">
          <img src={asset('/logok/deac.png')} alt="DEAC E-sport" />
          <img src={asset('/logok/de.png')} alt="Debreceni Egyetem" />
          <img src={asset('/logok/gepipari.png')} alt="Gépipari" />
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
