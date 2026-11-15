'use client';
import { useEffect, useRef, useState } from 'react';
import { Crown } from './icons';

// A Steam áruház hivatalos fejlécképe (Cyberpunk 2077, app 1091500)
const IMGS = [
  'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
  'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
];

export default function Prize() {
  const [i, setI] = useState(0);
  const img = useRef(null);
  useEffect(() => {          // ha 6 mp alatt sem töltődik be, a következő forrás / felirat jön
    if (i >= IMGS.length) return;
    const t = setTimeout(() => { const el = img.current; if (el && !(el.complete && el.naturalWidth)) setI((x) => x + 1); }, 6000);
    return () => clearTimeout(t);
  }, [i]);
  return (
    <aside className="prize glass rv" style={{ '--i': 1 }} aria-label="Főnyeremény">
      <div className="prize-img">
        {i < IMGS.length ? (
          <img ref={img} key={i} src={IMGS[i]} alt="Cyberpunk 2077" onError={() => setI(i + 1)} />
        ) : (
          <div className="prize-ph">Cyberpunk 2077</div>
        )}
      </div>
      <div className="prize-foot">
        <span className="pk"><Crown size={14} /> Főnyeremény</span>
        <b>Cyberpunk 2077</b>
        <span>Aki a szezon végén a legtöbb pontot gyűjti, az a Tippkirály, és megkapja a játékot Steamen.</span>
      </div>
    </aside>
  );
}
