import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Ha nincs beállítva a Supabase, az oldal demó módban fut (kitalált adatokkal), így a dizájn is kipróbálható.
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
export const DEMO = !supabase;

const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const asset = (p) => `${base}${p}`;

export async function loadPublic() {
  const [m, s, l] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff', { ascending: true }),
    supabase.from('tip_stats').select('*'),
    supabase.from('leaderboard').select('*').order('points', { ascending: false }).order('correct', { ascending: false }).limit(200),
  ]);
  if (m.error) throw m.error;
  return { matches: m.data || [], stats: s.data || [], board: l.data || [] };
}

export async function loadMine() {
  const t = await supabase.from('tips').select('match_id,pick,series');
  return { tips: t.data || [] };
}

export async function saveTip(matchId, pick, series) {
  const row = { match_id: matchId, pick };
  if (series !== undefined) row.series = series;
  const { error } = await supabase.from('tips').upsert(row, { onConflict: 'user_id,match_id' });
  return error;
}

export async function signIn(path = '/') {
  const redirectTo = window.location.origin + base + path;
  return supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo, scopes: 'identify' } });
}

// ---------- szervezői felület ----------
// A jogosultságot az adatbázis ellenőrzi (admins tábla + RLS); ez csak a felület megjelenítéséhez kell.
export async function isAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

const NOPERM = { message: 'Nincs jogosultságod ehhez a művelethez.' };

export async function adminInsert(row) {
  const { error } = await supabase.from('matches').insert(row);
  return error;
}

export async function adminUpdate(id, patch) {
  const { data, error } = await supabase.from('matches').update(patch).eq('id', id).select('id');
  if (error) return error;
  return data && data.length ? null : NOPERM;
}

export async function adminDelete(id) {
  const { data, error } = await supabase.from('matches').delete().eq('id', id).select('id');
  if (error) return error;
  return data && data.length ? null : { message: 'Ezt a meccset nem lehet törölni, mert már tippeltek rá. Tedd át inkább másik időpontra.' };
}

// csapat átnevezése az adott játék összes meccsén
export async function adminRename(game, from, to) {
  const a = await supabase.from('matches').update({ team1: to }).eq('game', game).eq('team1', from).select('id');
  if (a.error) return { error: a.error };
  const b = await supabase.from('matches').update({ team2: to }).eq('game', game).eq('team2', from).select('id');
  if (b.error) return { error: b.error };
  return { count: (a.data?.length || 0) + (b.data?.length || 0) };
}

// ---------- pályaválasztás (veto) ----------
export async function canVeto() {
  const { data, error } = await supabase.rpc('can_veto');
  return !error && data === true;
}
export async function loadVeto() {
  const { data, error } = await supabase.from('veto').select('data,updated_at').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data || { data: null, updated_at: null };
}
export async function saveVeto(state) {
  const { data, error } = await supabase.from('veto').update({ data: state }).eq('id', 1).select('updated_at');
  if (error) return { error };
  if (!data || !data.length) return { error: { message: 'Nincs jogosultságod a pályaválasztás kezeléséhez.' } };
  return { updated_at: data[0].updated_at };
}
