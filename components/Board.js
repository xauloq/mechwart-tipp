'use client';
import { useEffect, useRef, useState } from 'react';
import { Crown } from './icons';
import { useInView } from './FX';

function Row({ r, me, i }) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} className={`lr rv${vis ? ' vis' : ''}${r.user_id === me ? ' me' : ''}`} style={{ '--i': i % 8 }}>
      <span className="rk">{r.rank}.</span>
      <Avatar name={r.name} url={r.avatar_url} />
      <span className="nm">{r.name}</span>
      <span className="acc">{r.correct}/{r.decided} talált</span>
      <span className="pts"><CountUp value={r.points} /></span>
    </div>
  );
}

export function CountUp({ value, ms = 900 }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now(), a = from.current, b = Number(value) || 0;
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
  <span className={className} aria-hidden="true">{url ? <img src={url} alt="" /> : (name || '?').trim().charAt(0).toUpperCase()}</span>
);

// helyezés holtversennyel: azonos pontszám = azonos hely
export function ranked(board) {
  let last = null, rank = 0;
  return board.map((r, i) => {
    const key = `${r.points}|${r.correct}`;
    if (key !== last) { rank = i + 1; last = key; }
    return { ...r, rank };
  });
}

export default function Board({ board, me }) {
  const rows = ranked(board);
  if (!rows.length) return <div className="empty in">A ranglista az első lejátszott meccs után jelenik meg. Addig is: tippelj!</div>;
  const top = [rows[1], rows[0], rows[2]];
  return (
    <section>
      <div className="podium">
        {top.map((r, k) => r ? (
          <div key={r.user_id} className={`pod in p${k === 1 ? 1 : k === 0 ? 2 : 3}`} style={{ '--i': k }}>
            {k === 1 && <div className="crown"><Crown size={26} /></div>}
            <Avatar name={r.name} url={r.avatar_url} />
            <div className="nm">{r.name}</div>
            <div className="pt"><CountUp value={r.points} /> pont</div>
            <div className="blk">{k === 1 ? 1 : k === 0 ? 2 : 3}</div>
          </div>
        ) : <div key={k} />)}
      </div>
      <div className="lb-list">
        {rows.map((r, i) => <Row key={r.user_id} r={r} me={me} i={i} />)}
      </div>
    </section>
  );
}
