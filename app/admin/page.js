'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, DEMO, signIn, isAdmin, adminInsert, adminUpdate, adminDelete, adminRename } from '../../lib/supabase';
import { demoMatches, demoStats, demoUser } from '../../lib/demo';
import { toLocalInput, fromLocalInput, fmtLong } from '../../lib/time';
import { Avatar } from '../../components/Board';
import { Login, Logout, Edit, Plus, Trash, Refresh, Check } from '../../components/icons';

const decided = (m) => m.winner === 1 || m.winner === 2;
const wins = (f) => (f === 'Bo5' ? 3 : f === 'Bo3' ? 2 : 0);
const status = (m, now) => (decided(m) ? 'kesz' : new Date(m.kickoff).getTime() <= now ? 'var' : 'kozelgo');
const STATUS = { var: 'Eredményre vár', kozelgo: 'Közelgő', kesz: 'Lezárva' };
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);

function userFrom(session) {
  const u = session?.user;
  if (!u) return null;
  const m = u.user_metadata || {};
  return { id: u.id, name: m.custom_claims?.global_name || m.full_name || (m.name || '').replace(/#0$/, ''), avatar: m.avatar_url || null };
}

function checkResult(m, w, s1, s2) {
  if (w !== 1 && w !== 2) return 'Válaszd ki a győztest.';
  if ((s1 === '') !== (s2 === '')) return 'Mindkét állást írd be, vagy egyiket se.';
  const n = wins(m.format);
  if (n && s1 === '') return `${m.format} meccsnél add meg a sorozatállást is (pl. ${n}–${n - 1}), mert a pontos tipp ezen múlik.`;
  if (s1 !== '') {
    const a = Number(s1), b = Number(s2);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) return 'Az állás csak nem negatív egész szám lehet.';
    const ws = w === 1 ? a : b, ls = w === 1 ? b : a;
    if (ws <= ls) return 'A győztesnek több pontja kell legyen, mint a vesztesnek.';
    if (n && (ws !== n || ls >= n)) return `${m.format} meccsen a győztes ${n} nyert pályával zár (pl. ${n}–0 vagy ${n}–${n - 1}).`;
  }
  return null;
}

// ---------- egy meccs: eredmény beírása ----------
function AdminMatch({ m, stat, now, onSave, onEdit, onDelete }) {
  const st = status(m, now);
  const [w, setW] = useState(m.winner ?? null);
  const [s1, setS1] = useState(m.score1 ?? '');
  const [s2, setS2] = useState(m.score2 ?? '');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  useEffect(() => { setW(m.winner ?? null); setS1(m.score1 ?? ''); setS2(m.score2 ?? ''); setErr(null); }, [m.winner, m.score1, m.score2]);

  const score = (i, v) => {
    v = v.replace(/[^0-9]/g, '').slice(0, 2);
    const a = i === 1 ? v : String(s1), b = i === 2 ? v : String(s2);
    i === 1 ? setS1(v) : setS2(v);
    if (a !== '' && b !== '' && +a !== +b) setW(+a > +b ? 1 : 2);
    setErr(null);
  };
  const dirty = w !== (m.winner ?? null) || String(s1) !== String(m.score1 ?? '') || String(s2) !== String(m.score2 ?? '');
  const tips = stat?.total ?? 0;

  const save = async () => {
    const e = checkResult(m, w, String(s1), String(s2));
    if (e) return setErr(e);
    setBusy(true);
    await onSave(m, { winner: w, score1: s1 === '' ? null : +s1, score2: s2 === '' ? null : +s2 });
    setBusy(false);
  };
  const clear = async () => { setBusy(true); await onSave(m, { winner: null, score1: null, score2: null }, true); setBusy(false); };

  return (
    <article className={`am ${st}`}>
      <div className="am-top">
        <span className={`tag ${m.game}`}>{m.game === 'cs2' ? 'CS2' : 'LOL'}</span>
        <span className="round">{m.round} · {m.format}</span>
        <span className={`am-badge ${st}`}>{STATUS[st]}</span>
        <span className="sp" />
        <span className="am-when">{fmtLong(m.kickoff)}</span>
      </div>
      <div className="am-res">
        <button type="button" className="am-team" aria-pressed={w === 1} onClick={() => { setW(1); setErr(null); }}>
          {w === 1 && <Check size={18} />}<span>{m.team1}</span>
        </button>
        <div className="am-sc">
          <input inputMode="numeric" aria-label={`${m.team1} pontja`} value={s1} onChange={(e) => score(1, e.target.value)} placeholder="–" />
          <i>:</i>
          <input inputMode="numeric" aria-label={`${m.team2} pontja`} value={s2} onChange={(e) => score(2, e.target.value)} placeholder="–" />
        </div>
        <button type="button" className="am-team r" aria-pressed={w === 2} onClick={() => { setW(2); setErr(null); }}>
          <span>{m.team2}</span>{w === 2 && <Check size={18} />}
        </button>
      </div>
      {err && <p className="am-err" role="alert">{err}</p>}
      <div className="am-act">
        <button type="button" className="btn sm green" disabled={!dirty || busy} onClick={save}>{decided(m) ? 'Eredmény javítása' : 'Eredmény mentése'}</button>
        {decided(m) && <button type="button" className="btn sm ghost" disabled={busy} onClick={clear}>Eredmény visszavonása</button>}
        <span className="sp" />
        <span className="am-meta">{tips} tipp · <code>{m.id}</code></span>
        <button type="button" className="btn sm ghost" onClick={() => onEdit(m)}><Edit size={16} /> Szerkesztés</button>
        {tips === 0 && (sure
          ? <button type="button" className="btn sm danger" onClick={() => onDelete(m)}>Biztosan törlöd?</button>
          : <button type="button" className="btn sm ghost" onClick={() => { setSure(true); setTimeout(() => setSure(false), 4000); }} aria-label="Meccs törlése"><Trash size={16} /></button>)}
      </div>
    </article>
  );
}

// ---------- új meccs / meccs szerkesztése ----------
function MatchForm({ initial, matches, tips, onSubmit, onCancel }) {
  const isNew = !initial;
  const [f, setF] = useState(() => initial
    ? { ...initial, kickoff: toLocalInput(initial.kickoff) }
    : { id: '', game: 'cs2', round: '', format: 'Bo1', team1: '', team2: '', kickoff: '', points: 1, exact_bonus: 0 });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setErr(null); };
  const teams = useMemo(() => [...new Set(matches.filter((m) => m.game === f.game).flatMap((m) => [m.team1, m.team2]))].sort((a, b) => a.localeCompare(b, 'hu')), [matches, f.game]);
  const rounds = useMemo(() => [...new Set(matches.filter((m) => m.game === f.game).map((m) => m.round))], [matches, f.game]);
  const playoff = +f.points === 2 && +f.exact_bonus === 1;
  const basic = +f.points === 1 && +f.exact_bonus === 0;

  const submit = async (e) => {
    e.preventDefault();
    const t1 = f.team1.trim(), t2 = f.team2.trim(), rd = f.round.trim();
    if (!rd || !t1 || !t2) return setErr('Add meg a kört és mindkét csapatot.');
    if (t1.toLowerCase() === t2.toLowerCase()) return setErr('A két csapat nem lehet ugyanaz.');
    const kickoff = fromLocalInput(f.kickoff);
    if (!kickoff) return setErr('Add meg a kezdés dátumát és idejét.');
    const pts = Number(f.points), bon = Number(f.exact_bonus);
    if (!Number.isInteger(pts) || pts < 0 || !Number.isInteger(bon) || bon < 0) return setErr('A pontok csak nem negatív egész számok lehetnek.');
    let id = f.id.trim();
    if (isNew) {
      if (!id) {
        const b = `${f.game}-${slug(rd) || 'kor'}-${slug(t1) || 'meccs'}`;
        id = b; let k = 2;
        while (matches.some((m) => m.id === id)) id = `${b}-${k++}`;
      } else if (matches.some((m) => m.id === id)) return setErr('Ilyen azonosítójú meccs már van.');
    }
    const row = { game: f.game, round: rd, format: f.format, team1: t1, team2: t2, kickoff, points: pts, exact_bonus: bon };
    setBusy(true);
    const ok = await onSubmit(isNew ? { id, ...row } : row, initial);
    setBusy(false);
    if (ok) onCancel();
  };

  return (
    <form className="adm-panel af in" onSubmit={submit}>
      <h2>{isNew ? 'Új meccs' : `Szerkesztés: ${initial.team1} – ${initial.team2}`}</h2>
      {!isNew && tips > 0 && <p className="adm-note full">Erre a meccsre már {tips} tipp érkezett. A két csapat sorrendjét ne cseréld fel, mert a tippek a helyhez (1. / 2. csapat) tartoznak. Az időpontot nyugodtan módosíthatod: a tippzárás az új kezdéshez igazodik.</p>}
      <div className="af-g">
        <label>Játék
          <span className="seg">{[['cs2', 'CS2'], ['lol', 'LoL']].map(([k, l]) => <button key={k} type="button" aria-pressed={f.game === k} onClick={() => set('game', k)}>{l}</button>)}</span>
        </label>
        <label>Formátum
          <span className="seg">{['Bo1', 'Bo3', 'Bo5'].map((k) => <button key={k} type="button" aria-pressed={f.format === k} onClick={() => set('format', k)}>{k}</button>)}</span>
        </label>
        <label className="full">Kör / forduló
          <input list="adm-rounds" value={f.round} onChange={(e) => set('round', e.target.value)} placeholder="pl. Svájci 2. kör" required />
        </label>
        <label>Első csapat
          <input list="adm-teams" value={f.team1} onChange={(e) => set('team1', e.target.value)} placeholder="csapatnév" required />
        </label>
        <label>Második csapat
          <input list="adm-teams" value={f.team2} onChange={(e) => set('team2', e.target.value)} placeholder="csapatnév" required />
        </label>
        <label>Kezdés (magyar idő)
          <input type="datetime-local" value={f.kickoff} onChange={(e) => set('kickoff', e.target.value)} required />
        </label>
        <label>Pontozás
          <span className="seg">
            <button type="button" aria-pressed={basic} onClick={() => setF((x) => ({ ...x, points: 1, exact_bonus: 0 }))}>Alap · 1</button>
            <button type="button" aria-pressed={playoff} onClick={() => setF((x) => ({ ...x, points: 2, exact_bonus: 1 }))}>Playoff · 2 +1</button>
          </span>
        </label>
        <details className="full af-more" open={!basic && !playoff}>
          <summary>Haladó beállítások</summary>
          <div className="af-g">
            <label>Jó győztes pontja<input type="number" min="0" step="1" value={f.points} onChange={(e) => set('points', e.target.value)} /></label>
            <label>Pontos állás bónusz<input type="number" min="0" step="1" value={f.exact_bonus} onChange={(e) => set('exact_bonus', e.target.value)} /></label>
            {isNew && <label className="full">Azonosító (nem kötelező, pl. cs-r2-201)<input value={f.id} onChange={(e) => set('id', e.target.value.replace(/\s/g, ''))} placeholder="magától készül, ha üresen hagyod" /></label>}
          </div>
        </details>
      </div>
      <datalist id="adm-teams">{teams.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="adm-rounds">{rounds.map((t) => <option key={t} value={t} />)}</datalist>
      {err && <p className="am-err" role="alert">{err}</p>}
      <div className="am-act">
        <button type="submit" className="btn sm green" disabled={busy}>{isNew ? 'Meccs hozzáadása' : 'Mentés'}</button>
        <button type="button" className="btn sm ghost" onClick={onCancel}>Mégse</button>
      </div>
    </form>
  );
}

// ---------- csapat átnevezése ----------
function Rename({ matches, onRename }) {
  const [game, setGame] = useState('cs2');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const teams = useMemo(() => [...new Set(matches.filter((m) => m.game === game).flatMap((m) => [m.team1, m.team2]))].sort((a, b) => a.localeCompare(b, 'hu')), [matches, game]);
  const n = matches.filter((m) => m.game === game && (m.team1 === from || m.team2 === from)).length;
  const go = async (e) => {
    e.preventDefault();
    if (!from || !to.trim() || to.trim() === from) return;
    setBusy(true);
    const ok = await onRename(game, from, to.trim());
    setBusy(false);
    if (ok) { setFrom(''); setTo(''); }
  };
  return (
    <details className="adm-panel adm-ren">
      <summary><h2>Csapat átnevezése</h2><span>az összes meccsén egyszerre</span></summary>
      <form className="af-g" onSubmit={go}>
        <label>Játék
          <span className="seg">{[['cs2', 'CS2'], ['lol', 'LoL']].map(([k, l]) => <button key={k} type="button" aria-pressed={game === k} onClick={() => { setGame(k); setFrom(''); }}>{l}</button>)}</span>
        </label>
        <label>Jelenlegi név
          <select value={from} onChange={(e) => { setFrom(e.target.value); setTo(e.target.value); }}>
            <option value="">Válassz csapatot…</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="full">Új név
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="új csapatnév" disabled={!from} />
        </label>
        <div className="am-act full">
          <button type="submit" className="btn sm green" disabled={busy || !from || !to.trim() || to.trim() === from}>Átnevezés{from ? ` (${n} meccs)` : ''}</button>
        </div>
      </form>
    </details>
  );
}

const FILTERS = [['teendo', 'Teendő'], ['kozelgo', 'Közelgő'], ['kesz', 'Lezárt'], ['mind', 'Mind']];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);       // null = ellenőrzés folyamatban
  const [checked, setChecked] = useState(false);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('teendo');
  const [game, setGame] = useState('all');
  const [form, setForm] = useState(null);         // null | 'new' | match
  const [now, setNow] = useState(() => Date.now());
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((text, err = false) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, err }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const load = useCallback(async () => {
    if (DEMO) return;
    const [m, s] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff', { ascending: true }),
      supabase.from('tip_stats').select('match_id,total'),
    ]);
    if (m.error) return toast('Nem sikerült betölteni a meccseket.', true);
    setMatches(m.data || []);
    setStats(Object.fromEntries((s.data || []).map((x) => [x.match_id, x])));
  }, [toast]);

  useEffect(() => {
    if (DEMO) {
      setUser(demoUser); setAdmin(true); setChecked(true);
      setMatches(demoMatches); setStats(Object.fromEntries(demoStats.map((s) => [s.match_id, s])));
      return;
    }
    const apply = async (session) => {
      const u = userFrom(session); setUser(u);
      if (u) { const a = await isAdmin(); setAdmin(a); if (a) load(); } else setAdmin(false);
      setChecked(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { apply(session); });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const fail = (e) => toast(/row-level security|permission|jogosults/i.test(e.message) ? 'Nincs jogosultságod ehhez. Biztosan a szervezői fiókkal vagy belépve?' : `Hiba: ${e.message}`, true);

  // demó módban csak helyben módosít
  const local = (fn) => { setMatches((ms) => fn(ms).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))); };

  const saveResult = async (m, patch, undo) => {
    if (DEMO) { local((ms) => ms.map((x) => (x.id === m.id ? { ...x, ...patch } : x))); toast(undo ? 'Eredmény visszavonva (demó).' : 'Eredmény mentve (demó).'); return; }
    const e = await adminUpdate(m.id, patch);
    if (e) return fail(e);
    toast(undo ? `Eredmény visszavonva: ${m.team1} – ${m.team2}` : `Eredmény mentve: ${patch.winner === 1 ? m.team1 : m.team2} nyert${patch.score1 != null ? ` (${patch.score1}–${patch.score2})` : ''}`);
    load();
  };

  const submitMatch = async (row, initial) => {
    if (DEMO) {
      local((ms) => (initial ? ms.map((x) => (x.id === initial.id ? { ...x, ...row } : x)) : [...ms, { winner: null, score1: null, score2: null, ...row }]));
      toast(initial ? 'Meccs mentve (demó).' : 'Meccs hozzáadva (demó).'); return true;
    }
    const e = initial ? await adminUpdate(initial.id, row) : await adminInsert(row);
    if (e) { fail(e); return false; }
    toast(initial ? `Mentve: ${row.team1} – ${row.team2}` : `Új meccs: ${row.team1} – ${row.team2}`);
    if (!initial) setFilter('kozelgo');
    load(); return true;
  };

  const del = async (m) => {
    if (DEMO) { local((ms) => ms.filter((x) => x.id !== m.id)); toast('Meccs törölve (demó).'); return; }
    const e = await adminDelete(m.id);
    if (e) return toast(e.message, true);
    toast(`Törölve: ${m.team1} – ${m.team2}`); load();
  };

  const rename = async (g, from, to) => {
    if (DEMO) { local((ms) => ms.map((x) => (x.game !== g ? x : { ...x, team1: x.team1 === from ? to : x.team1, team2: x.team2 === from ? to : x.team2 }))); toast(`Átnevezve: ${from} → ${to} (demó)`); return true; }
    const r = await adminRename(g, from, to);
    if (r.error) { fail(r.error); return false; }
    toast(`Átnevezve: ${from} → ${to} (${r.count} meccs)`); load(); return true;
  };

  const login = async () => { if (DEMO) return; const { error } = await signIn('/admin/'); if (error) toast('A belépés nem sikerült.', true); };
  const logout = async () => { if (!DEMO) await supabase.auth.signOut(); };

  const counts = useMemo(() => {
    const c = { var: 0, kozelgo: 0, kesz: 0 };
    for (const m of matches) if (game === 'all' || m.game === game) c[status(m, now)]++;
    return c;
  }, [matches, now, game]);

  const shown = matches.filter((m) => {
    if (game !== 'all' && m.game !== game) return false;
    const st = status(m, now);
    return filter === 'mind' || (filter === 'teendo' ? st === 'var' : st === filter);
  });
  const list = filter === 'kesz' ? [...shown].reverse() : shown;

  return (
    <>
      <header className="top">
        <div className="row">
          <div className="mark" />
          <div className="brand"><small>MECHWART</small><b>Szervezői felület</b></div>
          <div className="sp" />
          <Link href="/" className="btn ghost sm">← Tippek</Link>
          {user && (
            <div className="user">
              <Avatar name={user.name} url={user.avatar} />
              <span className="u-n">{user.name}</span>
              <button type="button" className="btn ghost" onClick={logout} aria-label="Kilépés"><Logout size={18} /></button>
            </div>
          )}
        </div>
      </header>

      <main className="wrap adm">
        {DEMO && <div className="demo in">Demó mód – a változtatások csak ebben a böngészőablakban látszanak, és frissítéskor elvesznek.</div>}

        {!checked && <div className="gate in"><p>Jogosultság ellenőrzése…</p></div>}

        {checked && !user && (
          <div className="gate in">
            <h1>Szervezői felület</h1>
            <p>Lépj be a szervezői Discord-fiókoddal.</p>
            <button type="button" className="btn big" onClick={login}><Login size={20} /> Belépés Discorddal</button>
          </div>
        )}

        {checked && user && admin === false && (
          <div className="gate in">
            <h1>Nincs hozzáférésed</h1>
            <p>Ez az oldal csak a bajnokság szervezőjének érhető el. Ha te vagy az, lépj be a szervezői Discord-fiókkal.</p>
            <Link href="/" className="btn ghost">← Vissza a tippekhez</Link>
          </div>
        )}

        {checked && admin && (
          <>
            <div className="adm-head in">
              <div>
                <div className="kick">SZERVEZŐ</div>
                <h1>Meccsek és eredmények</h1>
              </div>
              <div className="sp" />
              <button type="button" className="btn ghost sm" onClick={() => { load(); toast('Frissítve.'); }} aria-label="Frissítés"><Refresh size={16} /></button>
              <button type="button" className="btn sm" onClick={() => setForm('new')}><Plus size={18} /> Új meccs</button>
            </div>

            {form && (
              <MatchForm key={form === 'new' ? 'new' : form.id} initial={form === 'new' ? null : form} matches={matches}
                tips={form === 'new' ? 0 : stats[form.id]?.total ?? 0} onSubmit={submitMatch} onCancel={() => setForm(null)} />
            )}

            <div className="adm-bar in" style={{ '--i': 1 }}>
              <div className="chips" role="group" aria-label="Állapot">
                {FILTERS.map(([k, l]) => (
                  <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
                    {l}{k === 'teendo' && counts.var > 0 && <span className="adm-count">{counts.var}</span>}
                    {k === 'kozelgo' && <small> {counts.kozelgo}</small>}{k === 'kesz' && <small> {counts.kesz}</small>}
                  </button>
                ))}
              </div>
              <span className="sp" />
              <div className="seg" role="group" aria-label="Játék">
                {[['all', 'Mind'], ['cs2', 'CS2'], ['lol', 'LoL']].map(([k, l]) => <button key={k} type="button" aria-pressed={game === k} onClick={() => setGame(k)}>{l}</button>)}
              </div>
            </div>

            <div className="adm-list">
              {list.length === 0 && (
                <div className="empty">{filter === 'teendo' ? 'Nincs eredményre váró meccs. Ha egy meccs elkezdődött, itt jelenik meg.' : 'Ebben a nézetben nincs meccs.'}</div>
              )}
              {list.map((m) => (
                <AdminMatch key={m.id} m={m} stat={stats[m.id]} now={now} onSave={saveResult} onDelete={del}
                  onEdit={(x) => { setForm(x); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              ))}
            </div>

            <Rename matches={matches} onRename={rename} />

            <p className="adm-help">Az eredmény mentése után a ranglista azonnal frissül. Ha egy meccs elmarad, tedd át későbbi időpontra. Törölni csak azt a meccset lehet, amelyre még senki nem tippelt.</p>
          </>
        )}
      </main>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast${t.err ? ' err' : ''}`}>{t.text}</div>)}
      </div>
    </>
  );
}
