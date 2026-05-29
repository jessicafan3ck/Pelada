import React, { useState, useContext, useMemo } from 'react';
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

  // Get unique teams
  const teams = useMemo(() => {
    const teamNames = [...new Set(matchEvents.map((e: any) => e.team_name).filter(Boolean))];
    return teamNames.sort();
  }, [matchEvents]);

  // Filter events by team
  const filteredEvents = useMemo(() => {
    return selectedTeam === 'all'
      ? matchEvents
      : matchEvents.filter((e: any) => e.team_name === selectedTeam);
  }, [matchEvents, selectedTeam]);

  // Pass detection and filtering
  const filteredPasses = useMemo(() => {
    const passes = filteredEvents.filter(e => 
      e.event === 'pass' && hasValidCoords(e)
    );

    if (filterOutcome === 'all') return passes;
    
    return passes.filter(pass => {
      if (filterOutcome === 'complete') return pass.outcome?.includes('complete');
      if (filterOutcome === 'incomplete') return pass.outcome?.includes('incomplete');
      if (filterOutcome === 'assist') return pass.outcome === 'assist';
      return pass.outcome === filterOutcome;
    });
  }, [filteredEvents, filterOutcome]);

  const getPassColor = (outcome: string) => {
    if (!outcome) return '#6B7280';
    if (outcome.includes('complete')) return '#00D9FF';
    if (outcome.includes('incomplete')) return '#F87171';
    if (outcome === 'assist') return '#FBB040';
    return '#6B7280';
  };

  const getEventCoords = (event: any) => {
    const startX = event.x_location_start ?? event.x ?? 0;
    const startY = event.y_location_start ?? event.y ?? 0;
    const endX = event.x_location_end ?? event.x ?? 0;
    const endY = event.y_location_end ?? event.y ?? 0;
    return { startX, startY, endX, endY };
  };

  const stats = useMemo(() => {
    const allPasses = filteredEvents.filter(e => e.event === 'pass');
    const complete = allPasses.filter(p => p.outcome?.includes('complete')).length;
    const incomplete = allPasses.filter(p => p.outcome?.includes('incomplete')).length;
    const assists = allPasses.filter(p => p.outcome === 'assist').length;
    return { complete, incomplete, assists };
  }, [filteredEvents]);

  const handleInterpret = () => {
    const total = filteredPasses.length;
    const compPct = total > 0 ? Math.round(stats.complete / total * 100) : 0;
    const teamLabel = selectedTeam === 'all' ? 'both teams combined' : selectedTeam;
    setCopilotQuery(
      `Interpret this pass map for ${teamLabel} in this WWC 2023 match. ` +
      `Total passes: ${total}. Complete: ${stats.complete} (${compPct}%). ` +
      `Incomplete: ${stats.incomplete}. Assists: ${stats.assists}. ` +
      `What does this passing pattern reveal about their tactical approach?`
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-white/10">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Pass Map</h2>
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
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              {teams.map((team: string) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Passes</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
              <option value="assist">Assists</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Pitch Visualization */}
          <div className="lg:col-span-3">
            <div className="bg-green-800/20 border border-green-500/20 rounded-lg p-4 relative" style={{ aspectRatio: '1.5/1' }}>
              {/* Full pitch outline */}
              <div className="absolute inset-4 border-2 border-white/20">
                {/* Center line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2"></div>
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                
                {/* Left goal area */}
                <div className="absolute left-0 top-1/3 w-8 h-1/3 border-2 border-white/20 border-l-0"></div>
                {/* Right goal area */}
                <div className="absolute right-0 top-1/3 w-8 h-1/3 border-2 border-white/20 border-r-0"></div>
                
                {/* Left penalty area */}
                <div className="absolute left-0 top-1/4 w-16 h-1/2 border-2 border-white/20 border-l-0"></div>
                {/* Right penalty area */}
                <div className="absolute right-0 top-1/4 w-16 h-1/2 border-2 border-white/20 border-r-0"></div>
              </div>

              {/* Pass lines - SVG overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {filteredPasses.slice(0, 100).map((pass, i) => { // Limit to 100 passes for performance
                  const coords = getEventCoords(pass);
                  return (
                    <line
                      key={i}
                      x1={`${coords.startX * 100}%`}
                      y1={`${coords.startY * 100}%`}
                      x2={`${coords.endX * 100}%`}
                      y2={`${coords.endY * 100}%`}
                      stroke={getPassColor(pass.outcome)}
                      strokeWidth="2"
                      opacity="0.7"
                      className="drop-shadow-sm"
                    />
                  );
                })}
              </svg>

              {/* Pass start/end points */}
              {filteredPasses.slice(0, 100).map((pass, i) => {
                const coords = getEventCoords(pass);
                const color = getPassColor(pass.outcome);
                
                return (
                  <React.Fragment key={i}>
                    {/* Start point */}
                    <div
                      className="absolute w-1.5 h-1.5 rounded-full border border-white/50"
                      style={{
                        left: `${coords.startX * 100}%`,
                        top: `${coords.startY * 100}%`,
                        backgroundColor: color,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}
                    />
                    {/* End point */}
                    <div
                      className="absolute w-1.5 h-1.5 rounded-full border border-white/50"
                      style={{
                        left: `${coords.endX * 100}%`,
                        top: `${coords.endY * 100}%`,
                        backgroundColor: color,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded" style={{ backgroundColor: '#00D9FF' }}></div>
                <span className="text-gray-300 text-sm">Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded" style={{ backgroundColor: '#F87171' }}></div>
                <span className="text-gray-300 text-sm">Incomplete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded" style={{ backgroundColor: '#FBB040' }}></div>
                <span className="text-gray-300 text-sm">Assist</span>
              </div>
            </div>
            
            {filteredPasses.length > 100 && (
              <p className="text-gray-400 text-sm mt-2">
                Showing first 100 passes for performance. Total: {filteredPasses.length}
              </p>
            )}
          </div>

          {/* Statistics Panel */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6 text-center border border-white/5">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.complete}</div>
              <div className="text-gray-300 text-sm uppercase tracking-wide">Complete</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 text-center border border-white/5">
              <div className="text-3xl font-bold text-red-400 mb-2">{stats.incomplete}</div>
              <div className="text-gray-300 text-sm uppercase tracking-wide">Incomplete</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 text-center border border-white/5">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.assists}</div>
              <div className="text-gray-300 text-sm uppercase tracking-wide">Assist</div>
            </div>
            
            {/* Additional Stats */}
            <div className="bg-gray-800 rounded-lg p-6 text-center border border-white/5">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {stats.complete + stats.incomplete + stats.assists > 0 
                  ? ((stats.complete / (stats.complete + stats.incomplete + stats.assists)) * 100).toFixed(1)
                  : 0}%
              </div>
              <div className="text-gray-300 text-sm uppercase tracking-wide">Pass Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassMap;