import React, { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Swords } from 'lucide-react';
import { DataContext, MatchMeta } from '../context/DataContext';
import { useAppContext } from '../context/AppContext';

const STAGE_ORDER = ['Round of 16', 'Quarter-finals', 'Semi-finals', '3rd Place Final', 'Final'];

const DROPDOWN_BG = '#0d0d14';

export default function MatchContextBar() {
  const { matchMeta } = useContext(DataContext);
  const { activeMatchId, setActiveMatchId, activeTeam, setActiveTeam } = useAppContext();
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Position dropdown under the button
  const openDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }
    setOpen(o => !o);
  };

  // Close on outside click (handles both button and portal dropdown)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedButton = buttonRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedButton && !clickedDropdown) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 8, left: rect.left });
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  const activeMatch = useMemo(
    () => matchMeta.find(m => m.match_id === activeMatchId) ?? null,
    [matchMeta, activeMatchId]
  );

  const grouped = useMemo(() => {
    const g: Record<string, MatchMeta[]> = {};
    for (const m of matchMeta) {
      if (!g[m.stage]) g[m.stage] = [];
      g[m.stage].push(m);
    }
    return g;
  }, [matchMeta]);

  const teams = useMemo(() =>
    activeMatch ? [activeMatch.home_team, activeMatch.away_team] : [],
    [activeMatch]
  );

  if (matchMeta.length === 0) return null;

  const stageShort = (s: string) => {
    if (s === 'Round of 16') return 'R16';
    if (s === 'Quarter-finals') return 'QF';
    if (s === 'Semi-finals') return 'SF';
    if (s === '3rd Place Final') return '3rd';
    return 'Final';
  };

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        zIndex: 9999,
        backgroundColor: DROPDOWN_BG,
        width: '288px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
      }}
    >
      {STAGE_ORDER.filter(s => grouped[s]).map(stage => (
        <div key={stage}>
          <div style={{ backgroundColor: DROPDOWN_BG, padding: '12px 16px 4px', fontSize: '10px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {stage}
          </div>
          {grouped[stage].map(m => (
            <button
              key={m.match_id}
              onClick={() => { setActiveMatchId(m.match_id); setActiveTeam(null); setOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: activeMatchId === m.match_id ? 'rgba(56,189,248,0.18)' : DROPDOWN_BG,
                color: activeMatchId === m.match_id ? '#bae6fd' : '#d4d4d8',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { if (activeMatchId !== m.match_id) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (activeMatchId !== m.match_id) (e.currentTarget as HTMLElement).style.backgroundColor = DROPDOWN_BG; }}
            >
              <span>{m.home_team} <span style={{ color: '#52525b', fontSize: '12px' }}>vs</span> {m.away_team}</span>
              <span style={{ fontSize: '12px', color: '#52525b', marginLeft: '12px', flexShrink: 0 }}>{m.home_score}–{m.away_score}</span>
            </button>
          ))}
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* Match selector */}
      <div className="relative shrink-0">
        <button
          ref={buttonRef}
          onClick={openDropdown}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-sky-500/40 rounded-xl text-sm text-white transition-all max-w-[300px]"
        >
          <Swords className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          {activeMatch ? (
            <span className="truncate font-medium">
              {activeMatch.home_team} <span className="text-zinc-500 text-xs">vs</span> {activeMatch.away_team}
            </span>
          ) : (
            <span className="text-zinc-500">Select match…</span>
          )}
          {activeMatch && (
            <span className="text-[10px] text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded-md shrink-0 font-semibold">
              {stageShort(activeMatch.stage)}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {dropdown}

      {/* Team filter chips */}
      {activeMatch && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTeam(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              activeTeam === null
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-transparent border-white/8 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Both
          </button>
          {teams.map(team => (
            <button
              key={team}
              onClick={() => setActiveTeam(activeTeam === team ? null : team)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border max-w-[100px] truncate ${
                activeTeam === team
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-200'
                  : 'bg-transparent border-white/8 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {team}
            </button>
          ))}
        </div>
      )}

      {/* Score */}
      {activeMatch && (
        <div className="flex items-center gap-1.5 text-sm ml-1 shrink-0">
          <span className="font-bold text-white">{activeMatch.home_score}</span>
          <span className="text-zinc-600">–</span>
          <span className="font-bold text-white">{activeMatch.away_score}</span>
          <span className="text-zinc-700 text-[10px] ml-1 hidden sm:block">{activeMatch.date}</span>
        </div>
      )}
    </div>
  );
}
