// Pályaválasztás (veto) – közös adatok. Ugyanaz a sorrend, mint a MatchZy meccsfájlokban és a veto_kozos.js-ben.
export const MAPPOOL = ['de_ancient', 'de_anubis', 'de_cache', 'de_dust2', 'de_inferno', 'de_mirage', 'de_nuke'];
export const MAPNEV = { de_ancient: 'Ancient', de_anubis: 'Anubis', de_cache: 'Cache', de_dust2: 'Dust II', de_inferno: 'Inferno', de_mirage: 'Mirage', de_nuke: 'Nuke' };
export const MAPSZIN = {
  de_ancient: 'linear-gradient(160deg, #1f5a3a, #0d2a1d)', de_anubis: 'linear-gradient(160deg, #8a6a2c, #3a2a10)',
  de_cache: 'linear-gradient(160deg, #4f6b33, #1f2c14)', de_dust2: 'linear-gradient(160deg, #a77a3e, #4a3015)',
  de_inferno: 'linear-gradient(160deg, #a2452c, #45170c)', de_mirage: 'linear-gradient(160deg, #b08a4a, #4b3517)',
  de_nuke: 'linear-gradient(160deg, #2f6c8f, #10293a)' };
export function vetoSteps(format) {
  const B = (t) => ({ type: 'ban', team: t }), P = (t) => ({ type: 'pick', team: t }), D = { type: 'decider', team: 0 };
  if (format === 'bo3') return [B(1), B(2), P(1), P(2), B(1), B(2), D];
  if (format === 'bo5') return [B(1), B(2), P(1), P(2), P(1), P(2), D];
  return [B(1), B(2), B(1), B(2), B(1), B(2), D];
}
