'use client';

// Gördülő számjegy: minden számjegy egy függőleges 0–9 sáv, ami a helyére csúszik
function Digit({ d }) {
  return (
    <span className="dg" aria-hidden="true">
      <span className="dg-s" style={{ transform: `translateY(${-d * 10}%)` }}>
        {'0123456789'.split('').map((n) => <span key={n}>{n}</span>)}
      </span>
    </span>
  );
}

export default function Roll({ value, pad = 2 }) {
  const s = String(Math.max(0, value | 0)).padStart(pad, '0');
  return <span className="roll" aria-label={s}>{s.split('').map((c, i) => <Digit key={i + '-' + s.length} d={+c} />)}</span>;
}

export function Countdown({ ms, label, sub }) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return (
    <div className="cdown rv">
      <div className="cd-l"><span className="kick">{label}</span><b>{sub}</b></div>
      <div className="cd-u" role="timer" aria-label={`${d} nap ${h} óra ${m} perc ${s} másodperc`}>
        {d > 0 && <><div className="cu"><Roll value={d} pad={1} /><span>nap</span></div><i>:</i></>}
        <div className="cu"><Roll value={h} /><span>óra</span></div><i>:</i>
        <div className="cu"><Roll value={m} /><span>perc</span></div><i>:</i>
        <div className="cu"><Roll value={s} /><span>mp</span></div>
      </div>
    </div>
  );
}
