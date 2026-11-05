'use client';
import { Check, Lock, Clock } from './icons';

const TZ = 'Europe/Budapest';
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

function left(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d > 0) return `${d} nap ${h} ó`;
  if (h > 0) return `${h} ó ${mm} p`;
  const s = Math.max(0, Math.floor(ms / 1000) % 60);
  return `${mm} p ${String(s).padStart(2, '0')} mp`;
}

function seriesOptions(format, pick) {
  const n = format === 'Bo5' ? 3 : format === 'Bo3' ? 2 : 0;
  if (!n || !pick) return [];
  const out = [];
  for (let l = 0; l < n; l++) out.push(pick === 1 ? `${n}-${l}` : `${l}-${n}`);
  return out;
}

function ripple(e) {
  const b = e.currentTarget, r = b.getBoundingClientRect();
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.left = `${e.clientX - r.left}px`; s.style.top = `${e.clientY - r.top}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 700);
}

export default function MatchCard({ m, tip, stat, own, user, now, onPick, onNeedLogin, i = 0 }) {
  const ko = new Date(m.kickoff).getTime();
  const decided = m.winner === 1 || m.winner === 2;
  const locked = decided || ko <= now;
  const pick = tip?.pick;
  const opts = seriesOptions(m.format, pick);
  const blocked = user && own;

  const click = (side) => (e) => {
    if (locked || blocked) return;
    ripple(e);
    if (!user) return onNeedLogin();
    if (pick === side) return;
    onPick(m.id, side, opts.length ? null : undefined);
  };

  const team = (side) => {
    const name = side === 1 ? m.team1 : m.team2;
    const cls = ['team', `t${side}`, pick === side ? 'on' : '', decided && m.winner === side ? 'win' : ''].join(' ');
    const label = locked ? `${name}${pick === side ? ' – a tipped' : ''}` : `Tipp: ${name} nyer`;
    return (
      <button type="button" className={cls} onClick={click(side)} disabled={locked || blocked} aria-pressed={pick === side} aria-label={label}>
        <span className="ck"><Check size={16} /></span>
        <span className="nm">{name}</span>
        {decided && <span className="sc">{side === 1 ? m.score1 : m.score2}</span>}
      </button>
    );
  };

  let res = null;
  if (decided && pick) {
    const ok = pick === m.winner;
    const exact = ok && m.exact_bonus > 0 && tip.series === `${m.score1}-${m.score2}`;
    const pts = ok ? m.points + (exact ? m.exact_bonus : 0) : 0;
    res = <span className={`res ${ok ? 'ok' : 'bad'}`}>{ok ? `+${pts} PONT${exact ? ' · PONTOS ÁLLÁS' : ''}` : 'NEM JÖTT BE'}</span>;
  }

  const p1 = stat?.pick1, p2 = stat?.pick2, tot = (p1 ?? 0) + (p2 ?? 0);

  return (
    <article className={`card in${locked ? ' locked' : ''}`} style={{ '--i': i }}>
      <div className="meta">
        <span className={`tag ${m.game}`}>{m.game === 'cs2' ? 'CS2' : 'LOL'}</span>
        <span className="round">{m.round} · {m.format}</span>
        <span className="when">
          <b>{fmtTime(m.kickoff)}</b>
          {decided ? <span className="lock">VÉGE</span>
            : locked ? <span className="lock"><span className="live" /> ÉLŐ · LEZÁRVA</span>
            : ko - now < 36 * 3600000 ? <span className="cd"><Clock size={12} style={{ verticalAlign: '-2px' }} /> Zárás: {left(ko - now)}</span>
            : <span className="cd">Kezdésig nyitva</span>}
        </span>
      </div>

      <div className="vs">{team(1)}<span className="x">VS</span>{team(2)}</div>

      {!locked && opts.length > 0 && (
        <div className="series">
          <span>Pontos állás (+{m.exact_bonus} pont):</span>
          {opts.map((o) => (
            <button key={o} type="button" className="chip" aria-pressed={tip?.series === o} onClick={() => onPick(m.id, pick, tip?.series === o ? null : o)}>{o}</button>
          ))}
        </div>
      )}

      {locked && tot > 0 && (
        <div className="dist" aria-label={`Tippek megoszlása: ${m.team1} ${p1}, ${m.team2} ${p2}`}>
          <div className="barw">
            <div className="b1" style={{ width: `${(p1 / tot) * 100}%` }} />
            <div className="b2" style={{ width: `${(p2 / tot) * 100}%` }} />
          </div>
          <div className="lb"><span>{Math.round((p1 / tot) * 100)}% · {p1} tipp</span><span>{p2} tipp · {Math.round((p2 / tot) * 100)}%</span></div>
        </div>
      )}

      <div className="foot">
        {res}
        {!decided && pick && !locked && <span>Tipped elmentve – a kezdésig módosíthatod.</span>}
        {!decided && pick && locked && <span><Lock size={13} style={{ verticalAlign: '-2px' }} /> Tipped: {pick === 1 ? m.team1 : m.team2}{tip.series ? ` (${tip.series})` : ''}</span>}
        {!pick && !locked && !blocked && <span>{user ? 'Kattints arra a csapatra, amelyik szerinted nyer.' : 'Lépj be a tippeléshez.'}</span>}
        {!pick && locked && !decided && <span>Erre a meccsre nem tippeltél.</span>}
        <span style={{ marginLeft: 'auto' }}>{stat?.total ? `${stat.total} tippelő` : ''}</span>
      </div>

      {blocked && !decided && <div className="own">Ezen a meccsen te is játszol – a saját meccsedre nem tippelhetsz. Sok sikert!</div>}
    </article>
  );
}
