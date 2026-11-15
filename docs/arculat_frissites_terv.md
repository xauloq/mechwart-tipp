# Tippverseny – arculatfrissítés terve

> Munkadokumentum: szabadon írd át, húzz ki belőle, írj mellé. A `[ ]` jelölőnégyzetek mellé tegyél `x`-et, ha jó; ahol `❓` van, ott döntés kell.
> Állapot: **tervezés**, kód még nem változik.

---

## 1. Cél egy mondatban

Letisztultabb, „prémium” hatású oldal a revolutionmacro.com mintájára: sötét, nyugodt háttér, **liquid glass** felületek, finom **görgetésre előtűnő** elemek. A főszereplő a következő meccs: **nagy visszaszámláló, nagy csapatnevek**.

## 2. Mit veszünk át a revolutionmacro.com-ról

Megnéztem az oldalt (2026. nov. 15.):

| Elem | Náluk | Nálunk |
|---|---|---|
| Háttér | Szinte egyszínű, nagyon sötét kék (`#050915`), legfeljebb halvány pöttyminta | ✅ Átvesszük: a részecskék és az egérkövető fény megszűnik |
| Fejléc | Lebegő, lekerekített „kapszula” sáv. Görgetéskor üveges (elmosott) lesz, és rögzítve marad | ✅ Átvesszük |
| Üveg | Valódi „liquid glass”: SVG-szűrővel torzítja a mögötte lévő képet (Apple-stílus). Ahol ez nem megy, ott sima elmosott üveg | ✅ **Döntve:** valódi fénytörés Chrome/Edge-ben, máshol elmosott üveg |
| Gombok | Kapszula alakú. A fő gomb kék színátmenetes, finom ragyogással; a másodlagos sötét üveg | ✅ Átvesszük, a mi színeinkkel |
| Címek | Nagy, kerek betűtípus (Fredoka), egy-egy szó színes kiemeléssel („The **last macro** you'll ever use”) | Részben: a színes szókiemelést átvesszük, a betű **Inter marad** |
| Szakaszok | Egymás alatt, nagy térközzel. Bal oldalt cím és felsorolás, mellette nagy kép | Részben: nálunk nincs „termékkép”, a meccskártyák és a ranglista a tartalom |
| Animáció | Elemek görgetéskor egyszer, finoman beúsznak (áttűnés + kis elmozdulás). Folyamatos mozgás nincs | ✅ Átvesszük |

## 3. Mit veszünk ki a mostani oldalról

- [ ] **Egyedi kurzor** (`Cursor.js`) – teljesen törlődik, a rendszer kurzora marad
- [ ] **Részecskés háttér** (`Particles`) és **egérkövető fényfolt** (`Spotlight`)
- [ ] **Kártyák billegése** egér alatt (`tilt`)
- [ ] **Konfetti/robbanás** tippeléskor (`burst`)? ❓ Maradjon egy apró visszajelzés, vagy legyen teljesen csendes?
- [ ] Forgó / pulzáló keretek (`@keyframes spin`) a kiválasztott tipp körül
- [ ] **Számláló-felpörgés** (`CountUp`) a pontoknál ❓ maradhat egyszeri, rövid
- [ ] Futó hírsáv (`Ticker`) ❓ maradjon vagy menjen?

**Ami marad, de nyugodtabban:** a görgetésre előtűnés (egyszer, 300–400 ms, kis elmozdulás), a gombok hover-állapota, és a fülek közti váltás. A `prefers-reduced-motion` beállításnál minden animáció kikapcsol.

## 4. Új oldalszerkezet (vázlat)

### Gépen (≥ 1024 px): az első képernyő teljes szélességű és teljes magasságú

```
┌──────────────────────────────────────────────────────────────┐
│  [lebegő üveg-fejléc:  MECHWART Tippverseny   …   Belépés ]   │
│                                                              │
│                 KÖVETKEZŐ MECCS · CS2 · Svájci 2. kör        │
│                                                              │
│     RUMOGLÓ FC            vs            SPRAY & PRAY         │  ← nagy csapatnevek
│     (logo?)                              (logo?)              │
│                                                              │
│              02 : 14 : 37 : 09                               │  ← óriás visszaszámláló
│              nap   óra   perc  mp                            │
│                                                              │
│      [ Tippelek: Rumogló ]   [ Tippelek: S&P ]  ← üveggombok  │
│                    61 tippelő · 41% – 59%                    │
│                                                              │
│                         ↓ görgess                            │
└──────────────────────────────────────────────────────────────┘
   ↓ görgetésre beúsznak:
   [ Pontod · Helyezés · Tipped ]   (üvegkártyák egy sorban)
   [ Tippek | Ranglista | Szabályok ]   (üveg fülsáv, rögzül görgetéskor?)
   [ meccskártyák rácsban, 2–3 oszlop, kitölti a szélességet ]
   [ lábléc ]
```

- **„Töltse ki az egész felületet”:** ✅ **Döntve:** széles, de korlátos hasáb. Kis gépen teljes szélességű, 1440 px fölött középre zárt. A hero háttere ettől függetlenül kifut a képernyő széléig.
- A hero **100vh** magas, a visszaszámláló és a csapatnevek a képernyő közepén vannak.

### Telefonon (< 640 px)

- A csapatnevek egymás alá kerülnek, középen „vs”, a visszaszámláló teljes szélességű, de továbbra is a legnagyobb elem.
- A tippgombok teljes szélességűek, egymás alatt.
- A fejléc kompakt marad: logó és Belépés/avatar.
- A meccskártyák egy oszlopban jelennek meg.

## 5. Arculati alapok (javaslat, átírható)

- **Háttér:** egyszínű `#050915`-höz közeli sötétkék, legfeljebb egy nagyon halvány, mozdulatlan színátmenet felül (a Mechwart piros–kék fényéből).
- **Színek:** marad a Mechwart **piros** (`#ec1e24`) és **kék** (`#2f6fd6`). A csapat1 piros, a csapat2 kék, ahogy a streamen is. A fő gomb a Mechwart-kék, piros csak kiemelésre. ✅ **Döntve:** a piros–kék páros marad.
- **Üveg:** `rgba(255,255,255,.06)` alap, `backdrop-filter: blur(16px) saturate(1.6)`, 1 px világos felső szegély (fényvisszaverődés), nagy lekerekítés (20–28 px).
- **Betű:** ✅ **Döntve:** Inter marad (egyezik a stream-grafikákkal). A címek nagyobbak és vastagabbak lesznek.
- **Számok:** a visszaszámláló táblázatos számokkal (`tabular-nums`), hogy ne ugráljon.

## 6. Nyitott kérdések (válaszolj ide, vagy a chatben)

~~1–4.~~ **Eldöntve (nov. 15.):** valódi fénytörés + tartalék · Inter · piros–kék · korlátos széles hasáb (~1440 px)

5. **Hero tartalma:** csak a legközelebbi meccs legyen kint, vagy egy napon több meccs esetén lapozható (← →)?
6. **Csapatlogók:** vannak csapatlogóink, vagy kezdőbetűs „jelvény” legyen helyettük?
7. **Hírsáv** és **konfetti**: maradjon / menjen?
8. **LoL-meccsek:** ugyanígy jelenjenek meg, vagy kapjanak saját színt/jelölést?

## 7. Kivitelezés lépései (ha a terv kész)

1. Takarítás: kurzor, részecskék, spotlight, tilt, felesleges keyframe-ek törlése.
2. Új alapok: színek, betű, üvegkomponens (`Glass`), gombok.
3. Új hero: nagy meccs, visszaszámláló, tippgombok.
4. Fejléc, fülek, kártyák átállítása üvegre, görgetéses előtűnés.
5. Reszponzív finomhangolás (390 px, 768 px, 1440 px, 1920 px), és mozgás nélküli mód.
6. Előnézet képernyőképekkel, csak utána élesítés (Vercel).

A szervezői felület (`/admin`, `/admin/veto`) csak az új alapszíneket és gombokat kapja meg, a felépítése nem változik.
