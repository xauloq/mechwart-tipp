'use client';
import { Check, Lock, Clock } from './icons';
import { useInView } from './FX';
import TeamBadge from './TeamBadge';

const TZ = 'Europe/Budapest';
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
export const fmtDay = (iso) => new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', timeZone: TZ });
export const gameName = (g) => (g === 'cs2' ? 'CS2' : 'LoL');

export function left(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d > 0) return `${d} nap ${h} ó`;
  if (h > 0) return `${h} ó ${mm} p`;
  const s = Math.max(0, Math.floor(ms / 1000) % 60);
  return `${mm} p ${String(s).padStart(2, '0')} mp`;
}

export function seriesOptions(format, pick) {
  const n = format === 'Bo5' ? 3 : format === 'Bo3' ? 2 : 0;
  if (!n || !pick) return [];
  const out = [];
  for (let l = 0; l < n; l++) out.push(pick === 1 ? `${n}-${l}` : `${l}-${n}`);
  return out;
}

// Egy tipp kiértékelése: null, ha még nincs eredmény vagy nem tippelt
export function tipResult(m, tip) {
  if (!(m.winner === 1 || m.winner === 2) || !tip?.pick) return null;
  const ok = tip.pick === m.winner;
  const exact = ok && m.exact_bonus > 0 && tip.series === `${m.score1}-${m.score2}`;
  return { ok, exact, pts: ok ? m.points + (exact ? m.exact_bonus : 0) : 0 };
}

export function Dist({ m, stat }) {
  const p1 = stat?.pick1, p2 = stat?.pick2, tot = (p1 ?? 0) + (p2 ?? 0);
  if (!tot) return null;
  const a = Math.round((p1 / tot) * 100);
  return (
    <div className="dist" role="img" aria-label={`Tippek megoszlása: ${m.team1} ${p1}, ${m.team2} ${p2}`}>
      <div className="barw"><div className="b1" style={{ width: `${(p1 / tot) * 100}%` }} /><div className="b2" style={{ width: `${(p2 / tot) * 100}%` }} /></div>
      <div className="lb"><span>{a}% · {p1} tipp</span><span>{p2} tipp · {100 - a}%</span></div>
    </div>
  );
}

export default function MatchCard({ m, tip, stat, user, now, onPick, onNeedLogin, i = 0 }) {
  const [ref, vis] = useInView();
  const ko = new Date(m.kickoff).getTime();
  const decided = m.winner === 1 || m.winner === 2;
  const locked = decided || ko <= now;
  const pick = tip?.pick;
  const opts = seriesOptions(m.format, pick);

  const click = (side) => () => {
    if (locked) return;
    if (!user) return onNeedLogin();
    if (pick === side) return;
    onPick(m.id, side, opts.length ? null : undefined);
  };

  const team = (side) => {
    const name = side === 1 ? m.team1 : m.team2;
    const cls = ['team', `t${side}`, pick === side ? 'on' : '', decided ? (m.winner === side ? 'win' : 'lose') : ''].join(' ');
    const label = locked ? `${name}${pick === side ? ' – a tipped' : ''}${decided && m.winner === side ? ' – győztes' : ''}` : `Tipp: ${name} nyer`;
    return (
      <button type="button" className={cls} onClick={click(side)} disabled={locked} aria-pressed={pick === side} aria-label={label}>
        <TeamBadge name={name} side={side} size="sm" />
        <span className="nm">{name}</span>
        {decided && <span className="sc">{side === 1 ? m.score1 : m.score2}</span>}
        <span className="ck"><Check size={15} /></span>
      </button>
    );
  };

  const r = tipResult(m, tip);

  return (
    <article ref={ref} data-rv="" className={`card rv${vis ? ' vis' : ''}${locked ? ' locked' : ''}${decided ? ' done' : ''}`} style={{ '--i': i % 3 }}>
      <div className="meta">
        <span className="gtag">{gameName(m.game)}</span>
        <span className="round">{m.round} · {m.format}</span>
        <span className="when">
          <b>{decided ? fmtDay(m.kickoff) : fmtTime(m.kickoff)}</b>
          {decided ? <span className="st">Vége</span>
            : locked ? <span className="st live"><i className="dot" /> Élő · lezárva</span>
            : ko - now < 36 * 3600000 ? <span className="st soon"><Clock size={12} /> Zárás: {left(ko - now)}</span>
            : <span className="st">Kezdésig nyitva</span>}
        </span>
      </div>

      <div className="vs">{team(1)}{team(2)}</div>

      {!locked && opts.length > 0 && (
        <div className="series">
          <span>Pontos állás (+{m.exact_bonus} pont):</span>
          {opts.map((o) => (
            <button key={o} type="button" className="chip" aria-pressed={tip?.series === o} onClick={() => onPick(m.id, pick, tip?.series === o ? null : o)}>{o}</button>
          ))}
        </div>
      )}

      {locked && <Dist m={m} stat={stat} />}

      <div className="foot">
        {r && <span className={`res ${r.ok ? 'ok' : 'bad'}`}>{r.ok ? <><Check size={13} /> +{r.pts} pont{r.exact ? ' · pontos állás' : ''}</> : '0 pont'}</span>}
        {decided && !pick && <span>Nem tippeltél</span>}
        {!decided && pick && !locked && <span>Tipped elmentve – a kezdésig módosíthatod.</span>}
        {!decided && pick && locked && <span><Lock size={13} /> Tipped: {pick === 1 ? m.team1 : m.team2}{tip.series ? ` (${tip.series})` : ''}</span>}
        {!pick && !locked && <span>{user ? 'Válaszd ki, szerinted ki nyer.' : 'Lépj be a tippeléshez.'}</span>}
        {!pick && locked && !decided && <span>Erre a meccsre nem tippeltél.</span>}
        <span className="cnt">{stat?.total ? `${stat.total} tippelő` : ''}</span>
      </div>
    </article>
  );
}
