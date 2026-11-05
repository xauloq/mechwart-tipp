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
  const [t, o] = await Promise.all([
    supabase.from('tips').select('match_id,pick,series'),
    supabase.rpc('my_own_matches'),
  ]);
  return { tips: t.data || [], own: (o.data || []).map((x) => (typeof x === 'string' ? x : x.my_own_matches)) };
}

export async function saveTip(matchId, pick, series) {
  const row = { match_id: matchId, pick };
  if (series !== undefined) row.series = series;
  const { error } = await supabase.from('tips').upsert(row, { onConflict: 'user_id,match_id' });
  return error;
}

export async function signIn() {
  const redirectTo = window.location.origin + base + '/';
  return supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo, scopes: 'identify' } });
}
