import { Target, Clock, Shield, Trophy, Users, Gift } from './icons';

const R = [
  [Target, 'Így tippelsz', 'Lépj be a Discord-fiókoddal, és minden meccsnél kattints arra a csapatra, amelyik szerinted nyer. A tipped azonnal elmentődik.'],
  [Clock, 'Határidő', 'A meccs kezdéséig tippelhetsz és módosíthatsz. A kezdés pillanatában a tippelés lezárul, utána a rendszer nem fogad el tippet.'],
  [Trophy, 'Pontozás', 'Svájci körben és csoportkörben a jó győztes 1 pont. A playoffban a jó győztes 2 pont, a pontos sorozatállás (pl. 2–1) +1 pont.'],
  [Users, 'Saját meccs', 'Ha te is játszol egy meccsen, arra nem tippelhetsz. A többi meccsre ugyanúgy tippelhetsz, mint bárki más.'],
  [Shield, 'Egy fiók, egy tippelő', 'Mindenki a saját Discord-fiókjával tippel. Több fiókkal tippelni tilos – ha kiderül, az összes fiók kiesik a versenyből.'],
  [Gift, 'Tippkirály', 'A szezon végén a legtöbb pontot gyűjtő tippelő a Tippkirály. Holtversenynél a több talált tipp dönt, utána sorsolás.'],
];

export default function Rules() {
  return (
    <section className="rules">
      {R.map(([Ic, h, p], i) => (
        <div key={h} className="rule in" style={{ '--i': i }}>
          <div className="ic"><Ic size={22} /></div>
          <h3>{h}</h3>
          <p>{p}</p>
        </div>
      ))}
    </section>
  );
}
