# Tippverseny – arculatfrissítés terve

> Munkadokumentum: szabadon írd át, húzz ki belőle, írj mellé. A `[ ]` jelölőnégyzetek mellé tegyél `x`-et, ha jó; ahol `❓` van, ott döntés kell.
> Állapot: **tervezés**, kód még nem változik. Utolsó frissítés: 2026. nov. 15.
>
> ⚠️ **Az élő oldal (production) nem változhat**, amíg a munka nincs kész és jóvá nem hagytuk. Minden az `arculat-terv` ágon készül; lásd 9. pont.

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
- [x] **Konfetti/robbanás** tippeléskor (`burst`) – ✅ megszűnik. Helyette egyszerű visszajelzés: a választott csapat gombja kitöltődik a csapat színével, mellette egy pipa jelenik meg (kb. 200 ms), és egy rövid „Tipp mentve” üzenet.
- [ ] Forgó / pulzáló keretek (`@keyframes spin`) a kiválasztott tipp körül
- [x] **Számláló-felpörgés** (`CountUp`) – ✅ marad, de visszafogottan: egyszer, kb. 600 ms alatt, lassuló mozgással fut fel. Újratöltésnél vagy fülváltásnál nem ismétlődik.
- [x] **Futó hírsáv** (`Ticker`) – ✅ marad, de letisztultabb lesz: vékony, egysoros üvegsáv, lassú, egyenletes futás, egérrel fölé víve megáll. Ikonok, villogás és színes dobozok nélkül, csak „17:00 · Paladins – konzolkábel · LoL” jellegű elemek, köztük egy halvány pont.

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
│     ( R )                                  ( S )              │  ← kezdőbetűs jelvény
│                                                              │
│              02 : 14 : 37 : 09                               │  ← óriás visszaszámláló
│              nap   óra   perc  mp                            │
│                                                              │
│      [ Tippelek: Rumogló ]   [ Tippelek: S&P ]  ← üveggombok  │
│                    61 tippelő · 41% – 59%                    │
│                                                              │
│         ‹   ● ○ ○   ›     ← lapozás az aznapi meccsek között  │
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
- **Mit mutat a hero:** ✅ mindig a legközelebbi, még el nem kezdődött meccset, CS2 és LoL vegyesen. Ha napokig nincs meccs, a visszaszámláló a napokat is mutatja (pl. „18 nap 03:12:40”).
- **Lapozás:** ✅ ha az adott napon több meccs van, lapozni lehet köztük. A nyilakon kívül pöttysor mutatja, hányadiknál tartunk; telefonon húzással is lehet lapozni, gépen a ← → billentyűkkel is. Váltáskor sima áttűnés, csúszkálás nélkül. Automatikusan nem lapoz. Ha csak egy meccs van, a lapozó nem jelenik meg.

### Telefonon (< 640 px)

- A csapatnevek egymás alá kerülnek, középen „vs”, a visszaszámláló teljes szélességű, de továbbra is a legnagyobb elem.
- A tippgombok teljes szélességűek, egymás alatt.
- A fejléc kompakt marad: logó és Belépés/avatar.
- A meccskártyák egy oszlopban jelennek meg.

## 5. Arculati alapok (javaslat, átírható)

- **Téma:** ✅ csak sötét mód (egyezik a streammel, az üveghatás itt mutat jól).
- **Háttér:** egyszínű `#050915`-höz közeli sötétkék, legfeljebb egy nagyon halvány, mozdulatlan színátmenet felül (a Mechwart piros–kék fényéből).
- **Színek:** marad a Mechwart **piros** (`#ec1e24`) és **kék** (`#2f6fd6`). A csapat1 piros, a csapat2 kék, ahogy a streamen is. A fő gomb a Mechwart-kék, piros csak kiemelésre. ✅ **Döntve:** a piros–kék páros marad.
- **Üveg:** `rgba(255,255,255,.06)` alap, `backdrop-filter: blur(16px) saturate(1.6)`, 1 px világos felső szegély (fényvisszaverődés), nagy lekerekítés (20–28 px).
- **Betű:** ✅ **Döntve:** Inter marad (egyezik a stream-grafikákkal). A címek nagyobbak és vastagabbak lesznek.
- **Számok:** a visszaszámláló táblázatos számokkal (`tabular-nums`), hogy ne ugráljon.
- **Csapatjelvény (logó helyett):** ✅ kezdőbetűs, Apple-stílusban, mint a Kontaktok monogramja:
  - kör alakú, finom, csapatszínű (csapat1 piros, csapat2 kék) üvegfelület, közepén 1–2 nagybetű, vékonyabb betűvastagsággal;
  - a betűk: két- vagy többszavas névnél az első két szó kezdőbetűje (Rumogló FC → **RF**, Spray & Pray (S&P) → **SP**), egyszavasnál az első betű (**N**SG → **N**, **d**rift → **D**). A zárójeles részt és az írásjeleket kihagyjuk; a kivételeket egy kis táblában lehet felülírni;
  - mindenhol ugyanez a jelvény: hero (nagy), meccskártya (kicsi), ranglista nem kap (ott emberek vannak).
