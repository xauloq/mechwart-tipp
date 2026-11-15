'use client';
import { useEffect, useRef, useState } from 'react';
import TeamBadge from './TeamBadge';
import { Check, Lock, ChevL, Chev, ArrowDown } from './icons';
import { Dist, fmtTime, gameName, seriesOptions } from './MatchCard';

const TZ = 'Europe/Budapest';
const dayKey = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: TZ });
const undecided = (m) => !(m.winner === 1 || m.winner === 2);

function whenText(iso, now) {
  const k = dayKey(iso), time = fmtTime(iso);
  if (k === dayKey(now)) return `ma ${time}`;
  if (k === dayKey(now + 86400000)) return `holnap ${time}`;
  return `${new Date(iso).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long', timeZone: TZ })} ${time}`;
}

function Countdown({ ms }) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const p = (n) => String(n).padStart(2, '0');
  const units = [...(d > 0 ? [[String(d), 'nap']] : []), [p(h), 'óra'], [p(m), 'perc'], [p(s), 'mp']];
  return (
    <div className={`hcd n${units.length}`} role="timer" aria-label={`A tippelés zárásáig ${d} nap ${h} óra ${m} perc`}>
      {units.map(([v, l], i) => (
        <div className="hcu" key={l} aria-hidden="true">{i > 0 && <i>:</i>}<div><b>{v}</b><span>{l}</span></div></div>
      ))}
    </div>
  );
}

