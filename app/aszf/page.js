import Link from 'next/link';

export const metadata = {
  title: 'Részvételi szabályzat és adatkezelés – Mechwart Tippverseny',
  description: 'A Mechwart Tippverseny részvételi szabályzata (ÁSZF) és adatkezelési tájékoztatója.',
};

const HATALY = '2026. november 5.';
const DISCORD = 'https://discord.gg/FYTkSyappx';

const S = [
  ['szervezo', '1. A Szervező', <>
    <p>A Mechwart Tippverseny (a továbbiakban: <b>Tippverseny</b>) a Mechwart Esport Bajnokság kísérő játéka. Szervezői: <b>Tarnóczi Márton, Nagy Gergő és Sultesz Roland</b>, a DEAC esport támogatásával (a továbbiakban együtt: <b>Szervező</b>).</p>
    <p>Kapcsolat: a bajnokság Discord-szerverén (<a href={DISCORD} target="_blank" rel="noreferrer">discord.gg/FYTkSyappx</a>) a szervezőknek küldött üzenetben.</p>
  </>],
  ['lenyeg', '2. A Tippverseny lényege', <>
    <p>A résztvevők a Mechwart Esport Bajnokság CS2 és League of Legends meccseinek győztesére tippelnek a <b>mechwartesport.xyz</b> oldalon. A jó tippek pontot érnek, a szezon végén a legtöbb pontot gyűjtő résztvevő a <b>Tippkirály</b>.</p>
    <p>A részvétel <b>ingyenes</b>, vásárláshoz vagy befizetéshez nem kötött. A Tippverseny ügyességi és szórakoztató játék, nem szerencsejáték: tétet nem kell tenni, pénzt nyerni nem lehet.</p>
  </>],
  ['reszvetel', '3. Ki vehet részt?', <>
    <ul>
      <li>Bárki, aki rendelkezik saját <b>Discord-fiókkal</b>, és azzal belép az oldalra. (A Discord saját szabályai szerint fiókot 13 éves kortól lehet létrehozni.)</li>
      <li>A bajnokság játékosai is részt vehetnek, és a saját csapatuk meccsére is tippelhetnek.</li>
      <li>Egy személy <b>csak egy fiókkal</b> vehet részt.</li>
      <li>A belépéssel és az első tipp leadásával a résztvevő elfogadja ezt a szabályzatot és az adatkezelési tájékoztatót (9. pont). <b>16 év alatti</b> résztvevő a szülője vagy törvényes képviselője hozzájárulásával vehet részt.</li>
    </ul>
  </>],
  ['tippeles', '4. A tippelés menete', <>
    <ul>
      <li>Minden meccsnél arra a csapatra kell kattintani, amelyik a résztvevő szerint nyer. A tipp azonnal elmentődik.</li>
      <li>Tippelni és a tippet módosítani a meccs oldalon feltüntetett <b>kezdési időpontjáig</b> lehet. A kezdés pillanatában a tippelés lezárul, utána a rendszer nem fogad el tippet.</li>
      <li>Ha egy meccs időpontja változik, a tippelési határidő az új kezdési időponthoz igazodik.</li>
      <li>Meccsenként egy tipp számít, mindig az utolsó, határidőn belül mentett.</li>
    </ul>
  </>],
  ['pontozas', '5. Pontozás és ranglista', <>
    <ul>
      <li>Svájci szakaszban és csoportkörben a jó győztes <b>1 pont</b>.</li>
      <li>Playoffban a jó győztes <b>2 pont</b>, és ha a résztvevő a pontos sorozatállást (pl. 2–1) is eltalálja, további <b>+1 pont</b>.</li>
      <li>Egy meccs eredménye az, amit a Szervező a hivatalos eredményként rögzít. Ha egy meccset a bajnokság szabályai szerint (pl. meg nem jelenés miatt) ítélnek oda, a megítélt győztes számít.</li>
      <li>Ha egy meccs végleg elmarad és nem játsszák le, az arra leadott tippek nem érnek pontot.</li>
      <li>A ranglistán az a résztvevő jelenik meg, akinek már van kiértékelt tippje. A ranglistán a résztvevő Discord-neve és profilképe látható.</li>
      <li><b>Holtverseny</b> esetén a több talált tipp dönt; ha az is egyenlő, a Szervező sorsolással dönt.</li>
    </ul>
  </>],
  ['nyeremeny', '6. A nyeremény', <>
    <ul>
      <li>Főnyeremény: <b>Cyberpunk 2077</b> (PC, Steam), amelyet a szezon végén a ranglista első helyezettje (Tippkirály) kap meg.</li>
      <li>A Szervező a nyertest a szezon zárása után a Discord-szerveren hirdeti ki, és a Discordon keresi meg. A nyertesnek a kihirdetéstől számított <b>14 napon belül</b> jelentkeznie kell; ha nem jelentkezik, a nyeremény a ranglista következő helyezettjét illeti.</li>
      <li>A nyeremény átadása Steam-ajándékként vagy aktiválókulcsként történik, ehhez a nyertesnek meg kell adnia a Steam-profilját.</li>
      <li>A nyeremény pénzre nem váltható, és más nyereményre nem cserélhető.</li>
    </ul>
  </>],
  ['fair', '7. Tisztességes játék, kizárás', <>
    <p>A Szervező kizárhatja a Tippversenyből – és a pontjait törölheti – azt a résztvevőt, aki:</p>
    <ul>
      <li>több fiókkal vesz részt, vagy más fiókját használja;</li>
      <li>az oldal működését szándékosan zavarja, a szabályokat technikai úton próbálja megkerülni;</li>
      <li>sértő, obszcén vagy mások jogait sértő nevet, profilképet használ;</li>
      <li>a meccsek eredményét befolyásolni próbálja.</li>
    </ul>
    <p>Kizárás esetén a résztvevő az összes fiókjával kiesik, és nem jogosult nyereményre.</p>
  </>],
  ['felelosseg', '8. Felelősség, módosítás', <>
    <ul>
      <li>A Szervező törekszik az oldal folyamatos működésére, de nem felel az olyan kiesésért vagy hibáért, amely rajta kívül álló okból (pl. internet-, tárhely- vagy Discord-szolgáltatási hiba) következik be.</li>
      <li>Ha egy technikai hiba miatt egy tipp nem menthető, vagy egy eredmény hibásan szerepel, a Szervező a hibát javíthatja; a javított állás az érvényes.</li>
      <li>A Szervező a szabályzatot indokolt esetben módosíthatja. A módosítást a Discord-szerveren és ezen az oldalon közzéteszi; a már kiértékelt tippek pontjait a módosítás nem érinti.</li>
      <li>A Tippverseny a bajnokság végéig (várhatóan 2027 februárjáig) tart.</li>
    </ul>
  </>],
  ['adatkezeles', '9. Adatkezelési tájékoztató', <>
    <p><b>Adatkezelő:</b> a Szervező (1. pont). Elérhetőség: a Discord-szerveren.</p>
    <p><b>Milyen adatokat kezelünk?</b> A Discord-belépéskor a Discordtól kapott adatokat: Discord-azonosító, felhasználónév, megjelenített név, profilkép, és – ha a Discord megadja – e-mail-cím. Ezen felül a leadott tippeket és azok időpontját.</p>
    <p><b>Mire használjuk?</b> A belépéshez, a tippek tárolásához és kiértékeléséhez, a ranglista megjelenítéséhez, a csalás kiszűréséhez és a nyertes megkereséséhez. Az e-mail-címet nem használjuk, és nem jelenik meg sehol; marketingcélra semmilyen adatot nem használunk, és nem adunk át harmadik félnek.</p>
    <p><b>Mi az adatkezelés jogalapja?</b> A résztvevő hozzájárulása, amelyet a belépéssel ad meg (GDPR 6. cikk (1) a)). 16 év alatt a hozzájárulást a szülő vagy törvényes képviselő adja meg.</p>
    <p><b>Mit lát más?</b> A ranglistán a megjelenített név, a profilkép és a pontszám nyilvános. A tippeket csak a résztvevő maga látja; a meccs kezdése után csak az összesített megoszlás (hány százalék kire tippelt) látszik, név nélkül.</p>
    <p><b>Meddig tároljuk?</b> A Tippverseny végéig és a nyeremény átadásáig, de legkésőbb 2027. június 30-ig; utána az adatokat töröljük.</p>
    <p><b>Kik férnek hozzá technikailag?</b> Az oldal tárhelye a Vercel, az adatbázis és a bejelentkezés a Supabase (az adatok az Európai Unióban, Frankfurtban tárolódnak), a bejelentkezést a Discord végzi. Ezek a szolgáltatók adatfeldolgozóként, a saját adatvédelmi feltételeik szerint működnek.</p>
    <p><b>Milyen jogaid vannak?</b> Kérheted az adataidhoz való hozzáférést, a helyesbítést, a törlést (ezzel a Tippversenyből is kilépsz), és a hozzájárulásodat bármikor visszavonhatod – ehhez írj a szervezőknek a Discordon. Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH, naih.hu) fordulhatsz.</p>
    <p><b>Sütik és böngészőtárhely:</b> az oldal csak a működéshez feltétlenül szükséges adatot tárolja a böngésződben: a bejelentkezés megtartásához szükséges azonosítót, és azt, hogy ezt a tájékoztatót már bezártad. Ezekhez a jogszabály (az elektronikus hírközlésről szóló 2003. évi C. törvény 155. § (4) bekezdése) szerint nem kell külön hozzájárulás. Követő-, statisztikai vagy reklámsütiket nem használunk. A betűtípust a saját tárhelyünkről töltjük be; a főnyeremény képe a Steam áruház szerveréről töltődik be, ezért ehhez a Valve (Steam) látja a böngésződ IP-címét.</p>
  </>],
];

export default function Aszf() {
  return (
    <main className="wrap legal">
      <header className="lg-head in">
        <Link href="/" className="back">← Vissza a tippekhez</Link>
        <div className="kick">MECHWART TIPPVERSENY</div>
        <h1>Részvételi szabályzat<br /><span>és adatkezelés</span></h1>
        <p>Hatályos: {HATALY}</p>
      </header>
      <nav className="toc in" style={{ '--i': 1 }} aria-label="Tartalom">
        {S.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}
      </nav>
      {S.map(([id, t, body], i) => (
        <section key={id} id={id} className="lg-sec in" style={{ '--i': Math.min(i + 2, 8) }}>
          <h2>{t}</h2>
          {body}
        </section>
      ))}
      <footer className="footer"><span>Mechwart Esport Bajnokság · <Link href="/">mechwartesport.xyz</Link></span></footer>
    </main>
  );
}