- **LoL-meccsek:** ✅ ugyanaz a felépítés, mint a CS2-nél, csak egy kis játékcímke különbözteti meg őket („CS2” / „LoL”, apró kapszula a forduló neve mellett). Külön színt nem kapnak, hogy az oldal egységes maradjon; a csapatszínek ugyanúgy piros–kékek.

## 6. Ranglista és eredmények

**Gond:** sokan állnak azonos pontszámon (pl. 4 pontnál 7-en, 3 pontnál 20-an), ezért a hosszú, egyenkénti lista nehezen olvasható és igazságtalannak tűnik, mert egyformák is különböző helyezést kapnak.

✅ **Megoldás: pontcsoportok**
- Egy sor egy pontszám: például **„1. · 5 pont · 2 tippelő”**, **„2. · 4 pont · 7 tippelő”**, **„3. · 3 pont · 20 tippelő”**. A helyezés folyamatos (nov. 17-i javítás: korábban kihagyta a helyezéseket, pl. 1., 3., 5., 14.), a csoporton belül mindenki ugyanazon a helyen áll.
- A sorban egymásra csúsztatott kis avatarok vannak (max. 5 + „+15”). A sorra kattintva lenyílik, és ábécérendben kiírja a neveket.
- A **saját sorod** mindig kiemelve látszik, és a csoportod magától nyitva van („Te itt vagy: 3. hely, holtversenyben 7 tippelővel”).
- A csoporton belül nem rangsorolunk tovább, mert a szabályzat nem ad holtverseny-eldöntést.
- Az első 3 pontcsoport kicsit nagyobb, finom arany, ezüst és bronz árnyalattal, mindenféle dobogóanimáció nélkül.

**Egységesítés:** a ranglista, a lejátszott meccsek és a szabályok ugyanazokat az üvegkártyákat, betűméreteket és térközöket kapják, mint a meccskártyák. A lejátszott meccseknél a „+1 PONT / NEM JÖTT BE” felirat helyett egyszerű címke lesz (zöld pipa „+1”, szürke „0”), és mellette látszik a végeredmény.

## 7. „Arculatot váltottunk” értesítés

✅ **Kis kártya alul:** üvegkártya a képernyő alján középen (telefonon teljes szélességű). Egy mondat és egy „Rendben” gomb van rajta, és nem takarja el az oldalt.
- Szöveg (javaslat): **„Megújult a Tippverseny! Új kinézet, nagyobb visszaszámláló, átláthatóbb ranglista.”**
- Csak egyszer jelenik meg látogatónként. Ha bezárta, a böngésző megjegyzi (`localStorage`), és többé nem jön elő.
- Csak az **élesítéstől számított 3 napig** jelenik meg. Az élesítés időpontja egy beállítás a kódban; utána magától eltűnik, nem kell külön kivenni.
- Ha valaki több eszközről (telefon és gép) látogat, mindkettőn egyszer látja, mert a jelzés böngészőnként tárolódik. Ez szándékos, így nem kell hozzá belépés.
- A sütifigyelmeztetéssel nem jelenhet meg egyszerre: ha az még kint van, ez utána jön.

## 8. Nyitott kérdések

