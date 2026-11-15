'use client';
import { useEffect, useId, useRef, useState } from 'react';

// Liquid glass felület.
//  • Asztali Chromium-alapú böngészőben (Chrome, Edge, Opera, Brave) valódi fénytörés: a mögötte lévő képet
//    egy SVG-szűrő a peremeknél elhajlítja (feDisplacementMap), enyhe színbontással.
//  • Mindenhol máshol (Safari, Firefox, telefonok) a .glass osztály elmosott üvege marad – ez a CSS-ben van.
let support;
export function canRefract() {
  if (support !== undefined) return support;
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const chromium = /(Chrome|Chromium|Edg)\//.test(ua) && !/Firefox\//.test(ua);   // iOS-en a Chrome is WebKit ("CriOS"), az nem tudja
  const desktop = !/Android|Mobile/i.test(ua);
  let css = false;
  try { css = CSS.supports('backdrop-filter', 'url(#g) blur(1px)'); } catch { /* régi böngésző */ }
  support = chromium && desktop && css;
  return support;
}

// Elmozdítási térkép: a piros csatorna vízszintesen, a kék függőlegesen tolja a képet; a közepe semleges (128),
// így csak a perem „hajlít”, a belseje torzítatlan marad.
function mapFor(w, h, radius, depth) {
  const e = Math.min(depth, Math.min(w, h) / 2 - 1);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient>` +
    `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#00f"/></linearGradient>` +
    `<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${(e / 2).toFixed(1)}"/></filter></defs>` +
    `<rect width="${w}" height="${h}" fill="#000"/><rect width="${w}" height="${h}" fill="url(#r)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#b)" style="mix-blend-mode:screen"/>` +
    `<rect x="${e}" y="${e}" width="${w - 2 * e}" height="${h - 2 * e}" rx="${Math.max(0, radius - e)}" fill="rgb(128,0,128)" filter="url(#s)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function Glass({ as: Tag = 'div', refract = false, depth = 12, strength = 30, blur = 12, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const id = 'lg' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!refract || !canRefract()) return;
    const el = ref.current;
    let last = '';
    const make = () => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (w < 8 || h < 8) return;
      const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
      const key = `${w}x${h}r${radius}`;
      if (key === last) return;
      last = key;
      setMap(mapFor(w, h, radius, depth));
    };
    const ro = new ResizeObserver(make);
    ro.observe(el); make();
    return () => ro.disconnect();
  }, [refract, depth]);

  const bf = map ? `url(#${id}) blur(${blur}px) saturate(1.7)` : undefined;
  const ch = (m, scale, out) => (
    <>
      <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="B" result={`d${out}`} />
      <feColorMatrix in={`d${out}`} type="matrix" values={m} result={out} />
    </>
  );
  return (
    <Tag ref={ref} className={`glass ${className}`} style={map ? { ...style, backdropFilter: bf, WebkitBackdropFilter: bf } : style} {...rest}>
      {map && (
        <svg className="glass-defs" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feImage href={map} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
              {ch('1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', strength, 'cr')}
              {ch('0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', strength * 1.07, 'cg')}
              {ch('0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', strength * 1.14, 'cb')}
              <feBlend in="cr" in2="cg" mode="screen" result="rg" />
              <feBlend in="rg" in2="cb" mode="screen" />
            </filter>
          </defs>
        </svg>
      )}
      {children}
    </Tag>
  );
}
