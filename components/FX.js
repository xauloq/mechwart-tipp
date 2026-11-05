'use client';
import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lebegő, egymáshoz kapcsolódó pontok a háttérben + az egér körül halvány fény
export function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced()) return;
    const cv = ref.current, g = cv.getContext('2d');
    let w, h, dpr, raf, pts = [], mouse = { x: -999, y: -999 };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      const n = Math.round(Math.min(70, (innerWidth * innerHeight) / 22000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25 * dpr, vy: (Math.random() - .5) * .25 * dpr, r: (Math.random() * 1.4 + .6) * dpr, c: Math.random() < .5 ? '236,30,36' : '121,168,255' }));
    };
    const move = (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; };
    const loop = () => {
      g.clearRect(0, 0, w, h);
      const L = 130 * dpr;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 160 * dpr) { p.x += (p.x - mouse.x) / dm * .6; p.y += (p.y - mouse.y) / dm * .6; }
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < L) { g.strokeStyle = `rgba(150,180,255,${(1 - d / L) * .14})`; g.lineWidth = dpr * .8; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); }
        }
        g.fillStyle = `rgba(${p.c},.55)`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) loop(); };
    resize(); loop();
    addEventListener('resize', resize); addEventListener('pointermove', move); document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', vis); };
  }, []);
  return <canvas ref={ref} className="particles" aria-hidden="true" />;
}

export function Spotlight() {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced()) return;
    let raf, x = innerWidth / 2, y = innerHeight / 3, tx = x, ty = y;
    const move = (e) => { tx = e.clientX; ty = e.clientY; };
    const loop = () => { x += (tx - x) * .08; y += (ty - y) * .08; if (ref.current) ref.current.style.transform = `translate(${x - 300}px, ${y - 300}px)`; raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', move); loop();
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); };
  }, []);
  return <div ref={ref} className="spot" aria-hidden="true" />;
}

// Konfetti-robbanás egy pontból (tipp mentésekor)
export function burst(x, y, colors = ['#ec1e24', '#ff5a5f', '#79a8ff', '#2f6fd6', '#ffffff', '#ffcf4a']) {
  if (reduced()) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti';
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; document.body.appendChild(cv);
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const ps = Array.from({ length: 46 }, () => {
    const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, s: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[(Math.random() * colors.length) | 0], life: 1 };
  });
  const t0 = performance.now();
  const loop = (t) => {
    g.clearRect(0, 0, innerWidth, innerHeight);
    const k = (t - t0) / 1100;
    for (const p of ps) {
      p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.globalAlpha = Math.max(0, 1 - k); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
    }
    if (k < 1) requestAnimationFrame(loop); else cv.remove();
  };
  requestAnimationFrame(loop);
}

// Görgetésre beúszó elemek (.rv → .vis)
export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.rv:not(.vis):not(.card):not(.lr)');
    if (!('IntersectionObserver' in window) || reduced()) { els.forEach((e) => e.classList.add('vis')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Egér követő dőlés + fényfolt kártyákon
export function tilt(e) {
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  el.style.setProperty('--mx', `${px * 100}%`); el.style.setProperty('--my', `${py * 100}%`);
  el.style.setProperty('--rx', `${(0.5 - py) * 5}deg`); el.style.setProperty('--ry', `${(px - 0.5) * 7}deg`);
}
export function untilt(e) {
  const el = e.currentTarget; el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
}

// Egy elemre: látható-e már (React-állapotban, így egy újrarajzolás nem tünteti el)
export function useInView() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || vis) return;
    if (!('IntersectionObserver' in window) || reduced()) { setVis(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    io.observe(el);
    return () => io.disconnect();
  }, [vis]);
  return [ref, vis];
}
