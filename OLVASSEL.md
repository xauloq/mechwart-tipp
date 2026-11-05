# Mechwart Tippverseny – beállítás

Next.js weboldal + Supabase (adatbázis és Discord-bejelentkezés). Az oldal statikus, bárhol futtatható; a szabályokat (határidő, egy tipp/meccs) az adatbázis kényszeríti ki, a böngészőből nem lehet megkerülni.

Kb. 20–30 perc az első beállítás. A sorrend számít.

---

## 1. Supabase projekt (5 perc)

1. supabase.com → **New project** → név: `mechwart-tipp`, régió: **Central EU (Frankfurt)**, adatbázis-jelszó: generáltasd és mentsd el.
2. Ha elkészült: bal oldalt **SQL Editor** → **New query** → másold be a `supabase/schema.sql` **teljes** tartalmát → **Run**.
   Ez létrehozza a táblákat, a szabályokat, a ranglistát, és betölti az 1. kör meccseit és a nevezési listát.
   (A Supabase kiírhat egy figyelmeztetést, hogy a `leaderboard` és `tip_stats` nézet „security definer” – ez szándékos, így adják ki az összesített ranglistát anélkül, hogy bárki más tippjeit látná.)
3. **Project Settings → API Keys**: jegyezd fel a **Project URL**-t és a **Publishable key**-t (vagy a régi `anon` kulcsot). A `service_role` / secret kulcsot SOHA ne tedd a weboldalba.

## 2. Discord-bejelentkezés (5 perc)

1. discord.com/developers/applications → **New Application** → név: `Mechwart Tippverseny`.
2. **OAuth2** fül → **Client ID** és **Reset Secret → Client Secret** – másold ki mindkettőt.
3. Ugyanitt **Redirects → Add Redirect**:
   `https://<a-te-projekt-azonosítód>.supabase.co/auth/v1/callback`
   (a pontos címet a Supabase is kiírja a következő lépésben, onnan másold.)
4. Supabase → **Authentication → Sign In / Providers → Discord** → bekapcsol, Client ID + Client Secret be → **Save**.

## 3. Weboldal közzététele – Vercel (ajánlott, 5 perc)

1. Töltsd fel ezt a mappát egy GitHub-repóba (pl. `mechwart-tipp`). A `node_modules`, `.next`, `out` mappát ne.
2. vercel.com → belépés GitHubbal → **Add New → Project** → válaszd a repót.
3. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = a Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = a Publishable key
4. **Deploy**. Kapsz egy címet, pl. `https://mechwart-tipp.vercel.app`.

(GitHub Pages is jó: a `.github/workflows/pages.yml` le van írva, a fájl elején ott a beállítás.)

## 4. Supabase: az oldal címe (1 perc) – ne hagyd ki!

Supabase → **Authentication → URL Configuration**:
- **Site URL**: a weboldal címe (pl. `https://mechwart-tipp.vercel.app`)
- **Redirect URLs**: ugyanez, a végén `/**`-gal (pl. `https://mechwart-tipp.vercel.app/**`), és ha helyben is próbálod: `http://localhost:3000/**`

Ezután: nyisd meg az oldalt → **Belépés Discorddal** → tippelj egyet próbaképp.

---

## Frissítés (nov. 5.) – ha a régi `schema.sql`-t már lefuttattad

SQL Editor → New query → a `supabase/frissites_2.sql` tartalma → Run. (Új projektnél elég a `schema.sql`, abban már benne van.)

## Szervezői felület – mechwartesport.xyz/admin

Egyszeri beállítás: lépj be az oldalra a **d3lta4k** Discord-fiókkal, majd SQL Editor → New query → a `supabase/frissites_3_admin.sql` tartalma → Run. A végén egy sornak kell megjelennie a d3lta4k névvel. Ezután a főoldal fejlécében megjelenik a **Szervezés** gomb (csak neked).

Itt lehet:
- **eredményt beírni**: a „Teendő” fülön ott vannak az elkezdett, még eredmény nélküli meccsek. Beírod az állást, a győztes magától kijelölődik (LoL Bo1-nél elég a győztesre kattintani), majd Eredmény mentése. Elrontott eredmény javítható vagy visszavonható.
- **időpontot módosítani, csapatnevet javítani**: Szerkesztés gomb a meccsen
- **új meccset felvenni**: Új meccs gomb (játék, formátum, kör, csapatok, kezdés magyar idő szerint, pontozás: Alap 1 / Playoff 2 +1)
- **csapatot átnevezni** az összes meccsén egyszerre: az oldal alján
- **meccset törölni**: csak amíg senki nem tippelt rá

A jogosultságot az adatbázis ellenőrzi: más fiókkal az oldal nem enged szerkeszteni, akkor sem, ha valaki megtalálja a címet.

## Meccsnapon

**Eredmény beírása** (meccs után): Supabase → **Table Editor → matches** → a meccs sorában `winner` = 1 (az első csapat nyert) vagy 2, `score1` / `score2` = végeredmény (Bo1-nél a körök, pl. 13 és 9) → Save. A ranglista azonnal frissül.
Vagy SQL Editorban:
```sql
update public.matches set winner = 1, score1 = 13, score2 = 9 where id = 'cs-r1-105';
```

**Meccs-azonosítók az 1. körben** (ugyanazok a számok, mint a MatchZy-fájlokban):
cs-r1-101 Rumogló–NSG · 102 drift–S&P · 103 Tel-Aviv–Perui · 104 ANF–PatyiShock · 105 Musor drop–MC Isti · 106 knb–OTT · 107 ÜssFuss!–CCNA
LoL: lol-b1-paladins · lol-b1-l9 · lol-a1-minipajtik · lol-a1-elo

**Időpont-változás**: `matches` → `kickoff` átírása. A tippelés mindig a `kickoff` időpontban zár.

**Következő kör**: a párosítás után a meccseket egy `insert` sorral kell felvinni (a `schema.sql` végén van minta) – Claude-tól kérd el kész SQL-ként, és futtasd le az SQL Editorban.

**Twitch-parancs**: `!addcom !tipp 🎯 Tippverseny: <az oldal címe> – lépj be Discorddal, tippelj a meccsekre, és legyél te a Tippkirály!`

---

## Jó tudni

- **Saját meccs**: mindenki tippelhet, a saját csapatára is.
- **Ranglista**: csak az jelenik meg, akinek már van kiértékelt (lejátszott meccsre leadott) tippje.
- **Főnyeremény**: Cyberpunk 2077 – a képet a Steam áruházból tölti be az oldal.
- **Szüneteltetés**: az ingyenes Supabase-projektet egy hét tétlenség után leállítja. A téli szünet után a Supabase felületén **Restore project** – az adatok megmaradnak.
- **Csalás**: több fiókkal tippelni tilos (Szabályok fül). A `profiles` táblában látod, ki lépett be.
- **Kipróbálás helyben**: `npm install`, `.env.local` a `.env.example` alapján, `npm run dev` → http://localhost:3000. Supabase-adatok nélkül az oldal **demó módban** indul (kitalált meccsekkel).
