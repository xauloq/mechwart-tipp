'use client';
import { fmtTime, gameName } from './MatchCard';

const TZ = 'Europe/Budapest';
const day = (iso) => new Date(iso).toLocaleDateString('hu-HU', { weekday: 'short', timeZone: TZ }).replace('.', '');

// Vékony, egysoros hírsáv a közelgő meccsekkel; fölé vitt egérrel megáll
export default function Ticker({ matches }) {
  if (!matches.length) return null;
  const list = matches.slice(0, 12);
  const items = (hidden) => list.map((m) => (
    <span key={m.id} className="tk-it" aria-hidden={hidden || undefined}>
      <time>{day(m.kickoff)} {fmtTime(m.kickoff)}</time>
      <b>{m.team1} – {m.team2}</b>
      <small>{gameName(m.game)}</small>
    </span>
  ));
  return (
    <div className="ticker rv" role="region" aria-label="Közelgő meccsek">
      <div className="tk-track" style={{ animationDuration: `${Math.max(40, list.length * 12)}s` }}>{items(false)}{items(true)}</div>
    </div>
  );
}
