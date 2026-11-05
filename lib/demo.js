// Demó adatok – csak akkor használja az oldal, ha nincs Supabase beállítva.
const h = (d, t) => new Date(`2026-11-${d}T${t}:00+01:00`).toISOString();
const now = Date.now();
const soon = (min) => new Date(now + min * 60000).toISOString();

export const demoMatches = [
  { id: 'demo-done', game: 'cs2', round: 'Svájci 1. kör', format: 'Bo1', team1: 'Musor drop', team2: 'MC Isti Fan Club', kickoff: soon(-180), winner: 1, score1: 13, score2: 9, points: 1, exact_bonus: 0 },
  { id: 'demo-live', game: 'cs2', round: 'Svájci 1. kör', format: 'Bo1', team1: 'knb miracles', team2: 'One Tooth Team', kickoff: soon(-20), winner: null, points: 1, exact_bonus: 0 },
  { id: 'demo-1', game: 'cs2', round: 'Svájci 1. kör', format: 'Bo1', team1: 'Tel-Aviv ESL', team2: 'Perui pánsíposok', kickoff: soon(95), winner: null, points: 1, exact_bonus: 0 },
  { id: 'demo-2', game: 'cs2', round: 'Svájci 1. kör', format: 'Bo1', team1: 'Rumogló FC', team2: 'NSG', kickoff: h('08', '16:00'), winner: null, points: 1, exact_bonus: 0 },
  { id: 'demo-3', game: 'cs2', round: 'Svájci 1. kör', format: 'Bo1', team1: 'ANF', team2: 'PatyiShock', kickoff: h('08', '17:15'), winner: null, points: 1, exact_bonus: 0 },
  { id: 'demo-4', game: 'cs2', round: 'Svájci 1. kör', format: 'Bo1', team1: 'drift', team2: 'Spray & Pray (S&P)', kickoff: h('08', '18:30'), winner: null, points: 1, exact_bonus: 0 },
  { id: 'demo-5', game: 'cs2', round: 'Svájci 1. kör', format: 'Bo1', team1: 'ÜssFuss!', team2: 'CCNA Certified Fraggers', kickoff: h('08', '19:45'), winner: null, points: 1, exact_bonus: 0 },
  { id: 'demo-6', game: 'lol', round: 'B csoport · 1. forduló', format: 'Bo1', team1: 'Paladins', team2: 'konzolkábel', kickoff: h('14', '17:00'), winner: null, points: 1, exact_bonus: 0 },
  { id: 'demo-7', game: 'lol', round: 'A csoport · 1. forduló', format: 'Bo3', team1: 'Elo Inflated', team2: 'runitdown', kickoff: h('15', '19:00'), winner: null, points: 2, exact_bonus: 1 },
];

export const demoStats = [
  { match_id: 'demo-done', total: 41, pick1: 29, pick2: 12 },
  { match_id: 'demo-live', total: 37, pick1: 15, pick2: 22 },
  { match_id: 'demo-1', total: 18, pick1: null, pick2: null },
];

export const demoBoard = [
  { user_id: 'a', name: 'Tippkirály', points: 9, correct: 9, decided: 11, tips: 14 },
  { user_id: 'b', name: 'nokvad', points: 8, correct: 8, decided: 11, tips: 12 },
  { user_id: 'c', name: 'Zsolvi56', points: 8, correct: 8, decided: 10, tips: 13 },
  { user_id: 'me', name: 'Te', points: 6, correct: 6, decided: 9, tips: 11 },
  { user_id: 'd', name: 'bigamer69', points: 5, correct: 5, decided: 11, tips: 11 },
  { user_id: 'e', name: 'Libero', points: 4, correct: 4, decided: 8, tips: 9 },
];

export const demoUser = { id: 'me', name: 'Te (demó)', avatar: null };
export const demoTips = [{ match_id: 'demo-done', pick: 1 }, { match_id: 'demo-live', pick: 2 }];