// Az első képernyő: a legközelebbi meccs nagyban. Ha aznap több meccs van, lapozni lehet köztük.
export default function Hero({ matches, tips, stats, user, now, ready, onPick, onNeedLogin }) {
  const open = matches.filter(undecided);
  const next = open.find((m) => new Date(m.kickoff).getTime() > now) || null;
  const anchor = next || open[open.length - 1] || null;                 // ha épp minden megy, az utolsó élő meccs
  const list = anchor ? open.filter((m) => dayKey(m.kickoff) === dayKey(anchor.kickoff)) : [];
  const [sel, setSel] = useState(null);                                 // kézzel lapozott meccs; null = a legközelebbit követi
  const cur = list.find((m) => m.id === sel) || anchor;
  const idx = cur ? list.findIndex((m) => m.id === cur.id) : -1;
  const go = (d) => {
    if (list.length < 2) return;
    setSel(list[(idx + d + list.length) % list.length].id);
  };
  const goRef = useRef(go);
  goRef.current = go;

  // ← → billentyűk, amíg a hero látszik és nem űrlapmezőben vagyunk
  const root = useRef(null);
  useEffect(() => {
    if (list.length < 2) return;
    const key = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const r = root.current?.getBoundingClientRect();
      if (!r || r.bottom < 160) return;
      goRef.current(e.key === 'ArrowRight' ? 1 : -1);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [list.length]);

  // húzás telefonon
  const touch = useRef(null);
  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null;
    if (!s) return;
    const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? 1 : -1);
  };

  if (!ready) return <section className="hero" aria-busy="true" />;
  if (!cur) {
    return (
      <section className="hero">
        <div className="hero-body">
          <div className="hero-kick"><span>MECHWART ESPORT BAJNOKSÁG</span></div>
          <h2 className="hero-empty">Most nincs nyitott meccs</h2>
          <p className="hero-sub">A következő kör párosítása hamarosan érkezik. Addig nézd meg, hol állsz a ranglistán!</p>
        </div>
        <div className="hero-foot"><a className="hero-down" href="#tartalom"><ArrowDown size={16} /> Ranglista és eredmények</a></div>
      </section>
    );
  }

  const m = cur, tip = tips[m.id], stat = stats[m.id], pick = tip?.pick;
  const ko = new Date(m.kickoff).getTime(), locked = ko <= now;
  const opts = seriesOptions(m.format, pick);
  const long = Math.max(m.team1.length, m.team2.length) > 15;      // hosszú névnél mindkét csapat kisebb betűt kap, hogy egyformák maradjanak
  const click = (side) => () => {
    if (locked) return;
    if (!user) return onNeedLogin();
    if (pick === side) return;
    onPick(m.id, side, opts.length ? null : undefined);
  };
  const btn = (side) => {
    const name = side === 1 ? m.team1 : m.team2, on = pick === side;
    return (
      <button type="button" className={`hpick t${side}${on ? ' on' : ''}`} onClick={click(side)} disabled={locked} aria-pressed={on}
        aria-label={locked ? `${name}${on ? ' – a tipped' : ''}` : on ? `A tipped: ${name}` : `Tippelek: ${name} nyer`}>
        {on && <span className="ck"><Check size={15} /></span>}
        <small>{on ? 'Tipped' : 'Tippelek'}</small><span>{name}</span>
      </button>
    );
  };

  return (
    <section className="hero" ref={root} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-roledescription={list.length > 1 ? 'lapozható' : undefined}>
      <div className="hero-body" key={m.id}>
        <div className="hero-kick">
          <span className="gtag">{gameName(m.game)}</span>
          <span>{locked ? 'MOST MEGY' : m.id === next?.id ? 'KÖVETKEZŐ MECCS' : 'KÉSŐBB'}</span>
        </div>
        <p className="hero-sub">{m.round} · {m.format} · {whenText(m.kickoff, now)}</p>

        <div className="hero-vs">
          <div className={`hero-team t1${long ? ' long' : ''}`}><TeamBadge name={m.team1} side={1} size="lg" /><h2>{m.team1}</h2></div>
          <span className="hero-x" aria-hidden="true">vs</span>
          <div className={`hero-team t2${long ? ' long' : ''}`}><TeamBadge name={m.team2} side={2} size="lg" /><h2>{m.team2}</h2></div>
        </div>

        {locked ? (
          <div className="hero-live"><b><i className="dot" /> Élő</b><span><Lock size={14} /> A tippelés lezárult{pick ? ` · tipped: ${pick === 1 ? m.team1 : m.team2}${tip.series ? ` (${tip.series})` : ''}` : ''}</span></div>
        ) : (
          <>
            <div className="hero-cap">A tippelés zárásáig</div>
            <Countdown ms={ko - now} />
          </>
        )}

        {!locked && <div className="hero-pick" role="group" aria-label="Szerinted ki nyer?">{btn(1)}{btn(2)}</div>}

        {!locked && opts.length > 0 && (
          <div className="series center">
            <span>Pontos állás (+{m.exact_bonus} pont):</span>
            {opts.map((o) => (
              <button key={o} type="button" className="chip" aria-pressed={tip?.series === o} onClick={() => onPick(m.id, pick, tip?.series === o ? null : o)}>{o}</button>
            ))}
          </div>
        )}

        {locked && <div className="hero-dist"><Dist m={m} stat={stat} /></div>}

        <p className="hero-meta">
          {stat?.total ? `${stat.total} tippelő` : 'Legyél te az első tippelő'}
          {!locked && (pick ? ' · a kezdésig módosíthatod' : user ? '' : ' · a tippeléshez lépj be Discorddal')}
        </p>
      </div>

      <div className="hero-foot">
        {list.length > 1 && (
          <div className="pager" role="group" aria-label="Lapozás a nap meccsei között">
            <button type="button" className="pg" onClick={() => go(-1)} aria-label="Előző meccs"><ChevL size={18} /></button>
            <div className="dots">
              {list.map((x, i) => (
                <button key={x.id} type="button" className="pd" aria-current={i === idx} onClick={() => setSel(x.id)}
                  aria-label={`${i + 1}. meccs: ${x.team1} – ${x.team2}, ${fmtTime(x.kickoff)}`} />
              ))}
            </div>
            <button type="button" className="pg" onClick={() => go(1)} aria-label="Következő meccs"><Chev size={18} /></button>
          </div>
        )}
        <a className="hero-down" href="#tartalom"><ArrowDown size={16} /> Összes meccs és ranglista</a>
      </div>
    </section>
  );
}
