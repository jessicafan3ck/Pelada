import React, { useContext, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { useAppContext, SelectedPlayer } from '../context/AppContext';
import MatchContextBar from './MatchContextBar';

interface PlayerDot {
  id: number;
  name: string;
  nickname: string;
  jersey: number;
  position: string;
  position_id: number;
  team: string;
  country: string;
  x: number;
  y: number;
}

const PITCH_W = 680;
const PITCH_H = 440;

function PitchMarking() {
  return (
    <g stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.15">
      {/* Outline */}
      <rect x="0" y="0" width={PITCH_W} height={PITCH_H} />
      {/* Centre line */}
      <line x1={PITCH_W / 2} y1="0" x2={PITCH_W / 2} y2={PITCH_H} />
      {/* Centre circle */}
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="60" />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="3" fill="#ffffff" stroke="none" opacity="0.3" />
      {/* Left penalty box */}
      <rect x="0" y={PITCH_H * 0.2} width="132" height={PITCH_H * 0.6} />
      {/* Left 6-yard box */}
      <rect x="0" y={PITCH_H * 0.35} width="44" height={PITCH_H * 0.3} />
      {/* Right penalty box */}
      <rect x={PITCH_W - 132} y={PITCH_H * 0.2} width="132" height={PITCH_H * 0.6} />
      {/* Right 6-yard box */}
      <rect x={PITCH_W - 44} y={PITCH_H * 0.35} width="44" height={PITCH_H * 0.3} />
      {/* Penalty spots */}
      <circle cx="100" cy={PITCH_H / 2} r="3" fill="#ffffff" stroke="none" opacity="0.3" />
      <circle cx={PITCH_W - 100} cy={PITCH_H / 2} r="3" fill="#ffffff" stroke="none" opacity="0.3" />
    </g>
  );
}

function PlayerMarker({
  player, color, isHome, isSelected, onClick,
}: {
  player: PlayerDot; color: string; isHome: boolean; isSelected: boolean; onClick: () => void;
}) {
  // Each team occupies their own half: home = left half, away = right half (mirrored)
  const HALF = PITCH_W / 2;
  const px = isHome
    ? player.x * HALF
    : PITCH_W - player.x * HALF;
  const py = player.y * PITCH_H;
  const r = isSelected ? 20 : 16;

  return (
    <g
      transform={`translate(${px},${py})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {isSelected && (
        <circle r={r + 6} fill={color} opacity="0.2" />
      )}
      <circle r={r} fill={color} opacity={isSelected ? 1 : 0.85} stroke="white" strokeWidth={isSelected ? 2.5 : 1.5} />
      <text y="-1" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="700">
        {player.jersey}
      </text>
      <text y={r + 12} textAnchor="middle" fill="white" fontSize="10" fontWeight="600" opacity="0.9">
        {player.nickname.length > 10 ? player.nickname.substring(0, 9) + '…' : player.nickname}
      </text>
    </g>
  );
}

export default function LineupView() {
  const { matchMeta, lineups } = useContext(DataContext);
  const { activeMatchId, setSelectedPlayer, selectedPlayer } = useAppContext();
  const [viewingSide, setViewingSide] = useState<'both' | 'home' | 'away'>('both');

  const match = useMemo(
    () => matchMeta.find((m: any) => m.match_id === activeMatchId) ?? null,
    [matchMeta, activeMatchId]
  );

  const lineupData = useMemo(() => {
    if (!match || !activeMatchId) return { home: [], away: [] };
    const raw = lineups[activeMatchId];
    if (!raw) return { home: [], away: [] };
    const home: PlayerDot[] = (raw[match.home_team] || []).map((p: any) => ({ ...p, team: match.home_team }));
    const away: PlayerDot[] = (raw[match.away_team] || []).map((p: any) => ({ ...p, team: match.away_team }));
    return { home, away };
  }, [match, activeMatchId, lineups]);

  const handlePlayerClick = (player: PlayerDot) => {
    const sp: SelectedPlayer = {
      id: player.id,
      name: player.name,
      nickname: player.nickname,
      jersey: player.jersey,
      position: player.position,
      position_id: player.position_id,
      team: player.team,
      match_id: activeMatchId!,
      country: player.country,
      x: player.x,
      y: player.y,
    };
    setSelectedPlayer(selectedPlayer?.id === player.id ? null : sp);
  };

  if (!match) {
    return (
      <div className="space-y-6">
        <MatchContextBar />
        <div className="flex flex-col items-center justify-center h-96 text-zinc-500 gap-3">
          <Users className="w-10 h-10 opacity-30" />
          <p className="text-sm">Select a match above to see the lineup.</p>
        </div>
      </div>
    );
  }

  const showHome = viewingSide !== 'away';
  const showAway = viewingSide !== 'home';

  return (
    <div className="space-y-6">
      <MatchContextBar />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {match.home_team} <span className="text-zinc-500 font-normal text-lg">vs</span> {match.away_team}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {match.stage} · {match.date} · {match.home_score}–{match.away_score} {parseInt(String(match.home_score)) === parseInt(String(match.away_score)) ? '(AET/Pens)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {(['both', 'home', 'away'] as const).map(side => (
            <button
              key={side}
              onClick={() => setViewingSide(side)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewingSide === side
                  ? 'bg-white/15 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {side === 'both' ? 'Both' : side === 'home' ? match.home_team.split(' ').pop() : match.away_team.split(' ').pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Pitch */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden p-6">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #143022 50%, #1a3a2a 100%)' }}
        >
          {/* Grass stripes */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 34px, rgba(255,255,255,0.08) 34px, rgba(255,255,255,0.08) 68px)',
            }}
          />
          <svg
            viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
            className="w-full"
            style={{ display: 'block' }}
          >
            <PitchMarking />

            {/* Home team dots (blue) */}
            {showHome && lineupData.home.map(p => (
              <PlayerMarker
                key={p.id}
                player={p}
                color="#3b82f6"
                isHome={true}
                isSelected={selectedPlayer?.id === p.id}
                onClick={() => handlePlayerClick(p)}
              />
            ))}

            {/* Away team dots (red) */}
            {showAway && lineupData.away.map(p => (
              <PlayerMarker
                key={p.id}
                player={p}
                color="#ef4444"
                isHome={false}
                isSelected={selectedPlayer?.id === p.id}
                onClick={() => handlePlayerClick(p)}
              />
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-zinc-300">{match.home_team}</span>
            <span className="text-xs text-zinc-600">(attacking →)</span>
          </div>
          <p className="text-xs text-zinc-600">Click a player for context</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">(← attacking)</span>
            <span className="text-sm font-medium text-zinc-300">{match.away_team}</span>
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </div>
        </div>
      </div>

      {/* Player roster below pitch */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { team: match.home_team, players: lineupData.home, color: 'blue' },
          { team: match.away_team, players: lineupData.away, color: 'red' },
        ].map(({ team, players, color }) => (
          <div key={team} className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden">
            <div className={`px-4 py-3 border-b border-white/5 bg-${color}-500/10`}>
              <h3 className="text-sm font-bold text-white">{team}</h3>
            </div>
            <div className="divide-y divide-white/5">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePlayerClick(p)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${
                    selectedPlayer?.id === p.id ? 'bg-white/8 text-white' : 'text-zinc-300'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center text-xs font-bold text-${color}-300 shrink-0`}>
                    {p.jersey}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-zinc-500 truncate">{p.position} · {p.country}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
