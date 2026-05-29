import { useState, useContext, useMemo } from 'react';
import { DataContext } from '../../context/DataContext';
import { useAppContext } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SetPieceAnalysis = () => {
  const { events } = useContext(DataContext);
  const { setCopilotQuery } = useAppContext();
  const [selectedTeam, setSelectedTeam] = useState('all');

  const matchEvents = events;

  const teams = useMemo(() => {
    const teamNames = [...new Set(matchEvents.map((e: any) => e.team_name).filter(Boolean))] as string[];
    return teamNames.sort();
  }, [matchEvents]);

  const filteredEvents = useMemo(() => {
    return selectedTeam === 'all'
      ? matchEvents
      : matchEvents.filter((e: any) => e.team_name === selectedTeam);
  }, [matchEvents, selectedTeam]);

  const shots = useMemo(() => filteredEvents.filter(e => e.event === 'shot'), [filteredEvents]);

  const outcomeDistribution = useMemo(() => {
    const outcomes: Record<string, number> = {};
    shots.filter(e => e.outcome).forEach(e => {
      const key = e.outcome as string;
      outcomes[key] = (outcomes[key] || 0) + 1;
    });
    const colors: Record<string, string> = {
      'goal':    '#10B981',
      'saved':   '#3B82F6',
      'off t':   '#EF4444',
      'blocked': '#F59E0B',
      'wayward': '#EC4899',
      'post':    '#8B5CF6',
    };
    return Object.entries(outcomes)
      .map(([outcome, count]) => ({
        name:  outcome.replace(/_/g, ' ').toUpperCase(),
        value: count,
        color: colors[outcome.toLowerCase()] || '#6B7280',
      }))
      .sort((a, b) => b.value - a.value);
  }, [shots]);

  const xgByTeam = useMemo(() => {
    const allShots = matchEvents.filter(e => e.event === 'shot');
    const teamXg: Record<string, { shots: number; xg: number; goals: number }> = {};
    allShots.forEach(e => {
      const team = e.team_name || 'Unknown';
      if (!teamXg[team]) teamXg[team] = { shots: 0, xg: 0, goals: 0 };
      teamXg[team].shots++;
      teamXg[team].xg += e.xg ?? 0;
      if (e.outcome === 'goal') teamXg[team].goals++;
    });
    return Object.entries(teamXg).map(([team, s]) => ({
      team: team.length > 12 ? team.slice(0, 12) + '…' : team,
      shots: s.shots,
      xg:    parseFloat(s.xg.toFixed(2)),
      goals: s.goals,
    }));
  }, [matchEvents]);

  const timeDistribution = useMemo(() => {
    const step = 15;
    const buckets: Record<number, { count: number; goals: number }> = {};
    for (let i = 0; i < 90; i += step) buckets[i] = { count: 0, goals: 0 };
    shots.forEach(e => {
      const bucket = Math.min(Math.floor((e.minute ?? 0) / step) * step, 75);
      if (!buckets[bucket]) buckets[bucket] = { count: 0, goals: 0 };
      buckets[bucket].count++;
      if (e.outcome === 'goal') buckets[bucket].goals++;
    });
    return Object.entries(buckets).map(([start, s]) => ({
      period: `${start}-${parseInt(start) + step}'`,
      count:  s.count,
      goals:  s.goals,
    }));
  }, [shots]);

  const topShooters = useMemo(() => {
    const byPlayer: Record<string, { shots: number; xg: number; goals: number }> = {};
    shots.forEach(e => {
      const name = e.from_player_name || 'Unknown';
      if (!byPlayer[name]) byPlayer[name] = { shots: 0, xg: 0, goals: 0 };
      byPlayer[name].shots++;
      byPlayer[name].xg += e.xg ?? 0;
      if (e.outcome === 'goal') byPlayer[name].goals++;
    });
    return Object.entries(byPlayer)
      .map(([name, s]) => ({ name, shots: s.shots, xg: parseFloat(s.xg.toFixed(2)), goals: s.goals }))
      .sort((a, b) => b.xg - a.xg)
      .slice(0, 6);
  }, [shots]);

  const shotLocations = useMemo(() => {
    return shots
      .filter(e => e.x_location_start != null && e.y_location_start != null)
      .map(e => ({
        x:       e.x_location_start!,
        y:       e.y_location_start!,
        outcome: e.outcome,
        xg:      e.xg,
        player:  e.from_player_name,
      }));
  }, [shots]);

  const totalXg = shots.reduce((sum, e) => sum + (e.xg ?? 0), 0);
  const goals   = shots.filter(e => e.outcome === 'goal').length;

  const handleInterpret = () => {
    const teamLabel = selectedTeam === 'all' ? 'both teams' : selectedTeam;
    setCopilotQuery(
      `Interpret the shot analysis for ${teamLabel} in this WWC 2023 match. ` +
      `Total shots: ${shots.length}. Goals: ${goals}. Total xG: ${totalXg.toFixed(2)}. ` +
      `What does this shot pattern reveal about their attacking approach and finishing quality?`
    );
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Shot Analysis</h2>
          <div className="flex gap-3">
            <button
              onClick={handleInterpret}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-xs text-purple-200 font-medium transition-all"
            >
              ✦ Interpret
            </button>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-sm"
            >
              <option value="all">All Teams</option>
              {teams.map((team: string) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shot Map */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Shot Locations</h3>
            <div className="bg-green-800/20 border border-green-500/20 rounded-lg p-4 relative" style={{ aspectRatio: '1.5/1' }}>
              <div className="absolute inset-4 border-2 border-white/20">
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2"></div>
                <div className="absolute left-0 top-1/3 w-4 h-1/3 border-2 border-white/20 border-l-0"></div>
                <div className="absolute right-0 top-1/3 w-4 h-1/3 border-2 border-white/20 border-r-0"></div>
                <div className="absolute left-0 top-1/4 w-16 h-1/2 border-2 border-white/20 border-l-0"></div>
                <div className="absolute right-0 top-1/4 w-16 h-1/2 border-2 border-white/20 border-r-0"></div>
              </div>
              {shotLocations.map((shot, i) => {
                const color = shot.outcome === 'goal' ? '#10B981'
                  : shot.outcome?.includes('save') ? '#3B82F6'
                  : '#EF4444';
                const size = Math.max(8, Math.min(20, (shot.xg ?? 0.05) * 80));
                return (
                  <div
                    key={i}
                    className="absolute rounded-full border-2 border-white/40 cursor-pointer hover:scale-125 transition-transform z-10"
                    style={{
                      left:            `${shot.x * 100}%`,
                      top:             `${shot.y * 100}%`,
                      width:           size,
                      height:          size,
                      transform:       'translate(-50%, -50%)',
                      backgroundColor: color,
                      opacity:         0.8,
                    }}
                    title={`${shot.player || 'Unknown'} — xG: ${(shot.xg ?? 0).toFixed(2)} — ${shot.outcome || 'unknown'}`}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                <span className="text-gray-300">Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span className="text-gray-300">Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-gray-300">Off Target / Blocked</span>
              </div>
            </div>
          </div>

          {/* Outcome Pie */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Shot Outcomes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  fontSize={12}
                >
                  {outcomeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* xG by Team */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">xG by Team</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={xgByTeam}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="team" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', fontSize: '12px' }} labelStyle={{ color: '#F9FAFB' }} />
                <Bar dataKey="shots" fill="#3B82F6" name="Shots" />
                <Bar dataKey="xg"    fill="#8B5CF6" name="xG" />
                <Bar dataKey="goals" fill="#10B981" name="Goals" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Shooters */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Top Shooters by xG</h3>
            <div className="space-y-3">
              {topShooters.length === 0
                ? <p className="text-gray-500 text-sm">No shot data available</p>
                : topShooters.map(player => (
                  <div key={player.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white text-sm font-medium truncate max-w-[160px]">{player.name}</span>
                    <div className="flex gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-purple-400 font-semibold text-sm">{player.xg}</div>
                        <div className="text-gray-500 text-xs">xG</div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-400 font-semibold text-sm">{player.shots}</div>
                        <div className="text-gray-500 text-xs">shots</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold text-sm">{player.goals}</div>
                        <div className="text-gray-500 text-xs">goals</div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Time Distribution */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Shots Over Match Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', fontSize: '12px' }} labelStyle={{ color: '#F9FAFB' }} />
                <Bar dataKey="count" fill="#3B82F6" name="Total Shots" />
                <Bar dataKey="goals" fill="#10B981" name="Goals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
            <div className="text-3xl font-bold text-blue-400 mb-2">{shots.length}</div>
            <div className="text-gray-300 text-xs uppercase tracking-wide">Total Shots</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
            <div className="text-3xl font-bold text-green-400 mb-2">{goals}</div>
            <div className="text-gray-300 text-xs uppercase tracking-wide">Goals</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
            <div className="text-3xl font-bold text-purple-400 mb-2">{totalXg.toFixed(2)}</div>
            <div className="text-gray-300 text-xs uppercase tracking-wide">Total xG</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {shots.length > 0 ? ((goals / shots.length) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-gray-300 text-xs uppercase tracking-wide">Conversion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPieceAnalysis;
