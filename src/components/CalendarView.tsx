import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Shield } from 'lucide-react';
import { getWWCMatches } from '../services/wwcData';
import type { WWCMatch } from '../services/wwcData';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STAGES = ['All', 'Group Stage', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'] as const;
type StageFilter = typeof STAGES[number];

const MONTHS = [
  { label: 'July 2023',   year: 2023, month: 7 },
  { label: 'August 2023', year: 2023, month: 8 },
];

const STAGE_COLORS: Record<string, string> = {
  'Group Stage':    'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Round of 16':    'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'Quarter-finals': 'bg-green-500/15 text-green-300 border-green-500/30',
  'Semi-finals':    'bg-pink-500/15 text-pink-300 border-pink-500/30',
  '3rd Place Final':'bg-pink-500/15 text-pink-300 border-pink-500/30',
  'Final':          'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const BADGE_DOT: Record<string, string> = {
  'Group Stage':    'bg-sky-400',
  'Round of 16':    'bg-teal-400',
  'Quarter-finals': 'bg-green-400',
  'Semi-finals':    'bg-pink-400',
  '3rd Place Final':'bg-pink-400',
  'Final':          'bg-amber-400',
};

function stripWomens(name: string): string {
  return name.replace(/\s*Women['']s\s*/i, '').trim();
}

/** Number of days in a given month (1-indexed). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Day-of-week index (0=Sun) for the 1st of the month. */
function firstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/** "YYYY-MM-DD" for a given year/month/day. */
function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className ?? ''}`} />;
}

// ── Match Badge (on calendar cell) ────────────────────────────────────────────

function MatchBadge({
  match,
  isSelected,
  onClick,
}: {
  match: WWCMatch;
  isSelected: boolean;
  onClick: () => void;
}) {
  const home = stripWomens(match.home_team);
  const away = stripWomens(match.away_team);
  const scored = match.home_score != null && match.away_score != null;
  const dotColor = BADGE_DOT[match.competition_stage] ?? 'bg-zinc-400';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-1.5 py-1 rounded-md text-[10px] leading-tight transition-all border ${
        isSelected
          ? 'bg-[#00C2A8]/20 border-[#00C2A8]/50 text-white'
          : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/15'
      }`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="truncate font-semibold">{home}</span>
      </div>
      <div className="flex items-center justify-between pl-2.5">
        <span className="truncate text-zinc-400">{away}</span>
        {scored && (
          <span className="text-[#00C2A8] font-bold ml-1 flex-shrink-0">
            {match.home_score}–{match.away_score}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

function DetailPanel({ match, onClose }: { match: WWCMatch; onClose: () => void }) {
  const home = stripWomens(match.home_team);
  const away = stripWomens(match.away_team);
  const scored = match.home_score != null && match.away_score != null;
  const stageColor = STAGE_COLORS[match.competition_stage] ?? 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
  const dateObj = new Date(match.match_date + 'T00:00:00');
  const dateLabel = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
        <div>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageColor} mb-3`}>
            {match.competition_stage}
          </span>
          <div className="text-sm text-zinc-400">{dateLabel} · {match.kick_off?.slice(0, 5)}</div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors text-lg leading-none mt-1"
        >
          ✕
        </button>
      </div>

      {/* Score block */}
      <div className="px-6 py-8 flex flex-col items-center gap-4 border-b border-white/5">
        <div className="flex items-center gap-6 w-full">
          <div className="flex-1 text-right">
            <div className="text-xl font-bold text-white">{home}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">Home</div>
          </div>
          <div className="px-5 py-3 bg-black rounded-xl border border-white/10 font-mono font-black text-2xl text-white min-w-[90px] text-center shadow-inner">
            {scored ? `${match.home_score}–${match.away_score}` : 'vs'}
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-white">{away}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">Away</div>
          </div>
        </div>
        {scored && (
          <span className="px-3 py-1 bg-[#00C2A8]/10 border border-[#00C2A8]/20 text-[#00C2A8] text-xs font-bold rounded-full">
            Full Time
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="px-6 py-5 space-y-3">
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <MapPin className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <span>{match.stadium}{match.stadium_country ? `, ${match.stadium_country}` : ''}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <Shield className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <span>{match.competition_stage}</span>
        </div>
        {match.home_group && (
          <div className="text-sm text-zinc-400">
            Group {match.home_group}
          </div>
        )}
      </div>

      {/* Full team names footnote */}
      <div className="mt-auto px-6 pb-5 text-[10px] text-zinc-600 leading-relaxed border-t border-white/5 pt-4">
        <div>{match.home_team} vs {match.away_team}</div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CalendarView() {
  const [matches, setMatches] = useState<WWCMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthIdx, setMonthIdx] = useState(0);
  const [stageFilter, setStageFilter] = useState<StageFilter>('All');
  const [selectedMatch, setSelectedMatch] = useState<WWCMatch | null>(null);

  useEffect(() => {
    getWWCMatches().then(data => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const { year, month, label } = MONTHS[monthIdx];

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const matchMonth = parseInt(m.match_date.slice(5, 7), 10);
      const matchYear  = parseInt(m.match_date.slice(0, 4), 10);
      if (matchYear !== year || matchMonth !== month) return false;
      if (stageFilter !== 'All' && m.competition_stage !== stageFilter) return false;
      return true;
    });
  }, [matches, year, month, stageFilter]);

  /** Map from "YYYY-MM-DD" → WWCMatch[] */
  const matchesByDate = useMemo(() => {
    const map: Record<string, WWCMatch[]> = {};
    for (const m of filteredMatches) {
      if (!map[m.match_date]) map[m.match_date] = [];
      map[m.match_date].push(m);
    }
    return map;
  }, [filteredMatches]);

  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfWeek(year, month);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">

      {/* Left: Calendar */}
      <div className="flex flex-col min-w-0 flex-1 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-xl">

        {/* Month nav */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00C2A8]/10 rounded-lg text-[#00C2A8]">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-white">{label}</span>
            <span className="text-xs text-zinc-500 ml-1">WWC 2023</span>
          </div>
          <div className="flex gap-1">
            <button
              disabled={monthIdx === 0}
              onClick={() => { setMonthIdx(0); setSelectedMatch(null); }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={monthIdx === MONTHS.length - 1}
              onClick={() => { setMonthIdx(1); setSelectedMatch(null); }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stage filter pills */}
        <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-white/5 flex-shrink-0">
          {STAGES.map(s => (
            <button
              key={s}
              onClick={() => { setStageFilter(s); setSelectedMatch(null); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                stageFilter === s
                  ? 'bg-[#00C2A8] text-black border-[#00C2A8] shadow-lg shadow-[#00C2A8]/25'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 px-4 pt-3 pb-1 flex-shrink-0">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-wider py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Empty offset cells */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                const dateStr = toDateStr(year, month, day);
                const dayMatches = matchesByDate[dateStr] ?? [];
                const hasMatch = dayMatches.length > 0;
                const isToday = false; // tournament is historical

                return (
                  <div
                    key={day}
                    className={`min-h-[80px] rounded-xl p-1.5 border transition-colors ${
                      hasMatch
                        ? 'border-white/10 bg-white/[0.03]'
                        : 'border-transparent'
                    } ${isToday ? 'ring-1 ring-[#00C2A8]/50' : ''}`}
                  >
                    <div className={`text-[11px] font-semibold mb-1 px-0.5 ${hasMatch ? 'text-white' : 'text-zinc-600'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayMatches.map(m => (
                        <MatchBadge
                          key={m.match_id}
                          match={m}
                          isSelected={selectedMatch?.match_id === m.match_id}
                          onClick={() => setSelectedMatch(
                            selectedMatch?.match_id === m.match_id ? null : m
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center gap-4 text-xs text-zinc-500 flex-shrink-0">
          <span>{filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''} shown</span>
          <span>·</span>
          <span>{matches.length} total in tournament</span>
        </div>
      </div>

      {/* Right: Detail panel */}
      {selectedMatch ? (
        <div className="w-80 flex-shrink-0">
          <DetailPanel match={selectedMatch} onClose={() => setSelectedMatch(null)} />
        </div>
      ) : (
        <div className="w-80 flex-shrink-0 flex items-center justify-center bg-black/20 rounded-3xl border border-white/5 border-dashed">
          <div className="text-center text-zinc-600 px-6">
            <CalendarIcon className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Click a match badge<br />to see details</p>
          </div>
        </div>
      )}
    </div>
  );
}
