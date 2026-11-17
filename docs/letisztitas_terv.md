# Tippverseny – letisztítás („Apple-szint”) terve

> Munkadokumentum. Állapot: **tervezés**, kód még nem változik. Készült: 2026. nov. 17.
> Ez a 2. lépés a nov. 15-én élesített új arculat után (lásd `docs/arculat_frissites_terv.md`). Az alapok (sötét téma, Inter, piros–kék, liquid glass, ~1440 px széles hasáb) **maradnak**; most nem új effektek jönnek, hanem elhagyás és rendrakás.
>
> ⚠️ Az élő oldal (production, `main`) nem változhat, amíg jóvá nem hagyjuk. Minden a **`letisztitas`** ágon készül, a Vercel ebből előnézeti címet ad.

---

## 1. Az elv egy mondatban

**Kevesebb dolog, mindegyik egyszer.** Minden képernyőn egy főszereplő, minden információ csak egyszer szerepel, a színeknek jelentésük van, a szöveg rövid és emberi.

Referencia: az **Apple Sports** alkalmazás (meccslista sorokban, nagy számok, nagyon kevés címke) és az apple.com termékoldalak (sok levegő, kevés betűméret).

## 2. Döntések (nov. 17.)

| Kérdés | Döntés |
|---|---|
| Hova kerül a főnyeremény? | ✅ Vékony sor a meccslista fölött (kis kép + egy mondat) |
| Mit lát a még be nem lépett, új látogató? | ✅ Egy mondat + „Belépés Discorddal” gomb a nagy meccs alatt |
| Hol vannak a lejátszott meccsek? | ✅ Külön **Eredmények** fül |
| Hogyan tippel a listában? | ✅ A csapatnévre koppint; a választott csapat kiszíneződik |
| Futó hírsáv | ✅ **Megszűnik** (a hero és a lista már mutatja a következő meccseket) |
| Színátmenetes „Tippverseny” felirat | ✅ Megszűnik |

## 3. Ami kikerül

- [ ] **Bemutatkozó blokk** a hero alatt (nagy „Mechwart Tippverseny” cím, leírás, nagy főnyeremény-kártya) – `app/page.js` `.intro`, `components/Prize.js` mostani formája
- [ ] **Hírsáv** – `components/Ticker.js` és a `.ticker` stílusok (a fájl törölhető)
- [ ] **Színátmenetes szöveg** (`.hl`)
- [ ] **Ismétlődő címkék a meccskártyákon**: a „CS2/LoL” jelölő, a forduló neve és a „Bo1” minden kártyán – ezek a nap fejlécébe kerülnek, egyszer
- [ ] **Nagybetűs, ritkított címkék** szinte mindenhol (lásd 6. pont)
- [ ] **Magyarázó mondatok**, amelyeket a felület maga is elmond (pl. „Válaszd ki, szerinted ki nyer.”, „Tipped elmentve – a kezdésig módosíthatod.”)
- [ ] **„Tippelek” felirat a tippgombokon** – a gomb csak a csapatnevet mutatja

## 4. Az oldal új felépítése

```
┌ fejléc (lebegő üveg-kapszula) ─────────────────────────────┐
│  Mechwart Tippverseny                    [avatar] / Belépés │
└────────────────────────────────────────────────────────────┘

  HERO (első képernyő, mint most, de csendesebb)
     CS2 · Svájci 2. kör · ma 17:15                ← egy sor, kisbetűs
     (RF)  Rumogló FC      vs      Spray & Pray  (SP)
                  02 : 13 : 58
                  óra   perc   mp                  ← kis, halvány, kisbetűs
     [ Rumogló FC ]   [ Spray & Pray (S&P) ]       ← csak a név
     61 tippelő                                     ← egy halvány sor
     ‹ ● ○ ○ ›

  belépve:      12 pont · 4. hely · 7 tipp          ← EGY vékony sor, nem 3 kártya
  kilépve:      Tippelj a meccsekre, és legyél a szezon Tippkirálya.  [Belépés Discorddal]

  ┌ Főnyeremény: Cyberpunk 2077 · a szezon Tippkirályának  [kép] ┐   ← vékony sor

  [ Meccsek | Eredmények | Ranglista | Szabályok ]   ← üveg szegmensvezérlő

  Vasárnap, dec. 6. · CS2 · Svájci 2. kör · Bo1      ← napfejléc, egyszer
  ────────────────────────────────────────────────
  16:00   (PP) Perui pánsíposok      (Ü) ÜssFuss!         2 óra múlva zár
  17:15   (RF) Rumogló FC        ✓   (SP) Spray & Pray    61 tippelő
  18:30   (CC) CCNA Certified F.     (KM) knb miracles    Élő
  ────────────────────────────────────────────────

  lábléc
```

