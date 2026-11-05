'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Tájékoztató (nem hozzájárulás-kérő) sáv: az oldal csak a működéshez feltétlenül szükséges adatot tárol,
// erre a jogszabály szerint nem kell engedélyt kérni – csak tájékoztatunk.
const KEY = 'mw-tajekoztatas';

export default function CookieNote() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(KEY) === '1'; } catch { /* privát mód: minden látogatáskor megjelenik */ }
    if (!seen) { const t = setTimeout(() => setShow(true), 900); return () => clearTimeout(t); }
  }, []);
  if (!show) return null;
  const ok = () => { try { localStorage.setItem(KEY, '1'); } catch {} setShow(false); };
  return (
    <div className="cnote" role="region" aria-label="Tájékoztatás az adattárolásról">
      <p><b>Sütik?</b> Nálunk csak a belépve maradáshoz szükséges adat kerül a böngésződbe. Követő- és reklámsütiket nem használunk.</p>
      <div className="cnote-a">
        <Link href="/aszf/#adatkezeles" onClick={ok}>Részletek</Link>
        <button type="button" className="btn sm" onClick={ok}>Rendben</button>
      </div>
    </div>
  );
}
