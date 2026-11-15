'use client';
import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Görgetésre egyszer, finoman előtűnő elemek (.rv → .vis) – állandó osztálynevű elemekhez
export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.rv:not(.vis):not([data-rv])');
    if (!('IntersectionObserver' in window) || reduced()) { els.forEach((e) => e.classList.add('vis')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Ugyanez egy elemre, React-állapotban – olyan elemekhez, amelyek osztályneve menet közben változik
// (így egy újrarajzolás nem tünteti el újra)
export function useInView() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || vis) return;
    if (!('IntersectionObserver' in window) || reduced()) { setVis(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    io.observe(el);
    return () => io.disconnect();
  }, [vis]);
  return [ref, vis];
}