### 4.1 Fejléc
- Marad a lebegő üveg-kapszula. A „MECHWART” felső kis felirat elhagyható; a márka: a kis piros–kék jel + „Tippverseny”.
- Belépve: avatar; a név gépen marad, telefonon nem. A Kilépés a fejlécen marad, kis ikonként.

### 4.2 Hero
- Ugyanaz a felépítés és lapozás, mint most, de:
  - a felső két sor (játékjelölő + „KÖVETKEZŐ MECCS”, alatta a forduló) **egy sorrá** olvad: `CS2 · Svájci 2. kör · ma 17:15`. Élő meccsnél elé egy kis piros pont és „Élő”.
  - „A TIPPELÉS ZÁRÁSÁIG” felirat **megszűnik**; az egységek („óra / perc / mp”) kisbetűsek, halványak.
  - a tippgombokon csak a csapatnév; a kiválasztott a csapat színével kitöltve, előtte pipa.
  - alatta egyetlen halvány sor: `61 tippelő` (a „a kezdésig módosíthatod” és a „lépj be” szöveg megszűnik – kilépett látogatónál a gomb megnyomása a belépést kéri, ahogy most).
- A hero alsó részén a lapozó marad; a „↓ Összes meccs és ranglista” link megszűnik (a görgetés magától értetődő).

### 4.3 Saját állás / új látogató
- **Belépve:** egy vékony sor a hero alatt, középre zárva: `12 pont · 4. hely · 7 tipp`. A számok nagyobbak és fehérek, a szavak halványak. A pontszám rövid felfutása (CountUp) marad.
- **Szervezőként:** ugyanitt egy sor: `Szervezőként nem tippelsz · Szervezői felület →`.
- **Kilépve:** egy mondat és egy gomb: `Tippelj a meccsekre, és legyél a szezon Tippkirálya.` · `[Belépés Discorddal]`. Alatta apró szürke szöveg: „A belépéssel elfogadod a részvételi szabályzatot.” (link az ÁSZF-re – ez jogilag kell, maradjon).

### 4.4 Főnyeremény-sor
- Vékony, teljes szélességű üvegsor a fülek fölött: bal oldalt kis kép (a Steam fejlécképe, kb. 120×56, lekerekítve), mellette: **Főnyeremény: Cyberpunk 2077** · „a szezon Tippkirályának”. Nincs külön kártya, nincs arany címke.
- Ha a kép nem töltődik be, csak a szöveg marad.

### 4.5 Fülek
- **Meccsek · Eredmények · Ranglista · Szabályok** (a „Tippek” fül neve **Meccsek** lesz).
- Az üveg szegmensvezérlő marad, görgetéskor a fejléc alatt rögzül.
- A CS2 / LoL / Mind szűrő marad, de kisebb, és csak a Meccsek és Eredmények fülön látszik.

### 4.6 Meccsek fül – lista, nem kártyarács
- Napok szerint csoportosít. **Napfejléc:** `Vasárnap, dec. 6.` + halványan `CS2 · Svájci 2. kör · Bo1`. Ha egy napon vegyes a játék vagy a forduló, a sorban egy kis halvány jelölő mutatja.
- **Egy meccs = egy sor** egy közös üvegpanelen belül, a sorok között vékony elválasztó vonal (mint az iOS-listák):
  - bal: **idő** (nagy, táblázatos számok);
  - közép: a két csapat egymás mellett (gépen) vagy egymás alatt (telefonon), monogram-jelvénnyel. **A csapatnév maga a gomb** (min. 44 px magas érintési terület): koppintásra kitöltődik a csapat színével, pipa jelenik meg;
  - jobb: egy állapot: `2 óra múlva zár` / `Élő` (piros pont) / `61 tippelő` – mindig csak egy, a legfontosabb.
- Bo3/Bo5 meccsnél a pontos állás választó (`2-0`, `2-1`) a sor alatt jelenik meg, csak ha már tippelt.
- Lezárt, még eredmény nélküli meccs: a sor halványabb, a te tipped pipával látszik, a megoszlás vékony sávként a sor alján.

