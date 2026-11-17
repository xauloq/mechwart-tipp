'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevDown } from './icons';
import { useInView } from './FX';

// Pontszámláló: egyszer, röviden fut fel; értékváltáskor az előző értékről indul
export function CountUp({ value, ms = 600 }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const a = from.current, b = Number(value) || 0;
    if (a === b || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { from.current = b; setV(b); return; }
    const start = performance.now();
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(a + (b - a) * e));
      if (k < 1) raf = requestAnimationFrame(step); else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <>{v}</>;
}

export const Avatar = ({ name, url, className = 'av' }) => (
  <span className={className} aria-hidden="true">{url ? <img src={url} alt="" loading="lazy" /> : (name || '?').trim().charAt(0).toUpperCase()}</span>
);

// Pontcsoportok: egy csoport = egy pontszám, a helyezés folyamatos (1., 2., 3. …), így az azonos
// pontszámúak ugyanazon a helyen állnak, és nincs kihagyott helyezés. Csoporton belül: több talált tipp, majd név.
export function groupsOf(board) {
  const rows = [...board].sort((a, b) => b.points - a.points || b.correct - a.correct || String(a.name).localeCompare(String(b.name), 'hu'));
  const out = [];
  rows.forEach((r) => {
    let g = out[out.length - 1];
    if (!g || g.points !== r.points) { g = { points: r.points, rank: out.length + 1, rows: [] }; out.push(g); }
    g.rows.push(r);
  });
  return out;
}

export function rankOf(board, uid) {
  if (!uid) return null;
  const g = groupsOf(board).find((x) => x.rows.some((r) => r.user_id === uid));
  return g ? { rank: g.rank, size: g.rows.length, points: g.points } : null;
}

function Group({ g, me, open, toggle, i }) {
  const [ref, vis] = useInView();
  const mine = g.rows.some((r) => r.user_id === me);
  const solo = g.rows.length === 1;
  const id = `grp-${g.points}`;
  const head = (
    <>
      <span className="rk">{g.rank}.</span>
      <span className="pts"><b>{g.points}</b> pont</span>
      {solo ? (
        <span className="who"><Avatar name={g.rows[0].name} url={g.rows[0].avatar_url} /><span className="nm">{g.rows[0].name}</span>{mine && <em>te</em>}</span>
      ) : (
        <>
          <span className="cnt">{g.rows.length} tippelő{mine && <em>köztük te</em>}</span>
          <span className="stack" aria-hidden="true">
            {g.rows.slice(0, 5).map((r) => <Avatar key={r.user_id} name={r.name} url={r.avatar_url} />)}
            {g.rows.length > 5 && <span className="av more">+{g.rows.length - 5}</span>}
          </span>
        </>
      )}
      {solo ? <span className="acc">{g.rows[0].correct}/{g.rows[0].decided} talált</span> : <ChevDown size={18} className="chev" />}
    </>
  );
  return (
    <div ref={ref} data-rv="" className={`grp rv${vis ? ' vis' : ''}${i < 3 ? ` lead l${i + 1}` : ''}${mine ? ' mine' : ''}${open ? ' open' : ''}`} style={{ '--i': Math.min(i, 5) }}>
      {solo ? <div className="grp-h">{head}</div> : (
        <button type="button" className="grp-h" aria-expanded={open} aria-controls={id} onClick={toggle}>{head}</button>
      )}
      {!solo && open && (
        <div className="grp-b" id={id}>
          {mine && <p className="here">Te itt vagy: <b>{g.rank}. hely</b>, holtversenyben {g.rows.length - 1} másik tippelővel.</p>}
          <ul>
            {g.rows.map((r) => (
              <li key={r.user_id} className={r.user_id === me ? 'me' : ''}>
                <Avatar name={r.name} url={r.avatar_url} /><span className="nm">{r.name}</span><span className="acc">{r.correct}/{r.decided}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Board({ board, me }) {
  const groups = groupsOf(board);
  const myPts = groups.find((g) => g.rows.some((r) => r.user_id === me))?.points;
  const [open, setOpen] = useState(() => new Set());
  const auto = useRef(false);
  useEffect(() => {                       // a saját csoport magától nyitva van (egyszer, amikor megvan)
    if (auto.current || myPts === undefined) return;
    auto.current = true;
    setOpen((s) => new Set(s).add(myPts));
  }, [myPts]);
  if (!groups.length) return <div className="empty">A ranglista az első lejátszott meccs után jelenik meg. Addig is: tippelj!</div>;
  const toggle = (p) => () => setOpen((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });
  return (
    <section className="board" aria-label="Ranglista">
      <p className="board-note">{board.length} tippelő · az azonos pontszámúak ugyanazon a helyen állnak</p>
      {groups.map((g, i) => <Group key={g.points} g={g} me={me} i={i} open={open.has(g.points)} toggle={toggle(g.points)} />)}
    </section>
  );
}
