import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WWCMatch {
  match_id: number;
  match_date: string;
  kick_off: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  competition_stage: string;
  match_week: number;
  stadium: string;
  stadium_country: string;
  home_group: string;
  away_group: string;
  home_manager: string;
  away_manager: string;
  has_360: boolean;
}

export interface WWCLineupPlayer {
  id: number;
  match_id: number;
  team: string;
  player_id: number;
  player_name: string;
  player_nickname: string;
  jersey_number: number;
  position: string;
  position_id: number;
  country: string;
  is_starter: boolean;
}

export interface WWCPlayerStat {
  id: number;
  match_id: number;
  player_id: number;
  player_name: string;
  team: string;
  minutes_played: number;
  passes: number;
  passes_complete: number;
  shots: number;
  shots_on_target: number;
  goals: number;
  xg: number;
  assists: number;
  key_passes: number;
  pressures: number;
  carries: number;
  dribbles: number;
  dribbles_complete: number;
  blocks: number;
  interceptions: number;
  clearances: number;
  fouls_committed: number;
  fouls_won: number;
  yellow_cards: number;
  red_cards: number;
}

export interface WWCEvent {
  event_id: string;
  match_id: number;
  idx: number;
  period: number;
  minute: number;
  second: number;
  type: string;
  team: string;
  player: string;
  player_id: number;
  position: string;
  x: number | null;
  y: number | null;
  under_pressure: boolean;
  possession_team: string;
  shot_xg: number | null;
  shot_outcome: string;
  shot_end_x: number | null;
  shot_end_y: number | null;
  pass_outcome: string;
  pass_recipient: string;
  pass_end_x: number | null;
  pass_end_y: number | null;
  pass_length: number | null;
  carry_end_x: number | null;
  carry_end_y: number | null;
  dribble_outcome: string;
  counterpress: boolean;
}

export interface TournamentPlayerStat {
  player_id: number;
  player_name: string;
  player_nickname: string;
  team: string;
  position: string;
  matches_played: number;
  minutes_played: number;
  goals: number;
  xg: number;
  assists: number;
  key_passes: number;
  passes: number;
  passes_complete: number;
  shots: number;
  shots_on_target: number;
  pressures: number;
  dribbles_complete: number;
  // computed from per-match rows
  pass_pct?: number;
  xg_per_shot?: number;
}

// ── Match queries ─────────────────────────────────────────────────────────────

export async function getWWCMatches(): Promise<WWCMatch[]> {
  const { data, error } = await supabase
    .from('wwc2023_matches')
    .select('*')
    .order('match_date', { ascending: true })
    .order('kick_off',  { ascending: true });
  if (error) console.error('getWWCMatches:', error.message);
  return (data ?? []) as WWCMatch[];
}

export async function getWWCMatchById(matchId: number): Promise<WWCMatch | null> {
  const { data, error } = await supabase
    .from('wwc2023_matches')
    .select('*')
    .eq('match_id', matchId)
    .single();
  if (error) console.error('getWWCMatchById:', error.message);
  return (data ?? null) as WWCMatch | null;
}

export async function getWWCMatchesByStage(stage: string): Promise<WWCMatch[]> {
  const { data } = await supabase
    .from('wwc2023_matches')
    .select('*')
    .eq('competition_stage', stage)
    .order('match_date', { ascending: true });
  return (data ?? []) as WWCMatch[];
}

// ── Lineup queries ────────────────────────────────────────────────────────────

export async function getWWCLineup(matchId: number): Promise<WWCLineupPlayer[]> {
  const { data, error } = await supabase
    .from('wwc2023_lineups')
    .select('*')
    .eq('match_id', matchId)
    .order('jersey_number', { ascending: true });
  if (error) console.error('getWWCLineup:', error.message);
  return (data ?? []) as WWCLineupPlayer[];
}

// ── Player stats queries ──────────────────────────────────────────────────────

export async function getWWCPlayerStatsForMatch(matchId: number): Promise<WWCPlayerStat[]> {
  const { data, error } = await supabase
    .from('wwc2023_player_stats')
    .select('*')
    .eq('match_id', matchId)
    .order('minutes_played', { ascending: false });
  if (error) console.error('getWWCPlayerStatsForMatch:', error.message);
  return (data ?? []) as WWCPlayerStat[];
}

export async function getWWCPlayerStatsByName(
  playerName: string,
): Promise<WWCPlayerStat[]> {
  const { data } = await supabase
    .from('wwc2023_player_stats')
    .select('*')
    .ilike('player_name', `%${playerName}%`);
  return (data ?? []) as WWCPlayerStat[];
}