### 4.7 Eredmények fül (új)
- A lejátszott meccsek, legújabb felül, ugyanolyan sorokban, mint a Meccsek fülön.
- Sorban: végeredmény (a győztes fehér, a vesztes halvány), a győztes neve mellett kis zöld pont.
- Jobb oldalt a te eredményed: **`+1`** zöld címke, **`0`** szürke, vagy semmi, ha nem tippeltél. (A „NEM JÖTT BE” felirat megszűnik.)
- A fül tetején egy összefoglaló sor: `9 találat 11 tippből`.
- A megoszlás (hány % tippelt kire) egy vékony sáv a sor alján, halványan.

### 4.8 Ranglista
- A pontcsoportok maradnak (folyamatos helyezés: 1., 2., 3. …).
- Csak finomítás: kevesebb kiemelés – az arany/ezüst/bronz háttérszín helyett csak a helyezés száma színes az első háromnál. A „köztük te” címke és a saját csoport kiemelése marad.
- A „Kattints egy sorra a nevekért” mondat megszűnik; a lenyitó nyíl elég.

### 4.9 Szabályok
- A 6 kártya helyett **egy egyszerű lista** (ikon + cím + 1–2 mondat), egy panelen, sorok között vékony vonallal. Az ÁSZF-link alul marad.

### 4.10 Értesítők, üzenetek, lábléc
- Sütitájékoztató és „Megújult” kártya maradnak (a `RELAUNCH_AT` dátum lejárt, a kártya már nem jelenik meg – ezt nem kell bántani).
- „Tipp mentve” üzenet: maradhat, de rövidebben: `Mentve: Rumogló FC`.
- Lábléc: marad, kisebb logókkal, egy sorban.

## 5. Betöltés
- Amíg az adatok jönnek, **vázlat** látszik (a hero és 3 listasor halvány, szürke körvonala, finom pulzálás nélkül vagy nagyon lassú, `prefers-reduced-motion` esetén mozdulatlan). Ne legyen üres képernyő, és ne „ugorjon” a tartalom, amikor megjön.

## 6. Arculati rendszer (szigorítás)

**Betűméretek – csak ez az 5 (+ a hero nagy számai):**

| Név | Méret (gép / telefon) | Vastagság | Mire |
|---|---|---|---|
| display | hero csapatnevek és visszaszámláló – a mostani `clamp` értékek maradnak | 800 | hero |
| title | 28 / 22 px | 700 | napfejléc, fülek feletti címek |
| body-lg | 17 px | 600 | csapatnevek a listában, gombok |
| body | 15 px | 500 | általános szöveg |
| caption | 13 px | 500 | halvány kiegészítők (tippelők száma, időpont mellett) |

- Nagybetűs, ritkított (`letter-spacing`) címke **legfeljebb egy** képernyőnként; alapból mondatszerű kisbetű.
- Vastagságok: 500, 600, 700, 800 – a 900 megszűnik.

**Lekerekítés – csak kettő:** `999px` (gombok, kapszulák, jelölők) és `20px` (panelek, listák). A 14/18/22/24 px értékek megszűnnek.

**Térköz:** 8 px-es rendszer (4, 8, 12, 16, 24, 32, 48, 64). Szakaszok között 48–64 px.

**Színek – mindegyiknek egy jelentése:**
- piros (`#ec1e24` / `#ff5a5f`): **csak** az 1. csapat és az „Élő” pont;
- kék (`#2f6fd6` / `#79a8ff`): a 2. csapat **és** az elsődleges gomb (Belépés);
- zöld: **csak** „bejött / győztes”;
- arany: **csak** az 1. helyezés a ranglistán;
- minden más: fehér és szürkeárnyalat.

**Mozgás:** marad, ami most van (egyszeri finom előtűnés, tipp-pipa), semmi új.

## 7. Szövegek (mikroszöveg)

