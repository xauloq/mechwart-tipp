// Budapesti idő <-> ISO átváltás a datetime-local mezőhöz (téli/nyári időszámítással együtt)
export const TZ = 'Europe/Budapest';

const fmt = (ms) => new Date(ms).toLocaleString('sv-SE', { timeZone: TZ, hour12: false }); // "2026-11-06 18:20:00"

export function toLocalInput(iso) {
  if (!iso) return '';
  return fmt(new Date(iso).getTime()).slice(0, 16).replace(' ', 'T');
}

function offsetAt(ms) {
  const [d, t] = fmt(ms).split(' ');
  const [Y, M, D] = d.split('-').map(Number), [h, m, s] = t.split(':').map(Number);
  return Date.UTC(Y, M - 1, D, h % 24, m, s) - Math.floor(ms / 1000) * 1000;
}

export function fromLocalInput(v) {
  const r = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v || '');
  if (!r) return null;
  const wall = Date.UTC(+r[1], r[2] - 1, +r[3], +r[4], +r[5]);
  let ms = wall - offsetAt(wall);
  ms = wall - offsetAt(ms);
  return new Date(ms).toISOString();
}

export const fmtLong = (iso) => new Date(iso).toLocaleString('hu-HU', { timeZone: TZ, month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
