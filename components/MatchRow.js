'use client';
import { Check, Lock } from './icons';
import TeamBadge from './TeamBadge';

const TZ = 'Europe/Budapest';
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
export const fmtDay = (iso) => new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', timeZone: TZ });
export const gameName = (g) => (g === 'cs2' ? 'CS2' : 'LoL');
export const dayKey = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: TZ });
export const decidedOf = (m) => m.winner === 1 || m.winner === 2;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const dayTitle = (iso) => `${cap(new Date(iso).toLocaleDateString('hu-HU', { weekday: 'long', timeZone: TZ }))}, ${fmtDay(iso)}`;

// „2 óra múlva zár”, „holnap zár”, „3 nap múlva zár”
export function closeText(ko, now) {
  const ms = ko - now;
  if (ms <= 0) return 'Élő';
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `${min} perc múlva zár`;
  if (ms < 20 * 3600000) return `${Math.round(ms / 3600000)} óra múlva zár`;
  const days = Math.round((Date.parse(dayKey(ko)) - Date.parse(dayKey(now))) / 86400000);
  return days <= 1 ? 'holnap zár' : `${days} nap múlva zár`;
}

export function seriesOptions(format, pick) {
  const n = format === 'Bo5' ? 3 : format === 'Bo3' ? 2 : 0;
  if (!n || !pick) return [];
  const out = [];
  for (let l = 0; l < n; l++) out.push(pick === 1 ? `${n}-${l}` : `${l}-${n}`);
  return out;
}

export function tipResult(m, tip) {
  if (!decidedOf(m) || !tip?.pick) return null;
  const ok = tip.pick === m.winner;
  const exact = ok && m.exact_bonus > 0 && tip.series === `${m.score1}-${m.score2}`;
  return { ok, exact, pts: ok ? m.points + (exact ? m.exact_bonus : 0) : 0 };
}

// Tippek megoszlása: vékony piros–kék sáv (csak a kezdés után van adat)
export function Dist({ m, stat, compact = false }) {
  const p1 = stat?.pick1, p2 = stat?.pick2, tot = (p1 ?? 0) + (p2 ?? 0);
  if (!tot) return null;
  const a = Math.round((p1 / tot) * 100);
  return (
    <div className={`dist${compact ? ' compact' : ''}`} role="img" aria-label={`Tippek megoszlása: ${m.team1} ${a}%, ${m.team2} ${100 - a}%`}>
      <div className="barw"><div className="b1" style={{ width: `${a}%` }} /><div className="b2" style={{ width: `${100 - a}%` }} /></div>
      {!compact && <div className="lb"><span>{a}%</span><span>{100 - a}%</span></div>}
    </div>
  );
}

// a nap fejléce alatt egyszer kiírt közös adatok (játék · forduló · formátum), ha mindegyik meccsnél ugyanaz
export function commonMeta(list) {
  const same = (f) => list.every((m) => f(m) === f(list[0]));
  const parts = [];
  if (same((m) => m.game)) parts.push(gameName(list[0].game));
  if (same((m) => m.round)) parts.push(list[0].round);
  if (same((m) => m.format)) parts.push(list[0].format);
  return { text: parts.join(' · '), game: same((m) => m.game), round: same((m) => m.round), format: same((m) => m.format) };
}

function Row({ m, tip, stat, user, now, onPick, onNeedLogin, common, result }) {
  const ko = new Date(m.kickoff).getTime();
  const decided = decidedOf(m);
  const locked = decided || ko <= now;
  const pick = tip?.pick;
  const opts = locked ? [] : seriesOptions(m.format, pick);
  const r = result ? tipResult(m, tip) : null;
  // ami a nap fejlécéből hiányzik, az a sorban jelenik meg
  const own = [!common.game && gameName(m.game), !common.round && m.round, !common.format && m.format].filter(Boolean).join(' · ');

  const click = (side) => () => {
    if (locked) return;
    if (!user) return onNeedLogin();
    if (pick === side) return;
    onPick(m.id, side, seriesOptions(m.format, side).length ? null : undefined);
  };
  const team = (side) => {
    const name = side === 1 ? m.team1 : m.team2, on = pick === side;
    const cls = ['rt', `t${side}`, on ? 'on' : '', decided ? (m.winner === side ? 'win' : 'lose') : ''].join(' ');
    const label = locked ? `${name}${on ? ' – a tipped' : ''}${decided && m.winner === side ? ' – győztes' : ''}` : `${name} nyer`;
    return (
      <button type="button" className={cls} onClick={click(side)} disabled={locked} aria-pressed={on} aria-label={label}>
        <TeamBadge name={name} side={side} size="sm" />
        <span className="nm">{name}</span>
        {decided && <span className="sc">{side === 1 ? m.score1 : m.score2}</span>}
        {on && <span className="ck" aria-hidden="true"><Check size={14} /></span>}
      </button>
    );
  };

  let status;
  if (result) status = r ? <span className={`rpts ${r.ok ? 'ok' : 'no'}`}>{r.ok ? `+${r.pts}` : '0'}</span> : null;
  else if (ko <= now) status = <span className="st live"><i className="dot" /> Élő</span>;
  else if (ko - now < 36 * 3600000) status = <span className="st soon">{closeText(ko, now)}</span>;
  else status = stat?.total ? <span className="st">{stat.total} tippelő</span> : null;

  return (
    <li className={`mrow${locked && !decided ? ' locked' : ''}${result ? ' res' : ''}`}>
      <div className="mt">
        <b>{fmtTime(m.kickoff)}</b>
        {own && <small>{own}</small>}
      </div>
      <div className="mteams" role="group" aria-label={`${m.team1} – ${m.team2}`}>{team(1)}{team(2)}</div>
      <div className="mst">{status}</div>
      {opts.length > 0 && (
        <div className="mx series">
          <span>Pontos állás (+{m.exact_bonus}):</span>
          {opts.map((o) => (
            <button key={o} type="button" className="chip" aria-pressed={tip?.series === o} onClick={() => onPick(m.id, pick, tip?.series === o ? null : o)}>{o}</button>
          ))}
        </div>
      )}
      {locked && !decided && pick && <div className="mx mnote"><Lock size={12} /> Tipped: {pick === 1 ? m.team1 : m.team2}{tip.series ? ` (${tip.series})` : ''}</div>}
      {locked && <div className="mx"><Dist m={m} stat={stat} compact /></div>}
    </li>
  );
}

// Egy nap meccsei egy panelen, sorokban
export function MatchDay({ list, title, tips, stats, user, now, onPick, onNeedLogin, result = false }) {
  const common = commonMeta(list);
  return (
    <section className="mday rv">
      <header className="mdh"><h2>{title}</h2>{common.text && <span>{common.text}</span>}</header>
      <ul className="mlist">
        {list.map((m) => (
          <Row key={m.id} m={m} tip={tips[m.id]} stat={stats[m.id]} user={user} now={now} onPick={onPick} onNeedLogin={onNeedLogin} common={common} result={result} />
        ))}
      </ul>
    </section>
  );
}

export function SkeletonDay() {
  return (
    <section className="mday sk" aria-hidden="true">
      <header className="mdh"><i className="skl" style={{ width: 180, height: 22 }} /></header>
      <ul className="mlist">{[0, 1, 2].map((k) => <li key={k} className="mrow"><i className="skl" style={{ width: 52, height: 20 }} /><div className="mteams"><i className="skl rt" /><i className="skl rt" /></div><div /></li>)}</ul>
    </section>
  );
}