| Most | Új |
|---|---|
| KÖVETKEZŐ MECCS | (megszűnik; a sor eleje: `CS2 · Svájci 2. kör · ma 17:15`) |
| A TIPPELÉS ZÁRÁSÁIG | (megszűnik) |
| TIPPELEK / Rumogló FC | Rumogló FC |
| Zárás: 2 ó 13 p | 2 óra múlva zár |
| Zárás: 1 nap 0 ó | holnap zár |
| Élő · lezárva | Élő |
| Kezdésig nyitva | (semmi; csak az idő) |
| Válaszd ki, szerinted ki nyer. | (megszűnik) |
| Tipped elmentve – a kezdésig módosíthatod. | (megszűnik; a pipa jelzi) |
| +1 pont / NEM JÖTT BE | +1 / 0 |
| Tipp mentve: Rumogló FC | Mentve: Rumogló FC |
| Összes meccs és ranglista ↓ | (megszűnik) |
| Tippek (fül) | Meccsek |

## 8. Ami nem változik (szigorú szabályok)

1. Adatbázis, lekérdezések, tippelés, belépés, jogosultságok: **változatlanok**. Nincs SQL.
2. A szervezők továbbra sem tippelhetnek; mások egyéni tippjei nem látszanak, csak az összesített megoszlás (és az is csak a kezdés után, ahogy most).
3. Titkos kulcs nem kerül a kódba.
4. A szervezői oldalak (`/admin`, `/admin/veto`) csak az új alapértékeket (lekerekítés, betűméretek) kapják meg; működésük nem változik.
5. ÁSZF oldal és sütitájékoztató marad.
6. Akadálymentesség: billentyűzettel is használható (a lista csapatgombjai valódi `button`-ök `aria-pressed`-del), látható fókusz, `prefers-reduced-motion`, megfelelő kontraszt (a halvány szövegek is legalább 4.5:1 a háttéren).

## 9. Elfogadási feltételek

- Telefonon (390 px) a hero egy képernyőn elfér, és alatta egy görgetéssel látszik legalább 3 meccssor.
- Egy képernyőn legfeljebb egy nagybetűs, ritkított címke.
- A meccssorokban egy meccsnél se szerepeljen kétszer ugyanaz az információ (játék, forduló, formátum a napfejlécben van).
- Csak a 6. pont színei és lekerekítései fordulnak elő a főoldalon.
- `npm run build` hibátlan; képernyőképek 390 / 768 / 1440 / 1920 px-en, belépve és kilépve, demó módban; vízszintes görgetés sehol.

## 10. Kivitelezés sorrendje

1. Tokenek: betűméretek, lekerekítések, térközök, színek a `globals.css` elején; a régi értékek kiváltása.
2. Hero csendesítése (4.2) és a saját állás / új látogató sor (4.3).
3. Bemutatkozó blokk és hírsáv törlése; főnyeremény-sor (4.4).
4. Fülek átnevezése, Eredmények fül (4.5, 4.7).
5. Meccslista sorokban (4.6) – ez a legnagyobb munka, új komponens (pl. `components/MatchRow.js`), a `MatchCard.js` kiváltása.
6. Ranglista és Szabályok finomítása (4.8, 4.9), vázlat töltés közben (5).
7. Szövegek (7), ellenőrzés (9), képernyőképek, összefoglaló.

## 11. Indító prompt a végrehajtáshoz

```
Szia! A Mechwart Esport Bajnokság tippversenyének weboldalán (mechwartesport.xyz, repó: xauloq/mechwart-tipp) kell egy letisztító átalakítást elvégezned. Magyarul kommunikálj velem.

Valósítsd meg a docs/letisztitas_terv.md tervet a `letisztitas` ágon. A terv 2. pontjában a döntések véglegesek, a 8. pont szabályai kötelezőek, a 10. pont adja a sorrendet, a 9. pont az elfogadási feltételeket. Ha valami ellentmondásos vagy nem kivitelezhető, előbb kérdezz.

Fontos:
- A `main` ághoz (élő oldal) ne nyúlj, ne olvassz be, amíg kifejezetten nem kérem. Csak a `letisztitas` ágra commitolj és pusholj, kis lépésekben.
- Adatbázishoz nem nyúlsz, a tippelés/belépés/jogosultság logikája nem változik.
- Demó módban (Supabase környezeti változók nélkül) tudsz helyben fejleszteni; minden nagyobb lépés után `npm run build`, és küldj képernyőképet 390, 768, 1440 és 1920 px szélességben.
- Az ág Vercel-előnézete: mechwart-tipp-git-letisztitas-gergo-nagys-projects.vercel.app (a Discord-belépés ott is működik).
- A végén rövid összefoglaló: mi változott, mit ellenőrizzek élesítés előtt, hogyan lehet visszaállni.
```
