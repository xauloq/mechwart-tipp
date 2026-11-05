'use client';
import { fmtTime } from './MatchCard';

const TZ = 'Europe/Budapest';
const day = (iso) => new Date(iso).toLocaleDateString('hu-HU', { weekday: 'short', timeZone: TZ }).replace('.', '');

// végtelenített futószalag a közelgő meccsekkel
export default function Ticker({ matches }) {
  if (!matches.length) return null;
  const items = matches.slice(0, 12).map((m) => (
    <span key={m.id} className="tk-it">
      <i className={`tk-g ${m.game}`}>{m.game === 'cs2' ? 'CS2' : 'LOL'}</i>
      <b>{m.team1}</b><em>vs</em><b>{m.team2}</b>
      <small>{day(m.kickoff)} {fmtTime(m.kickoff)}</small>
    </span>
  ));
  return (
    <div className="ticker rv" aria-label="Közelgő meccsek">
      <div className="tk-tag"><span className="live" /> KÖVETKEZŐ</div>
      <div className="tk-w"><div className="tk-track" style={{ animationDuration: `${Math.max(24, matches.length * 7)}s` }}>{items}{items}</div></div>
    </div>
  );
}