/** Aggregate WWC 2023 stats per player across all matches they played. */
export async function getWWCTournamentPlayerStats(): Promise<TournamentPlayerStat[]> {
  const { data, error } = await supabase
    .from('wwc2023_player_stats')
    .select(
      'player_id, player_name, team, shots, goals, xg, passes, passes_complete,' +
      'pressures, dribbles_complete, minutes_played, assists, key_passes,' +
      'shots_on_target, carries',
    );
  if (error) { console.error('getWWCTournamentPlayerStats:', error.message); return []; }

  const agg: Record<number, TournamentPlayerStat> = {};
  for (const r of (data ?? [])) {
    if (!r.player_id) continue;
    if (!agg[r.player_id]) {
      agg[r.player_id] = {
        player_id: r.player_id, player_name: r.player_name,
        player_nickname: '', team: r.team, position: '',
        matches_played: 0, minutes_played: 0,
        goals: 0, xg: 0, assists: 0, key_passes: 0,
        passes: 0, passes_complete: 0,
        shots: 0, shots_on_target: 0,
        pressures: 0, dribbles_complete: 0,
      };
    }
    const p = agg[r.player_id];
    p.matches_played++;
    p.minutes_played    += r.minutes_played    ?? 0;
    p.goals             += r.goals             ?? 0;
    p.xg                += r.xg               ?? 0;
    p.assists           += r.assists           ?? 0;
    p.key_passes        += r.key_passes        ?? 0;
    p.passes            += r.passes            ?? 0;
    p.passes_complete   += r.passes_complete   ?? 0;
    p.shots             += r.shots             ?? 0;
    p.shots_on_target   += r.shots_on_target   ?? 0;
    p.pressures         += r.pressures         ?? 0;
    p.dribbles_complete += r.dribbles_complete ?? 0;
  }

  return Object.values(agg).map(p => ({
    ...p,
    pass_pct:    p.passes > 0 ? p.passes_complete / p.passes : 0,
    xg_per_shot: p.shots > 0  ? p.xg / p.shots              : 0,
  }));
}

// ── Event queries ─────────────────────────────────────────────────────────────

export async function getWWCShotEvents(matchId: number): Promise<WWCEvent[]> {
  const { data } = await supabase
    .from('wwc2023_events')
    .select('*')
    .eq('match_id', matchId)
    .eq('type', 'Shot')
    .order('minute', { ascending: true });
  return (data ?? []) as WWCEvent[];
}

export async function getWWCEventsForMatch(
  matchId: number,
  types?: string[],
): Promise<WWCEvent[]> {
  let q = supabase
    .from('wwc2023_events')
    .select('*')
    .eq('match_id', matchId)
    .order('idx', { ascending: true });
  if (types?.length) q = q.in('type', types);
  const { data } = await q;
  return (data ?? []) as WWCEvent[];
}

// ── Men's WC 2022 (GOAT Builder) ─────────────────────────────────────────────

export interface M22Match {
  match_id: number;
  match_date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  competition_stage: string;
  stadium: string;
}

export interface M22PlayerStat {
  player_id: number;
  player_name: string;
  player_nickname: string;
  team: string;
  position: string;
  matches_played: number;
  minutes_played: number;
  goals: number;
  xg: number;
  assists: number;
  key_passes: number;
  passes: number;
  passes_complete: number;
  shots: number;
  shots_on_target: number;
  pressures: number;
  dribbles_complete: number;
}

export async function getMen2022Matches(): Promise<M22Match[]> {
  const { data } = await supabase
    .from('wc2022m_matches')
    .select('*')
    .order('match_date', { ascending: true });
  return (data ?? []) as M22Match[];
}

export async function getMen2022PlayerStats(): Promise<M22PlayerStat[]> {
  const { data, error } = await supabase
    .from('wc2022m_player_stats')
    .select('*')
    .order('goals', { ascending: false });
  if (error) console.error('getMen2022PlayerStats:', error.message);
  return (data ?? []) as M22PlayerStat[];
}

/** All distinct players from WWC 2023 lineups (for GOAT Builder pool). */
export interface WomenPlayer {
  player_id: number;
  player_name: string;
  player_nickname: string;
  team: string;
  position: string;
  jersey_number: number;
}

export async function getWWCPlayerPool(): Promise<WomenPlayer[]> {
  const { data } = await supabase
    .from('wwc2023_lineups')
    .select('player_id, player_name, player_nickname, team, position, jersey_number')
    .order('player_name', { ascending: true });
  const seen = new Set<number>();
  const out: WomenPlayer[] = [];
  for (const p of (data ?? [])) {
    if (!p.player_id || seen.has(p.player_id)) continue;
    seen.add(p.player_id);
    out.push(p as WomenPlayer);
  }
  return out;
}
