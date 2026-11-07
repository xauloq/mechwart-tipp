'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, DEMO, signIn, canVeto, loadVeto, saveVeto } from '../../../lib/supabase';
import { demoMatches } from '../../../lib/demo';
import { MAPPOOL, MAPNEV, MAPSZIN, vetoSteps } from '../../../lib/veto';
import { Avatar } from '../../../components/Board';
import { Login, Logout } from '../../../components/icons';

const EMPTY = { csapat1: '', csapat2: '', format: 'bo1', info: '', lepesek: [] };
const fmtOf = (f) => (/bo5/i.test(f || '') ? 'bo5' : /bo3/i.test(f || '') ? 'bo3' : 'bo1');

function userFrom(session) {
  const u = session?.user; if (!u) return null;
  const m = u.user_metadata || {};
  return { id: u.id, name: m.custom_claims?.global_name || m.full_name || (m.name || '').replace(/#0$/, ''), avatar: m.avatar_url || null };
}

export default function Veto() {
  const [user, setUser] = useState(null);
  const [ok, setOk] = useState(null);
  const [checked, setChecked] = useState(false);
  const [S, setS] = useState(EMPTY);
  const [shown, setShown] = useState(true);       // false = a streamen üres a kijelzés
  const [edit, setEdit] = useState(null);
  const [matches, setMatches] = useState([]);
  const [st, setSt] = useState({ ok: true, txt: '' });
  const dirty = useRef(0);                        // utolsó helyi módosítás ideje
  const lastSaved = useRef(null);

  // ---------- belépés, jogosultság, adatok ----------
  useEffect(() => {
    if (DEMO) { setUser({ name: 'Demó' }); setOk(true); setChecked(true); setMatches(demoMatches.filter((m) => m.game === 'cs2')); return; }
    const apply = async (session) => {
      const u = userFrom(session); setUser(u);
      if (u) {
        const a = await canVeto(); setOk(a);
        if (a) {
          const { data } = await supabase.from('matches').select('id,game,round,format,team1,team2,kickoff,winner').eq('game', 'cs2').order('kickoff');
          setMatches(data || []);
          try { const v = await loadVeto(); if (v.data) setS(v.data); setShown(!!v.data); lastSaved.current = v.updated_at; } catch {}
        }
      } else setOk(false);
      setChecked(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { apply(s); });
    return () => sub.subscription.unsubscribe();
  }, []);

  // más kezelő módosításainak átvétele (ha mi épp nem kattintgatunk)
  useEffect(() => {
    if (DEMO || !ok) return;
    const t = setInterval(async () => {
      if (Date.now() - dirty.current < 4000) return;
      try {
        const v = await loadVeto();
        if (v.updated_at && v.updated_at !== lastSaved.current) {
          lastSaved.current = v.updated_at; setShown(!!v.data); if (v.data) setS(v.data);
          setSt({ ok: true, txt: 'Frissítve egy másik kezelőtől' });
        }
      } catch {}
    }, 2500);
    return () => clearInterval(t);
  }, [ok]);

  // mentés (kis késleltetéssel, hogy a gyors kattintások egybe menjenek)
  const saveT = useRef(null);
  const push = useCallback((state, show = true) => {
    dirty.current = Date.now();
    clearTimeout(saveT.current);
    saveT.current = setTimeout(async () => {
      if (DEMO) { setSt({ ok: true, txt: 'Demó mód – nem ment' }); return; }
      const r = await saveVeto(show ? state : null);
      if (r.error) setSt({ ok: false, txt: r.error.message || 'Mentési hiba' });
      else { lastSaved.current = r.updated_at; setSt({ ok: true, txt: 'Mentve ' + new Date().toLocaleTimeString('hu-HU') }); }
    }, 150);
  }, []);
  const update = (fn) => { const next = fn(structuredClone(S)); setS(next); setShown(true); push(next, true); };

  // ---------- veto logika ----------
  const steps = useMemo(() => vetoSteps(S.format), [S.format]);
  const nextIdx = steps.findIndex((_, i) => !(S.lepesek[i] || {}).map);
  const cur = edit ?? nextIdx;
  const used = (except) => S.lepesek.map((x, i) => i !== except && x && x.map).filter(Boolean);
  const tn = (t) => (t === 1 ? S.csapat1 || '1. csapat' : t === 2 ? S.csapat2 || '2. csapat' : '');

  const pickMap = (m) => {
    if (cur < 0) return;
    update((s) => {
      s.lepesek[cur] = { ...(s.lepesek[cur] || {}), map: m };
      const last = steps.length - 1;
      const filled = steps.slice(0, last).every((_, i) => (s.lepesek[i] || {}).map);
      if (filled && !(s.lepesek[last] || {}).map) {
        const left = MAPPOOL.filter((x) => !s.lepesek.slice(0, last).some((y) => y && y.map === x));
        if (left.length === 1) s.lepesek[last] = { map: left[0], side: 'kes' };
      }
      return s;
    });
    setEdit(null);
  };
  const undo = () => { update((s) => { for (let i = steps.length - 1; i >= 0; i--) if ((s.lepesek[i] || {}).map) { s.lepesek[i] = {}; break; } return s; }); setEdit(null); };
  const reset = () => { if (confirm('Biztosan törlöd az összes lépést?')) { update((s) => ({ ...s, lepesek: [] })); setEdit(null); } };
  const hide = () => { setShown(false); push(S, false); };

  const teams = useMemo(() => [...new Set(matches.flatMap((m) => [m.team1, m.team2]))].sort((a, b) => a.localeCompare(b, 'hu')), [matches]);
  const nextMatch = useMemo(() => matches.find((m) => !(m.winner === 1 || m.winner === 2) && new Date(m.kickoff).getTime() > Date.now() - 4 * 3600000), [matches]);
  const loadNext = () => {
    if (!nextMatch) return;
    update(() => ({ csapat1: nextMatch.team1, csapat2: nextMatch.team2, format: fmtOf(nextMatch.format), info: `${nextMatch.round} · ${nextMatch.format}`, lepesek: [] }));
    setEdit(null);
  };

  const login = async () => { if (!DEMO) await signIn('/admin/veto/'); };
  const logout = async () => { if (!DEMO) await supabase.auth.signOut(); };

  return (
    <>
      <header className="top">
        <div className="row">
          <div className="mark" />
          <div className="brand"><small>MECHWART</small><b>Pályaválasztás</b></div>
          <div className="sp" />
          <Link href="/admin/" className="btn ghost sm">← Admin</Link>
          {user && (
            <div className="user">
              {user.avatar !== undefined && <Avatar name={user.name} url={user.avatar} />}
              <span className="u-n">{user.name}</span>
              <button type="button" className="btn ghost" onClick={logout} aria-label="Kilépés"><Logout size={18} /></button>
            </div>
          )}
        </div>
      </header>

      <main className="wrap adm vt">
        {!checked && <div className="gate in"><p>Jogosultság ellenőrzése…</p></div>}
        {checked && !user && (
          <div className="gate in"><h1>Pályaválasztás</h1><p>Lépj be a Discord-fiókoddal.</p>
            <button type="button" className="btn big" onClick={login}><Login size={20} /> Belépés Discorddal</button></div>
        )}
        {checked && user && ok === false && (
          <div className="gate in"><h1>Nincs hozzáférésed</h1><p>A pályaválasztást csak a szervezők és a kijelölt kezelők állíthatják.</p>
            <Link href="/" className="btn ghost">← Vissza a tippekhez</Link></div>
        )}

        {checked && ok && (
          <>
            <div className="adm-head in">
              <div><div className="kick">STREAM</div><h1>Pályaválasztás</h1></div>
              <div className="sp" />
              <span className={`vt-st ${st.ok ? 'ok' : 'bad'}`}>{st.txt || (shown ? 'Kijelzés aktív' : 'Kijelzés üres')}</span>
            </div>

            <section className="adm-panel">
              <div className="vt-row">
                <label>Első csapat (kezdi a vetót)
                  <select value={S.csapat1} onChange={(e) => update((s) => ({ ...s, csapat1: e.target.value }))}>
                    <option value="">– válassz –</option>{teams.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <span className="vt-vs">VS</span>
                <label>Második csapat
                  <select value={S.csapat2} onChange={(e) => update((s) => ({ ...s, csapat2: e.target.value }))}>
                    <option value="">– válassz –</option>{teams.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <div className="am-act">
                <span className="seg">{['bo1', 'bo3', 'bo5'].map((f) => (
                  <button key={f} type="button" aria-pressed={S.format === f}
                    onClick={() => { if (S.format !== f && (!S.lepesek.some((x) => x && x.map) || confirm('Formátumváltáskor a lépések törlődnek. Mehet?'))) { update((s) => ({ ...s, format: f, lepesek: [] })); setEdit(null); } }}>
                    {f.replace('bo', 'Bo')}</button>))}</span>
                <input className="vt-info" value={S.info || ''} placeholder="Felirat, pl. Svájci 2. kör · Bo1" onChange={(e) => update((s) => ({ ...s, info: e.target.value }))} />
                {nextMatch && <button type="button" className="btn sm ghost" onClick={loadNext}>Következő meccs: {nextMatch.team1} – {nextMatch.team2}</button>}
              </div>
            </section>

            <section className="adm-panel">
              <div className="vt-ph">
                <b>{cur < 0 ? 'A pályaválasztás kész.' : steps[cur].team
                  ? <>{cur + 1}. lépés: <span className={steps[cur].team === 1 ? 'r' : 'bl'}>{tn(steps[cur].team)}</span> {steps[cur].type === 'ban' ? 'BANNOL' : 'PICKEL'}</>
                  : `${cur + 1}. lépés: döntő pálya`}</b>
                <span className="sp" />
                <button type="button" className="btn sm ghost" onClick={undo}>Visszavonás</button>
                <button type="button" className="btn sm ghost" onClick={reset}>Újrakezdés</button>
                <button type="button" className="btn sm ghost" onClick={hide}>Kijelzés törlése</button>
              </div>
              <div className="vt-maps">
                {MAPPOOL.map((m) => (
                  <button key={m} type="button" className="vt-mp" style={{ background: MAPSZIN[m] }} disabled={cur < 0 || used(cur).includes(m)} onClick={() => pickMap(m)}>
                    {MAPNEV[m]}<small>{m}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="adm-panel">
              <h2>Lépések</h2>
              <div className="vt-steps">
                {steps.map((s, i) => {
                  const v = S.lepesek[i] || {};
                  return (
                    <div key={i} className={`vt-stp${i === cur ? ' act' : ''}`}>
                      <span className="n">{i + 1}.</span>
                      <span className={`ty ${s.type}`}>{s.type === 'ban' ? 'BAN' : s.type === 'pick' ? 'PICK' : 'DÖNTŐ'}</span>
                      <span className="who">{s.team ? <span className={s.team === 1 ? 'r' : 'bl'}>{tn(s.team)}</span> : 'megmaradt pálya'}{v.map && <> → <b>{MAPNEV[v.map]}</b></>}</span>
                      {v.map && <button type="button" className="btn sm ghost" onClick={() => setEdit(i)}>Javít</button>}
                      {s.type !== 'ban' && v.map && (
                        <div className="sub">
                          Oldal:
                          <span className="seg">{[['CT', `${tn(1)} CT`], ['T', `${tn(1)} T`], ['kes', 'Késes kör']].map(([k, l]) => (
                            <button key={k} type="button" aria-pressed={v.side === k} onClick={() => update((x) => { x.lepesek[i] = { ...x.lepesek[i], side: k }; return x; })}>{l}</button>))}</span>
                          {S.format !== 'bo1' && <>Eredmény:
                            <input type="number" min="0" value={v.s1 ?? ''} onChange={(e) => update((x) => { x.lepesek[i] = { ...x.lepesek[i], s1: e.target.value === '' ? '' : +e.target.value }; return x; })} /> :
                            <input type="number" min="0" value={v.s2 ?? ''} onChange={(e) => update((x) => { x.lepesek[i] = { ...x.lepesek[i], s2: e.target.value === '' ? '' : +e.target.value }; return x; })} /></>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            <p className="adm-help">A streamen futó pályaválasztás-képernyő 1–2 másodpercen belül követi, amit itt beállítasz. Egyszerre több kezelő is lehet bent; ha valaki más kattint, az itt is megjelenik.</p>
          </>
        )}
      </main>
    </>
  );
}
