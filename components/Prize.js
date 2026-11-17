'use client';
import { useEffect, useRef, useState } from 'react';

// A Steam áruház hivatalos fejlécképe (Cyberpunk 2077, app 1091500)
const IMGS = [
  'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
  'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
];

// Vékony főnyeremény-sor: kis kép + egy mondat
export default function Prize() {
  const [i, setI] = useState(0);
  const img = useRef(null);
  useEffect(() => {          // ha 6 mp alatt sem töltődik be, a következő forrás jön, végül kép nélkül marad
    if (i >= IMGS.length) return;
    const t = setTimeout(() => { const el = img.current; if (el && !(el.complete && el.naturalWidth)) setI((x) => x + 1); }, 6000);
    return () => clearTimeout(t);
  }, [i]);
  return (
    <aside className="prize rv" aria-label="Főnyeremény">
      {i < IMGS.length && <img ref={img} key={i} src={IMGS[i]} alt="" onError={() => setI(i + 1)} />}
      <p><b>Főnyeremény: Cyberpunk 2077</b><span>a szezon Tippkirályának</span></p>
    </aside>
  );
}
