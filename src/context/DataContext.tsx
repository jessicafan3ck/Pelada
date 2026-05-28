import React, { createContext, useState, useEffect, useContext } from 'react';
import { getWWCMatches, getWWCLineup, getWWCTournamentPlayerStats } from '../services/wwcData';
import type { WWCMatch, TournamentPlayerStat } from '../services/wwcData';

// Legacy shape for LineupView/ContextPanel (already in use across the codebase)
export interface LineupPlayer {
  id: number;
  name: string;
  nickname: string;
  jersey: number;
  position: string;
  position_id: number;
  country: string;
  x: number;
  y: number;
}

// Legacy Event type kept for LangGraph tool output compatibility
export interface Event {
  match_id: number;
  team_name: string;
  from_player_name?: string;
  to_player_name?: string;
  event: string;
  outcome?: string;
  minute?: number;
  x_location_start?: number;
  y_location_start?: number;
  x_location_end?: number;
  y_location_end?: number;
  pressure?: string;
  origin?: string;
  xg?: number;
}

export interface MatchMeta {
  match_id: number;
  home_team: string;
  away_team: string;
  date: string;
  stage: string;
  home_score: number;
  away_score: number;
  stadium?: string;
  home_group?: string;
  away_group?: string;
  kick_off?: string;
}

// ── Pitch position helpers for LineupView ─────────────────────────────────────
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  'Goalkeeper':             { x: 50, y: 92 },
  'Right Back':             { x: 80, y: 75 },
  'Right Center Back':      { x: 65, y: 82 },
  'Center Back':            { x: 50, y: 82 },
  'Left Center Back':       { x: 35, y: 82 },
  'Left Back':              { x: 20, y: 75 },
  'Right Wing Back':        { x: 85, y: 62 },
  'Left Wing Back':         { x: 15, y: 62 },
  'Right Defensive Midfield':{ x: 65, y: 65 },
  'Center Defensive Midfield':{ x: 50, y: 65 },
  'Left Defensive Midfield':{ x: 35, y: 65 },
  'Right Midfield':         { x: 78, y: 52 },
  'Center Midfield':        { x: 50, y: 52 },
  'Left Midfield':          { x: 22, y: 52 },
  'Right Center Midfield':  { x: 65, y: 52 },
  'Left Center Midfield':   { x: 35, y: 52 },
  'Right Attacking Midfield':{ x: 72, y: 38 },
  'Center Attacking Midfield':{ x: 50, y: 38 },
  'Left Attacking Midfield':{ x: 28, y: 38 },
  'Right Wing':             { x: 82, y: 30 },
  'Left Wing':              { x: 18, y: 30 },
  'Right Center Forward':   { x: 65, y: 22 },
  'Center Forward':         { x: 50, y: 20 },
  'Left Center Forward':    { x: 35, y: 22 },
  'Secondary Striker':      { x: 50, y: 30 },
};

function posCoords(position: string, idx: number): { x: number; y: number } {
  if (POSITION_COORDS[position]) return POSITION_COORDS[position];
  // fallback grid
  const row = Math.floor(idx / 4);
  const col = idx % 4;
  return { x: 20 + col * 22, y: 85 - row * 18 };
}

function wwcMatchToMeta(m: WWCMatch): MatchMeta {
  return {
    match_id:   m.match_id,
    home_team:  m.home_team,
    away_team:  m.away_team,
    date:       m.match_date,
    stage:      m.competition_stage,
    home_score: m.home_score,
    away_score: m.away_score,
    stadium:    m.stadium,
    home_group: m.home_group,
    away_group: m.away_group,
    kick_off:   m.kick_off,
  };
}

// ── Context type ──────────────────────────────────────────────────────────────

