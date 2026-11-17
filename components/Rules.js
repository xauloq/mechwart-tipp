import { Target, Clock, Shield, Trophy, Users, Gift } from './icons';

const R = [
  [Target, 'Így tippelsz', 'Lépj be a Discord-fiókoddal, és koppints arra a csapatra, amelyik szerinted nyer. A tipped azonnal elmentődik.'],
  [Clock, 'Határidő', 'A meccs kezdéséig tippelhetsz és módosíthatsz. A kezdés pillanatában a tippelés lezárul.'],
  [Trophy, 'Pontozás', 'Svájci körben és csoportkörben a jó győztes 1 pont. A playoffban a jó győztes 2 pont, a pontos sorozatállás (pl. 2–1) +1 pont.'],
  [Users, 'Ranglista', 'Az első kiértékelt tipped után kerülsz fel. Az azonos pontszámúak ugyanazon a helyen állnak.'],
  [Shield, 'Egy fiók, egy tippelő', 'Mindenki a saját Discord-fiókjával tippel. Több fiókkal tippelni tilos – ha kiderül, az összes fiók kiesik a versenyből.'],
  [Gift, 'Főnyeremény: Cyberpunk 2077', 'A szezon végén a legtöbb pontot gyűjtő tippelő a Tippkirály, és megnyeri a játékot Steamen. Holtversenynél a több talált tipp dönt, utána sorsolás.'],
];

export default function Rules() {
  return (
    <ul className="rules rv">
      {R.map(([Ic, h, p]) => (
        <li key={h} className="rule">
          <span className="ic"><Ic size={20} /></span>
          <div><h3>{h}</h3><p>{p}</p></div>
        </li>
      ))}
    </ul>
  );
}
