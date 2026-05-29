import { useState, useContext, useMemo } from 'react';
import { DataContext } from '../../context/DataContext';
import { useAppContext } from '../../context/AppContext';

// StatsBomb pitch: 120 × 80 yards.  Our events are normalised to 0-1,
// so multiply by 120/80 to get back into viewBox coords.
const SB_X = 120;
const SB_Y = 80;

const PassMap = () => {
  const { events, matchMeta } = useContext(DataContext);
  const { setCopilotQuery } = useAppContext();
  const [filterOutcome,   setFilterOutcome]   = useState('all');
  const [selectedTeam,    setSelectedTeam]    = useState('all');
  const [selectedMatchId, setSelectedMatchId] = useState<'all' | number>('all');

  const stripW = (s: string) => s.replace(/\s*Women's?/i, '').trim();

  // Only show matches that have actual event rows loaded
  const matchesWithData = useMemo(() => {
    const ids = new Set(events.map(e => e.match_id));
    return matchMeta.filter(m => ids.has(m.match_id));
  }, [events, matchMeta]);

  const matchEvents = useMemo(() => {
    if (selectedMatchId === 'all') return events;
    return events.filter(e => e.match_id === selectedMatchId);
  }, [events, selectedMatchId]);

  const hasValidCoords = (e: any) =>
    e.x_location_start != null && e.y_location_start != null;

  const teams = useMemo(() => {
    const names = [...new Set(matchEvents.map((e: any) => e.team_name).filter(Boolean))] as string[];
    return names.sort();
  }, [matchEvents]);

  const filteredEvents = useMemo(() => {
    return selectedTeam === 'all'
      ? matchEvents
      : matchEvents.filter((e: any) => e.team_name === selectedTeam);
  }, [matchEvents, selectedTeam]);

  const filteredPasses = useMemo(() => {
    const passes = filteredEvents.filter(e => e.event === 'pass' && hasValidCoords(e));
    if (filterOutcome === 'all') return passes;
    return passes.filter(p => {
      if (filterOutcome === 'complete')   return p.outcome?.includes('complete');
      if (filterOutcome === 'incomplete') return p.outcome?.includes('incomplete');
      if (filterOutcome === 'assist')     return p.outcome === 'assist';
      return p.outcome === filterOutcome;
    });
  }, [filteredEvents, filterOutcome]);

  const getColor = (outcome: string | undefined) => {
    if (!outcome)                         return '#6B7280';
    if (outcome.includes('complete'))     return '#00D9FF';
    if (outcome.includes('incomplete'))   return '#F87171';
    if (outcome === 'assist')             return '#FBB040';
    return '#6B7280';
  };

  const stats = useMemo(() => {
    const all      = filteredEvents.filter(e => e.event === 'pass');
    const complete   = all.filter(p => p.outcome?.includes('complete')).length;
    const incomplete = all.filter(p => p.outcome?.includes('incomplete')).length;
    const assists    = all.filter(p => p.outcome === 'assist').length;
    const total      = complete + incomplete + assists;
    return { complete, incomplete, assists, accuracy: total > 0 ? ((complete / total) * 100).toFixed(1) : '0.0' };
  }, [filteredEvents]);

  // Cap displayed passes for performance — still use all for stats
  const displayPasses = filteredPasses.slice(0, 500);

  const handleInterpret = () => {
    const total     = filteredPasses.length;
    const compPct   = total > 0 ? Math.round((stats.complete / total) * 100) : 0;
    const teamLabel = selectedTeam === 'all' ? 'all teams' : selectedTeam;
    const matchObj  = matchMeta.find(m => m.match_id === selectedMatchId);
    const matchLabel = selectedMatchId === 'all'
      ? 'the full WWC 2023 tournament'
      : `${matchObj?.home_team} vs ${matchObj?.away_team}`;
    setCopilotQuery(
      `Interpret this pass map for ${teamLabel} in ${matchLabel}. ` +
      `Total passes: ${total}. Complete: ${stats.complete} (${compPct}%). ` +
      `Incomplete: ${stats.incomplete}. Assists: ${stats.assists}. ` +
      `What does this passing pattern reveal about their tactical approach?`
    );
  };

  const selectCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50";

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
              value={selectedMatchId}
              onChange={e => setSelectedMatchId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className={selectCls}
            >
              <option value="all">All Matches ({matchesWithData.length})</option>
              {matchesWithData.map(m => (
                <option key={m.match_id} value={m.match_id}>
                  {stripW(m.home_team)} vs {stripW(m.away_team)}
                </option>
              ))}
            </select>
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className={selectCls}>
              <option value="all">All Teams</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} className={selectCls}>
              <option value="all">All Passes</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
              <option value="assist">Assists</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* ── Pitch (viewBox matches StatsBomb 120 × 80) ── */}
        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '3/2' }}>
          <svg
            viewBox="-3 -2 126 84"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            {/* Grass */}
            <rect x="-3" y="-2" width="126" height="84" fill="#1a3a20" />
            {/* Pitch stripes */}
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <rect key={i} x={i * 12} y="0" width="12" height="80"
                fill={i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent'} />
            ))}

            {/* ── Pitch markings ── */}
            {/* Outer boundary */}
            <rect x="0" y="0" width="120" height="80" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
            {/* Centre line */}
            <line x1="60" y1="0" x2="60" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
            {/* Centre circle (r=10 yds) */}
            <circle cx="60" cy="40" r="10" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
            {/* Centre spot */}
            <circle cx="60" cy="40" r="0.7" fill="rgba(255,255,255,0.5)" />

            {/* Left penalty area: 18 yds deep, 40 yds wide (y 18→62) */}
            <rect x="0" y="18" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
            {/* Right penalty area */}
            <rect x="102" y="18" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />

            {/* Left 6-yard box: 6 yds deep, 20 yds wide (y 30→50) */}
            <rect x="0" y="30" width="6" height="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
            {/* Right 6-yard box */}
            <rect x="114" y="30" width="6" height="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />

            {/* Penalty spots */}
            <circle cx="12"  cy="40" r="0.7" fill="rgba(255,255,255,0.5)" />
            <circle cx="108" cy="40" r="0.7" fill="rgba(255,255,255,0.5)" />

            {/* Left penalty D — arc outside penalty area */}
            <path d="M 18,32 A 10,10 0 0,0 18,48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
            {/* Right penalty D */}
            <path d="M 102,32 A 10,10 0 0,1 102,48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />

            {/* Goals (extending outside boundary) */}
            <rect x="-2.44" y="34.16" width="2.44" height="11.68" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
            <rect x="120"   y="34.16" width="2.44" height="11.68" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />

            {/* Corner arcs (r=1 yd) */}
            <path d="M 0,1 A 1,1 0 0,0 1,0"     fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
            <path d="M 119,0 A 1,1 0 0,0 120,1"  fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
            <path d="M 120,79 A 1,1 0 0,0 119,80" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
            <path d="M 1,80 A 1,1 0 0,0 0,79"    fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />

            {/* ── Pass lines ── */}
            {displayPasses.map((pass, i) => {
              const x1 = (pass.x_location_start ?? 0) * SB_X;
              const y1 = (pass.y_location_start ?? 0) * SB_Y;
              const x2 = (pass.x_location_end   ?? pass.x_location_start ?? 0) * SB_X;
              const y2 = (pass.y_location_end   ?? pass.y_location_start ?? 0) * SB_Y;
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={getColor(pass.outcome)} strokeWidth="0.5" opacity="0.45" />
              );
            })}

            {/* ── Start dots ── */}
            {displayPasses.map((pass, i) => (
              <circle
                key={i}
                cx={(pass.x_location_start ?? 0) * SB_X}
                cy={(pass.y_location_start ?? 0) * SB_Y}
                r="0.8"
                fill={getColor(pass.outcome)}
                opacity="0.75"
              />
            ))}
          </svg>

          {/* Overlays */}
          {filteredPasses.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-400 text-sm bg-black/60 px-4 py-2 rounded-lg">
                No pass data for this selection
              </span>
            </div>
          )}
          {filteredPasses.length > 500 && (
            <div className="absolute bottom-2 left-3 text-[10px] text-gray-400 bg-black/60 px-2 py-1 rounded-lg">
              Showing 500 of {filteredPasses.length} passes
            </div>
          )}
        </div>

        {/* ── Legend + compact stats ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            {[
              { color: '#00D9FF', label: 'Complete' },
              { color: '#F87171', label: 'Incomplete' },
              { color: '#FBB040', label: 'Assist' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-5 h-px rounded" style={{ backgroundColor: color, borderTop: `2px solid ${color}` }} />
                <span className="text-gray-400 text-xs">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              { val: stats.complete,        label: 'Complete',   color: 'text-blue-400'   },
              { val: stats.incomplete,      label: 'Incomplete', color: 'text-red-400'    },
              { val: stats.assists,         label: 'Assists',    color: 'text-yellow-400' },
              { val: `${stats.accuracy}%`,  label: 'Accuracy',   color: 'text-green-400'  },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center min-w-[64px]">
                <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassMap;
