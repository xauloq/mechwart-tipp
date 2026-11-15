import { monogram } from '../lib/teams';

// Kezdőbetűs csapatjelvény: 1 = piros (csapat1), 2 = kék (csapat2)
export default function TeamBadge({ name, side = 1, size = 'md' }) {
  return <span className={`badge b${side} ${size}`} aria-hidden="true">{monogram(name)}</span>;
}