Jelenleg nincs nyitott kérdés. ✅ **Eldöntve (nov. 15.):** üveg valódi fénytöréssel és tartalékkal · Inter · piros–kék · ~1440 px · lapozható hero · kezdőbetűs jelvény · konfetti helyett egyszerű visszajelzés · letisztult hírsáv · visszafogott pontszámláló · LoL játékcímkével · pontcsoportos ranglista · alsó értesítőkártya · mindig a legközelebbi meccs · csak sötét mód.

## 9. Az élő oldal védelme (production)

- Minden változás az **`arculat-terv`** ágon készül. A `main` ág (és így a mechwartesport.xyz) addig nem változik, amíg jóvá nem hagyod.
- A Vercel az ágból **előnézeti címet** készít, ezen lehet tesztelni.
  - ⚠️ A Discord-belépés az előnézeti címen csak akkor működik, ha a Supabase-ben (Authentication → URL Configuration → Redirect URLs) engedélyezzük a Vercel előnézeti címeket is. Ezt az élesítés előtt egyszer be kell állítani; az élő oldalt nem érinti.
- Az adatbázishoz nem nyúlunk: az új arculat ugyanazt a Supabase-t és ugyanazokat a táblákat használja, SQL-módosítás nem kell.
- Élesítés: az ág beolvasztása a `main`-be, olyan időpontban, amikor nincs meccs. Ha baj van, egy visszaállítással percek alatt visszaáll a régi kinézet.

## 10. Kivitelezés lépései (ha a terv kész)

1. Takarítás: kurzor, részecskék, spotlight, tilt, felesleges keyframe-ek törlése.
2. Új alapok: színek, betű, üvegkomponens (`Glass`), gombok.
3. Új hero: nagy meccs, visszaszámláló, tippgombok.
4. Fejléc, fülek, kártyák átállítása üvegre, görgetéses előtűnés.
4b. Ranglista pontcsoportokkal, lejátszott meccsek egységesítése, hírsáv, értesítőkártya.
5. Reszponzív finomhangolás (390 px, 768 px, 1440 px, 1920 px), és mozgás nélküli mód.
6. Előnézet képernyőképekkel, csak utána élesítés (Vercel).

A szervezői felület (`/admin`, `/admin/veto`) csak az új alapszíneket és gombokat kapja meg, a felépítése nem változik.

## 11. Megvalósítás állapota (2026. nov. 15.)

Az `arculat-terv` ágon elkészült a terv 1–5. lépése. Ami a tervhez képest pontosítás:

- **Valódi fénytörés csak a lebegő felületeken van** (fejléc, fülsáv, alsó értesítőkártyák), asztali Chrome/Edge/Opera/Brave alatt. A fénytörés csak ott látszik, ahol az üveg alatt tartalom mozog; a helyben álló kártyák alatt egyszínű háttér van, ott nem látszana semmi, viszont lassítaná az oldalt. A kártyák ezért egyszerű üvegfelületet kaptak. Safari, Firefox és telefon: elmosott üveg.
- **Ranglista, csoporton belüli sorrend:** a csoport = pontszám, a helyezés közös. A lenyitott névsor a „több talált tipp, utána név” sorrendet követi, mert a szabályzat holtversenynél a több talált tippet nézi (most még mindenkinél pont = találat, így ez egyelőre névsor).
- **Tipp előtti megoszlás:** a hero a kezdés előtt csak a tippelők számát mutatja, a százalékokat csak a kezdés után – ugyanúgy, ahogy eddig (az adatbázis addig nem is adja ki).
- **Főnyeremény-kártya:** megmaradt, a bemutatkozó rész mellett, mozgás nélkül.
- **Üzenetek (pl. „Tipp mentve”):** gépen jobb alul, telefonon alul középen jelennek meg.
- **„Megújult a Tippverseny” kártya:** a `lib/relaunch.js` fájlban a `RELAUNCH_AT` értékét kell az élesítés időpontjára állítani (most `null`, tehát nem jelenik meg). Kipróbálni az oldal címe után írt `#megujult` jelöléssel lehet.
- Törölve: `Cursor.js`, `Roll.js`, `CookieNote.js` (a sütitájékoztató a `Notices.js`-be került), a részecskék, a fényfolt, a billegés és a konfetti.