interface DataContextType {
  events: Event[];
  setEvents: (events: Event[]) => void;
  matchMeta: MatchMeta[];
  wwcMatches: WWCMatch[];
  lineups: Record<number, Record<string, LineupPlayer[]>>;
  selectedMatch: number | null;
  setSelectedMatch: (id: number | null) => void;
  tournamentStats: TournamentPlayerStat[];
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  sessionId: string;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  sendLangGraphQuery: (query: string, toolCall?: string, toolArgs?: any) => Promise<any>;
  // Legacy compat
  teamStats: any[];
  playerStats: any[];
  selectedLeague: string;
  setSelectedLeague: (l: string) => void;
  availableLeagues: string[];
}

export const DataContext = createContext<DataContextType>({
  events: [], setEvents: () => {},
  matchMeta: [], wwcMatches: [],
  lineups: {},
  selectedMatch: null, setSelectedMatch: () => {},
  tournamentStats: [],
  messages: [], setMessages: () => {},
  sessionId: 'default-session',
  isLoading: false, setIsLoading: () => {},
  sendLangGraphQuery: async () => {},
  teamStats: [], playerStats: [],
  selectedLeague: 'All', setSelectedLeague: () => {},
  availableLeagues: [],
});

export const useData = () => useContext(DataContext);

// ── Provider ──────────────────────────────────────────────────────────────────

export const DataContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [events, setEvents]           = useState<Event[]>([]);
  const [wwcMatches, setWwcMatches]   = useState<WWCMatch[]>([]);
  const [matchMeta, setMatchMeta]     = useState<MatchMeta[]>([]);
  const [lineups, setLineups]         = useState<Record<number, Record<string, LineupPlayer[]>>>({});
  const [selectedMatch, _setSelected] = useState<number | null>(null);
  const [tournamentStats, setTournamentStats] = useState<TournamentPlayerStat[]>([]);
  const [messages, setMessages]       = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [sessionId]                   = useState('session_' + Math.random().toString(36).slice(2, 9));

  // Startup: load all matches + tournament player stats
  useEffect(() => {
    getWWCMatches().then(matches => {
      setWwcMatches(matches);
      setMatchMeta(matches.map(wwcMatchToMeta));
      // Auto-select the opening match
      if (matches.length > 0) {
        _setSelected(matches[0].match_id);
      }
    });
    getWWCTournamentPlayerStats().then(setTournamentStats);
  }, []);

  // When selected match changes, load its lineups
  const setSelectedMatch = (id: number | null) => {
    _setSelected(id);
    if (!id) return;
    if (lineups[id]) return; // already cached
    getWWCLineup(id).then(players => {
      const byTeam: Record<string, LineupPlayer[]> = {};
      for (const p of players) {
        if (!byTeam[p.team]) byTeam[p.team] = [];
        byTeam[p.team].push({
          id:          p.player_id,
          name:        p.player_name,
          nickname:    p.player_nickname ?? p.player_name,
          jersey:      p.jersey_number,
          position:    p.position,
          position_id: p.position_id ?? 0,
          country:     p.country,
          x:           posCoords(p.position, byTeam[p.team].length).x,
          y:           posCoords(p.position, byTeam[p.team].length - 1).y,
        });
      }
      setLineups(prev => ({ ...prev, [id]: byTeam }));
    });
  };

  const sendLangGraphQuery = async (query: string, toolCall?: string, toolArgs?: any) => {
    try {
      const response = await fetch('/api/langgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          session_id: sessionId,
          tool_call: toolCall,
          tool_args: toolArgs,
          reinject: false,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('LangGraph error:', err);
      return {
        final_response: 'Backend not available.',
        tool_output: { events: [] },
        visualization_type: null,
      };
    }
  };

  return (
    <DataContext.Provider value={{
      events, setEvents,
      matchMeta, wwcMatches,
      lineups,
      selectedMatch, setSelectedMatch,
      tournamentStats,
      messages, setMessages,
      sessionId,
      isLoading, setIsLoading,
      sendLangGraphQuery,
      // legacy compat stubs
      teamStats: [], playerStats: [],
      selectedLeague: 'All', setSelectedLeague: () => {},
      availableLeagues: [],
    }}>
      {children}
    </DataContext.Provider>
  );
};
