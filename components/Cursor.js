'use client';
import { useEffect, useRef } from 'react';

// Saját kurzor: kis pont + rugalmasan utána úszó gyűrű. A rendes egérmutató is megmarad.
// Csak egérrel működik (telefonon nincs). Csökkentett animációnál a gyűrű késleltetés nélkül követ.
const HOT = '.team, .am-team, a, button, [role=tab], summary, label, input, select, textarea, .card, .prize';

function stateOf(t) {
  let el = t instanceof Element ? t.closest(HOT) : null;
  if (el && el.matches(':disabled')) el = el.parentElement?.closest('.card, .am') || null;
  if (!el) return '';
  if (el.matches('.team.t1, .am-team:not(.r)')) return 'red';
  if (el.matches('.team.t2, .am-team.r')) return 'blue';
  if (el.matches('input:not([type=checkbox]):not([type=radio]), textarea, select')) return 'text';
  if (el.matches('.card, .prize')) return 'card';
  return 'hover';
}

export default function Cursor() {
  const dot = useRef(null), ring = useRef(null);
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const d = dot.current, r = ring.current;
    let x = -100, y = -100, rx = x, ry = y, raf = 0, on = false;
    const show = (v) => { if (v !== on) { on = v; d.classList.toggle('on', v); r.classList.toggle('on', v); } };
    const move = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!on) { rx = x; ry = y; show(true); }
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const s = stateOf(e.target);
      if (r.dataset.s !== s) { r.dataset.s = s; d.dataset.s = s; }
    };
    const loop = () => {
      const k = still ? 1 : 0.2;
      rx += (x - rx) * k; ry += (y - ry) * k;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const down = () => r.classList.add('down');
    const up = () => r.classList.remove('down');
    const out = (e) => { if (!e.relatedTarget) show(false); };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) loop(); };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', down); addEventListener('pointerup', up);
    document.addEventListener('mouseout', out); document.addEventListener('visibilitychange', vis);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move); removeEventListener('pointerdown', down); removeEventListener('pointerup', up);
      document.removeEventListener('mouseout', out); document.removeEventListener('visibilitychange', vis);
    };
  }, []);
  return (
    <>
      <div ref={ring} className="cur-ring" aria-hidden="true"><span /></div>
      <div ref={dot} className="cur-dot" aria-hidden="true"><span /></div>
    </>
  );
}
