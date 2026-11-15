// Demó adatok – csak akkor használja az oldal, ha nincs Supabase beállítva. Minden időpont a mostanihoz képest van megadva.
const now = Date.now();
const soon = (min) => new Date(now + min * 60000).toISOString();
const m = (id, game, round, format, team1, team2, kickoff, rest = {}) => ({ id, game, round, format, team1, team2, kickoff, winner: null, points: 1, exact_bonus: 0, ...rest });

export const demoMatches = [
  m('demo-d1', 'cs2', 'Svájci 1. kör', 'Bo1', 'Musor drop', 'MC Isti Fan Club', soon(-3 * 1440), { winner: 1, score1: 13, score2: 11 }),
  m('demo-d2', 'cs2', 'Svájci 1. kör', 'Bo1', 'Tel-Aviv ESL', 'Perui pánsíposok', soon(-2 * 1440), { winner: 1, score1: 13, score2: 1 }),
  m('demo-d3', 'cs2', 'Svájci 1. kör', 'Bo1', 'ANF', 'PatyiShock', soon(-1440), { winner: 2, score1: 1, score2: 13 }),
  m('demo-live', 'cs2', 'Svájci 2. kör', 'Bo1', 'NSG', 'One Tooth Team', soon(-20)),
  m('demo-1', 'cs2', 'Svájci 2. kör', 'Bo1', 'Rumogló FC', 'Spray & Pray (S&P)', soon(134)),
  m('demo-2', 'cs2', 'Svájci 2. kör', 'Bo1', 'CCNA Certified Fraggers', 'knb miracles', soon(209)),
  m('demo-3', 'cs2', 'Svájci 2. kör', 'Bo1', 'Musor drop', 'Tel-Aviv ESL', soon(1440 + 60)),
  m('demo-4', 'cs2', 'Svájci 2. kör', 'Bo1', 'PatyiShock', 'drift', soon(1440 + 135)),
  m('demo-5', 'lol', 'B csoport · 2. forduló', 'Bo1', 'Paladins', 'L9', soon(6 * 1440)),
  m('demo-6', 'lol', 'Elődöntő', 'Bo3', 'Elo Inflated', 'runitdown', soon(13 * 1440), { points: 2, exact_bonus: 1 }),
];

export const demoStats = [
  { match_id: 'demo-d1', total: 53, pick1: 25, pick2: 28 },
  { match_id: 'demo-d2', total: 63, pick1: 46, pick2: 17 },
  { match_id: 'demo-d3', total: 65, pick1: 27, pick2: 38 },
  { match_id: 'demo-live', total: 37, pick1: 15, pick2: 22 },
  { match_id: 'demo-1', total: 61, pick1: null, pick2: null },
  { match_id: 'demo-2', total: 48, pick1: null, pick2: null },
  { match_id: 'demo-3', total: 18, pick1: null, pick2: null },
];

const names = ['Tippkirály', 'nokvad', 'Zsolvi56', 'bigamer69', 'Libero', 'eaGL18', 'keem', 'Szergely', 'Peterfi', 'Botond', 'Fernc', 'Pisti28', 'robeey', 'Andris', 'Pala', 'koti', 'Dóri', 'Nebula', 'z3tike', 'Boldee', 'Roli', 'makyo222', 'Yoshiki', 'L7V1', 'flakon', 'Mertyy', 'Pityesz', 'ago', 'bonyee', 'Snickers', 'Szabi', 'Galu', 'Milan', 'Krumple', 'Matyi', 'Shadow'];
const pts = [3, 3, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export const demoBoard = names.map((name, i) => ({ user_id: i === 4 ? 'me' : `u${i}`, name: i === 4 ? 'Te' : name, points: pts[i], correct: pts[i], decided: 3, tips: 7 }));

export const demoUser = { id: 'me', name: 'Te (demó)', avatar: null };
export const demoTips = [{ match_id: 'demo-d1', pick: 1 }, { match_id: 'demo-d2', pick: 1 }, { match_id: 'demo-d3', pick: 1 }, { match_id: 'demo-live', pick: 2 }, { match_id: 'demo-2', pick: 1 }];
