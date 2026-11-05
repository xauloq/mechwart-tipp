'use client';
import { useEffect, useRef, useState } from 'react';
import { tilt, untilt } from './FX';
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
    <div className="prize in" style={{ '--i': 3 }} onPointerMove={tilt} onPointerLeave={untilt}>
      <div className="prize-in">
        <div className="prize-head"><span className="pk"><Crown size={14} /> FŐNYEREMÉNY</span><span className="pk2">A szezon Tippkirályának</span></div>
        <div className="prize-img">
          {i < IMGS.length ? (
            <img ref={img} key={i} src={IMGS[i]} alt="Cyberpunk 2077" onError={() => setI(i + 1)} loading="eager" />
          ) : (
            <div className="prize-ph">CYBERPUNK 2077</div>
          )}
          <span className="glint" aria-hidden="true" />
        </div>
        <div className="prize-foot">
          <b>Cyberpunk 2077</b>
          <span>Aki a szezon végén a legtöbb pontot gyűjti, megkapja a játékot Steamen.</span>
        </div>
      </div>
    </div>
  );
}
