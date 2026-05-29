import { useState, useContext, useMemo } from 'react';
import { DataContext } from '../../context/DataContext';
import { useAppContext } from '../../context/AppContext';

const PassMap = () => {
  const { events } = useContext(DataContext);
  const { setCopilotQuery } = useAppContext();
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');

  const hasValidCoords = (e: any) =>
    (e.x_location_start != null && e.y_location_start != null) ||
    (e.x_location_end   != null && e.y_location_end   != null);

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

  const filteredPasses = useMemo(() => {
    const passes = filteredEvents.filter(e =>
      e.event === 'pass' && hasValidCoords(e)
    );
    if (filterOutcome === 'all') return passes;
    return passes.filter(pass => {
      if (filterOutcome === 'complete')   return pass.outcome?.includes('complete');
      if (filterOutcome === 'incomplete') return pass.outcome?.includes('incomplete');
      if (filterOutcome === 'assist')     return pass.outcome === 'assist';
      return pass.outcome === filterOutcome;
    });
  }, [filteredEvents, filterOutcome]);

  const getPassColor = (outcome: string | undefined) => {
    if (!outcome)                          return '#6B7280';
    if (outcome.includes('complete'))      return '#00D9FF';
    if (outcome.includes('incomplete'))    return '#F87171';
    if (outcome === 'assist')              return '#FBB040';
    return '#6B7280';
  };

  const getEventCoords = (event: any) => ({
    startX: event.x_location_start ?? 0,
    startY: event.y_location_start ?? 0,
    endX:   event.x_location_end   ?? event.x_location_start ?? 0,
    endY:   event.y_location_end   ?? event.y_location_start ?? 0,
  });

  const stats = useMemo(() => {
    const allPasses = filteredEvents.filter(e => e.event === 'pass');
    const complete   = allPasses.filter(p => p.outcome?.includes('complete')).length;
    const incomplete = allPasses.filter(p => p.outcome?.includes('incomplete')).length;
    const assists    = allPasses.filter(p => p.outcome === 'assist').length;
    const total      = complete + incomplete + assists;
    const accuracy   = total > 0 ? ((complete / total) * 100).toFixed(1) : '0.0';
    return { complete, incomplete, assists, accuracy };
  }, [filteredEvents]);

  const displayPasses = filteredPasses.slice(0, 200);

  const handleInterpret = () => {
    const total    = filteredPasses.length;
    const compPct  = total > 0 ? Math.round((stats.complete / total) * 100) : 0;
    const teamLabel = selectedTeam === 'all' ? 'both teams combined' : selectedTeam;
    setCopilotQuery(
      `Interpret this pass map for ${teamLabel} in this WWC 2023 match. ` +
      `Total passes: ${total}. Complete: ${stats.complete} (${compPct}%). ` +
      `Incomplete: ${stats.incomplete}. Assists: ${stats.assists}. ` +
      `What does this passing pattern reveal about their tactical approach?`
    );
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-white">Pass Map</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleInterpret}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-xs text-purple-200 font-medium transition-all"
            >
              ✦ Interpret
            </button>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Teams</option>
              {teams.map((team: string) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Passes</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
              <option value="assist">Assists</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Pitch */}
        <div
          className="relative w-full bg-green-900/20 border border-green-500/20 rounded-xl overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          {/* Pitch markings */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {/* Outer boundary */}
            <rect x="3%" y="4%" width="94%" height="92%" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" rx="2" />
            {/* Centre line */}
            <line x1="50%" y1="4%" x2="50%" y2="96%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Centre circle */}
            <ellipse cx="50%" cy="50%" rx="8%" ry="12%" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Left penalty area */}
            <rect x="3%" y="25%" width="13%" height="50%" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Right penalty area */}
            <rect x="84%" y="25%" width="13%" height="50%" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Left 6-yard box */}
            <rect x="3%" y="38%" width="5%" height="24%" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            {/* Right 6-yard box */}
            <rect x="92%" y="38%" width="5%" height="24%" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          </svg>

          {/* Pass lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {displayPasses.map((pass, i) => {
              const c = getEventCoords(pass);
              return (
                <line
                  key={i}
                  x1={`${c.startX * 100}%`}
                  y1={`${c.startY * 100}%`}
                  x2={`${c.endX * 100}%`}
                  y2={`${c.endY * 100}%`}
                  stroke={getPassColor(pass.outcome)}
                  strokeWidth="1.5"
                  opacity="0.55"
                />
              );
            })}
          </svg>

          {/* Pass start/end dots */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {displayPasses.map((pass, i) => {
              const c     = getEventCoords(pass);
              const color = getPassColor(pass.outcome);
              return (
                <g key={i}>
                  <circle cx={`${c.startX * 100}%`} cy={`${c.startY * 100}%`} r="2.5" fill={color} opacity="0.8" />
                  <circle cx={`${c.endX * 100}%`}   cy={`${c.endY * 100}%`}   r="2"   fill={color} opacity="0.6" />
                </g>
              );
            })}
          </svg>

          {/* Pass count badge */}
          {filteredPasses.length > 200 && (
            <div className="absolute bottom-3 left-3 text-[10px] text-gray-400 bg-black/60 px-2 py-1 rounded-lg backdrop-blur-sm">
              Showing 200 of {filteredPasses.length} passes
            </div>
          )}
          {filteredPasses.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              No pass data for this selection
            </div>
          )}
        </div>

        {/* Legend + Stats row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Legend */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-1 rounded" style={{ backgroundColor: '#00D9FF' }} />
              <span className="text-gray-400 text-xs">Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-1 rounded" style={{ backgroundColor: '#F87171' }} />
              <span className="text-gray-400 text-xs">Incomplete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-1 rounded" style={{ backgroundColor: '#FBB040' }} />
              <span className="text-gray-400 text-xs">Assist</span>
            </div>
          </div>

          {/* Compact stats */}
          <div className="flex gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-blue-400">{stats.complete}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Complete</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-red-400">{stats.incomplete}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Incomplete</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-yellow-400">{stats.assists}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Assists</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-green-400">{stats.accuracy}%</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassMap;
