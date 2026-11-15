'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Glass from './Glass';
import { RELAUNCH_AT, RELAUNCH_DAYS } from '../lib/relaunch';

// Alsó értesítőkártyák, egyszerre mindig csak egy:
//  1. adattárolási tájékoztató (nem hozzájárulás-kérő: csak a működéshez szükséges adatot tárolunk),
//  2. utána – az élesítést követő néhány napig, látogatónként egyszer – „Megújult a Tippverseny”.
const COOKIE_KEY = 'mw-tajekoztatas';
const NEW_KEY = 'mw-uj-arculat';
const get = (k) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };   // privát módban minden látogatáskor megjelenik
const set = (k) => { try { localStorage.setItem(k, '1'); } catch { /* nem baj */ } };

function relaunchActive() {
  if (typeof location !== 'undefined' && location.hash === '#megujult') return true;       // kézi előnézet teszteléshez
  const t0 = RELAUNCH_AT ? Date.parse(RELAUNCH_AT) : NaN;
  return Number.isFinite(t0) && Date.now() >= t0 && Date.now() < t0 + RELAUNCH_DAYS * 86400000;
}

export default function Notices() {
  const home = usePathname() === '/';
  const [show, setShow] = useState(null);          // 'cookie' | 'new' | null

  const pick = () => (!get(COOKIE_KEY) ? 'cookie' : home && relaunchActive() && !get(NEW_KEY) ? 'new' : null);
  useEffect(() => {
    const t = setTimeout(() => setShow(pick()), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home]);

  if (!show) return null;
  const close = (key) => () => { set(key); setShow(null); setTimeout(() => setShow(pick()), 500); };

  if (show === 'cookie') {
    return (
      <Glass refract className="note float" role="region" aria-label="Tájékoztatás az adattárolásról">
        <p><b>Sütik?</b> Nálunk csak a belépve maradáshoz szükséges adat kerül a böngésződbe. Követő- és reklámsütiket nem használunk.</p>
        <div className="note-a">
          <Link href="/aszf/#adatkezeles" onClick={close(COOKIE_KEY)}>Részletek</Link>
          <button type="button" className="btn sm" onClick={close(COOKIE_KEY)}>Rendben</button>
        </div>
      </Glass>
    );
  }
  return (
    <Glass refract className="note float" role="region" aria-label="Megújult az oldal">
      <p><b>Megújult a Tippverseny!</b> Új kinézet, nagyobb visszaszámláló, átláthatóbb ranglista.</p>
      <div className="note-a"><button type="button" className="btn sm" onClick={close(NEW_KEY)}>Rendben</button></div>
    </Glass>
  );
}
