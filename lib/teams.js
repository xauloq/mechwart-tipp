// Csapatjelvény: logó helyett kezdőbetűs monogram (mint a névjegyeknél).
// Több szavas névnél az első két szó kezdőbetűje, egyszavasnál az első betű.
// Kivétel ide írható: 'Csapatnév': 'XY'
const OVERRIDE = { L9: 'L9' };

export function monogram(name) {
  const raw = (name || '').trim();
  if (OVERRIDE[raw]) return OVERRIDE[raw];
  const words = raw
    .replace(/\([^)]*\)/g, ' ')            // zárójeles rész nem számít: "Spray & Pray (S&P)"
    .split(/[\s\-–_/]+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, ''))
    .filter(Boolean);
  if (!words.length) return '?';
  const first = (w) => [...w][0].toLocaleUpperCase('hu');
  return words.length >= 2 ? first(words[0]) + first(words[1]) : first(words[0]);
}
