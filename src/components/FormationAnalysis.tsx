import { useState, useEffect, useRef } from 'react';
import { getWWCMatches, getWWCLineup } from '../services/wwcData';
import type { WWCMatch } from '../services/wwcData';
import { 
  Users, 
  Search, 
  Filter, 
  Shield, 
  Activity, 
  Zap, 
  ChevronRight, 
  AlertTriangle,
  GitMerge,
  ChevronDown,
  Layout,
  X,
  Target,
  TrendingUp,
  User,
  Wifi,
  WifiOff,
  ArrowLeft,
  Plus,
  Globe,
  Star,
  Download,
  Share2
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

type AnalysisMode = 'health' | 'transfer' | 'fit_to_player';
type ViewMode = 'discovery' | 'analysis';

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  health: number; // 0-100 Network Health
  x: number;
  y: number;
  team: string;
  isWeakLink?: boolean;
}

// Mock extended stats for the detail view
interface PlayerDetail extends Player {
    stats: { metric: string; value: number }[];
    influence_score: number;
    network_contribution: number;
    market_value: string;
}

// Populated from real WWC 2023 match data at runtime
const stripWomens = (name: string) => name.replace(/\s*Women's\s*$/i, '').trim();

export default function FormationAnalysis() {
  const [viewMode, setViewMode] = useState<ViewMode>('discovery');
  const [selectedTeam, setSelectedTeam] = useState('Spain');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('health');
  const [showLIM, setShowLIM] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ── WWC 2023 data ────────────────────────────────────────────────────────────
  const [TEAMS, setTEAMS] = useState<string[]>([]);
  const [allMatches, setAllMatches] = useState<WWCMatch[]>([]);
  const [formation, setFormation] = useState<Player[]>([]);
  const [lineupLoading, setLineupLoading] = useState(false);
  const matchesByTeam = useRef<Record<string, WWCMatch[]>>({});

  // Position-to-xy mapping for pitch layout
  const positionLayout: Record<string, { x: number; y: number; shortPos: string }> = {
    Goalkeeper:                   { x: 50, y: 90, shortPos: 'GK' },
    'Right Back':                 { x: 85, y: 75, shortPos: 'RB' },
    'Right Center Back':          { x: 65, y: 80, shortPos: 'CB' },
    'Center Back':                { x: 50, y: 80, shortPos: 'CB' },
    'Left Center Back':           { x: 35, y: 80, shortPos: 'CB' },
    'Left Back':                  { x: 15, y: 75, shortPos: 'LB' },
    'Right Wing Back':            { x: 85, y: 65, shortPos: 'WB' },
    'Left Wing Back':             { x: 15, y: 65, shortPos: 'WB' },
    'Right Defensive Midfield':   { x: 65, y: 60, shortPos: 'DM' },
    'Center Defensive Midfield':  { x: 50, y: 60, shortPos: 'CDM' },
    'Left Defensive Midfield':    { x: 35, y: 60, shortPos: 'DM' },
    'Right Center Midfield':      { x: 65, y: 45, shortPos: 'CM' },
    'Center Midfield':            { x: 50, y: 45, shortPos: 'CM' },
    'Left Center Midfield':       { x: 35, y: 45, shortPos: 'CM' },
    'Right Attacking Midfield':   { x: 65, y: 30, shortPos: 'AM' },
    'Center Attacking Midfield':  { x: 50, y: 30, shortPos: 'AM' },
    'Left Attacking Midfield':    { x: 35, y: 30, shortPos: 'AM' },
    'Right Wing':                 { x: 85, y: 25, shortPos: 'RW' },
    'Left Wing':                  { x: 15, y: 25, shortPos: 'LW' },
    'Right Center Forward':       { x: 65, y: 15, shortPos: 'CF' },
    'Center Forward':             { x: 50, y: 15, shortPos: 'ST' },
    'Left Center Forward':        { x: 35, y: 15, shortPos: 'CF' },
    'Secondary Striker':          { x: 50, y: 20, shortPos: 'SS' },
  };

  // Load all matches once on mount
  useEffect(() => {
    getWWCMatches().then(matches => {
      setAllMatches(matches);
      // Derive unique teams
      const teamSet = new Set<string>();
      const byTeam: Record<string, WWCMatch[]> = {};
      matches.forEach(m => {
        const home = stripWomens(m.home_team);
        const away = stripWomens(m.away_team);
        teamSet.add(home);
        teamSet.add(away);
        if (!byTeam[home]) byTeam[home] = [];
        if (!byTeam[away]) byTeam[away] = [];
        byTeam[home].push(m);
        byTeam[away].push(m);
      });
      matchesByTeam.current = byTeam;
      const sorted = Array.from(teamSet).sort();
      setTEAMS(sorted);
      // Default to Spain if available, else first team
      if (!sorted.includes('Spain') && sorted.length > 0) {
        setSelectedTeam(sorted[0]);
      }
    });
  }, []);

  // Fetch lineup whenever selectedTeam or allMatches change
  useEffect(() => {
    if (allMatches.length === 0) return;
    const teamMatches = matchesByTeam.current[selectedTeam] ?? [];
    const firstMatch = teamMatches[0];
    if (!firstMatch) return;

    setLineupLoading(true);
    getWWCLineup(firstMatch.match_id).then(lineup => {
      const starters = lineup
        .filter(p => stripWomens(p.team) === selectedTeam && p.is_starter)
        .slice(0, 11);

      const usedPositions: Record<string, number> = {};
      const mapped: Player[] = starters.map((p, idx) => {
        const posKey = p.position in positionLayout ? p.position : 'Center Midfield';
        // Offset duplicate positions slightly so tokens don't stack
        usedPositions[posKey] = (usedPositions[posKey] ?? 0) + 1;
        const offset = (usedPositions[posKey] - 1) * 10;
        const { x, y, shortPos } = positionLayout[posKey];
        // jersey_number used as rating proxy (clamped 1–99); health is a demo random 65–98
        const rating = Math.min(99, Math.max(1, p.jersey_number || idx + 1));
        const health = Math.floor(Math.random() * 34) + 65;
        const displayName = p.player_nickname || p.player_name.split(' ').slice(-1)[0];
        return {
          id: String(p.player_id),
          name: displayName,
          position: shortPos,
          rating,
          health,
          x: x + offset,
          y,
          team: selectedTeam,
          isWeakLink: health < 72,
        };
      });
      setFormation(mapped);
      setLineupLoading(false);
    });
  }, [selectedTeam, allMatches]);

  const [suggestedPlayers, setSuggestedPlayers] = useState([
    { id: 's1', name: 'Theo Hernandez', position: 'LB', rating: 86, fitScore: 94, team: 'AC Milan', cost: '€65M' },
    { id: 's2', name: 'A. Davies', position: 'LB', rating: 85, fitScore: 91, team: 'Bayern', cost: '€55M' },
    { id: 's3', name: 'N. Mendes', position: 'LB', rating: 83, fitScore: 88, team: 'PSG', cost: '€45M' },
  ]);

  const [suitableFormations, setSuitableFormations] = useState([
      { id: 'f1', name: '4-3-3 Attacking', fit: 95, reason: 'Maximizes box entries' },
      { id: 'f2', name: '3-4-2-1', fit: 88, reason: 'Provides defensive cover' },
      { id: 'f3', name: '4-2-3-1', fit: 82, reason: 'Limits creative freedom' },
  ]);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerDetail, setShowPlayerDetail] = useState(false);

  // Mock generating details when a player is selected
  const getPlayerDetail = (p: Player): PlayerDetail => {
     return {
         ...p,
         stats: [
             { metric: 'Influence', value: p.rating },
             { metric: 'Passing', value: p.health },
             { metric: 'Vision', value: p.rating - 5 },
             { metric: 'Mobility', value: p.rating + 2 },
             { metric: 'Defense', value: p.position.includes('B') || p.position === 'CDM' ? 85 : 40 },
             { metric: 'Flair', value: p.rating - 2 },
         ],
         influence_score: p.rating / 100,
         network_contribution: p.health / 100,
         market_value: '€' + (p.rating * 1.5).toFixed(0) + 'M'
     };
  };

  const selectedDetail = selectedPlayer ? getPlayerDetail(selectedPlayer) : null;

  // Stats
  const networkHealth = formation.length > 0
    ? Math.round(formation.reduce((acc, p) => acc + p.health, 0) / formation.length)
    : 0;
  const weakLinks = formation.filter(p => p.isWeakLink).length;

  const renderDiscovery = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex justify-between items-end">
              <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                      <GitMerge className="w-8 h-8 text-green-500" />
                      Formation Analysis
                  </h1>
                  <p className="text-zinc-400 mt-2">Analyze squad cohesion, identify weak links, and optimize structure.</p>
              </div>
              <button 
                  onClick={() => setViewMode('analysis')}
                  className="px-6 py-3 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 flex items-center gap-2"
              >
                  <Activity className="w-4 h-4" />
                  Active Analysis
              </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
              <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-zinc-500" />
                  <input 
                      type="text" 
                      placeholder="Search teams, historical squads, or formations..." 
                      className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-zinc-600"
                  />
              </div>
              <div className="h-8 w-px bg-white/10" />
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
              </button>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                  { title: 'Invincibles 03/04', type: 'Historical', author: 'Arsenal FC', downloads: '15k', rating: 5.0, image: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' },
                  { title: 'Treble Winners 23', type: 'Template', author: 'Man City', downloads: '12k', rating: 4.9, image: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)' },
                  { title: 'Galacticos Era', type: 'Historical', author: 'Real Madrid', downloads: '9k', rating: 4.8, image: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
              ].map((item, i) => (
                  <div 
                      key={i} 
                      onClick={() => setViewMode('analysis')}
                      className="group bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden hover:border-green-500/30 transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] cursor-pointer hover:-translate-y-1"
                  >
                      <div className="h-40 relative overflow-hidden">
                          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" style={{ background: item.image }} />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute top-4 left-4">
                              <span className="px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase text-white tracking-wider">
                                  {item.type}
                              </span>
                          </div>
                      </div>
                      <div className="p-6">
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors">{item.title}</h3>
                          <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                              <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                                  <Download className="w-3.5 h-3.5" /> {item.downloads}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold">
                                  <Star className="w-3.5 h-3.5 fill-yellow-500" /> {item.rating}
                              </span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          {/* My Squads */}
          <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Your Squads
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                      onClick={() => setViewMode('analysis')}
                      className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] cursor-pointer group flex items-center gap-4 transition-all"
                  >
                      <div className="w-12 h-12 rounded-xl bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-400 font-bold">
                          ARS
                      </div>
                      <div>
                          <div className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">Arsenal Current</div>
                          <div className="text-xs text-zinc-500">Last analyzed: 2h ago</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white ml-auto" />
                  </div>
                  
                  <div 
                      onClick={() => setViewMode('analysis')}
                      className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] cursor-pointer group flex items-center gap-4 transition-all"
                  >
                      <div className="w-12 h-12 rounded-xl bg-sky-900/20 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
                          MCI
                      </div>
                      <div>
                          <div className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">Man City Test</div>
                          <div className="text-xs text-zinc-500">Last analyzed: 1d ago</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white ml-auto" />
                  </div>
              </div>
          </div>
      </div>
  );

  const renderAnalysis = () => (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in zoom-in-95 duration-300 relative">
      <button 
          onClick={() => setViewMode('discovery')}
          className="absolute top-[-50px] left-0 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
      >
          <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>

      {/* Sidebar Controls */}
      <div className="w-[400px] flex flex-col bg-[#111111]/80 backdrop-blur-3xl rounded-[32px] border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-30">
        <div className="p-8 border-b border-white/5 relative overflow-hidden">
           {/* Background sheen */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />
           
           <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/10 to-blue-500/10 flex items-center justify-center border border-white/5 shadow-inner">
                 <GitMerge className="w-7 h-7 text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-blue-400" style={{ fill: 'currentColor' }} />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">Formation Analysis</h2>
                 <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Connectivity Engine v2.0</p>
              </div>
           </div>

           {/* Team Selector - Refined */}
           <div className="relative mb-8 group z-50">
                <div 
                    onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                    className="bg-black/30 p-1 rounded-2xl border border-white/5 cursor-pointer hover:border-pink-500/30 transition-all duration-300"
                >
                    <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Analysis Target</div>
                                <span className="text-base font-bold text-white">{selectedTeam}</span>
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 ${isTeamDropdownOpen ? 'rotate-180 bg-white/10' : ''}`}>
                             <ChevronDown className="w-4 h-4 text-zinc-400" />
                        </div>
                    </div>
                </div>
                
                {isTeamDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] p-1.5 space-y-1 overflow-y-auto max-h-64 animate-in fade-in zoom-in-95 duration-200">
                        {TEAMS.map(team => (
                            <div 
                                key={team}
                                onClick={() => {
                                    setSelectedTeam(team);
                                    setIsTeamDropdownOpen(false);
                                }}
                                className={`px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${
                                    selectedTeam === team ? 'bg-pink-600 text-white shadow-lg' : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                                }`}
                            >
                                <Shield className="w-4 h-4 opacity-70" />
                                <span className="text-sm font-bold">{team}</span>
                            </div>
                        ))}
                    </div>
                )}
           </div>

           {/* Stats Overview Pill */}
           <div className="flex gap-2">
                <div className="flex-1 bg-gradient-to-br from-zinc-900 to-black p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Wifi className="w-3 h-3 text-zinc-500" />
                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cohesion</div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className={`text-3xl font-bold tracking-tighter ${networkHealth > 85 ? 'text-white' : 'text-yellow-400'}`}>
                                {networkHealth}
                            </span>
                            <span className="text-xs text-zinc-500 mb-1.5">/ 100</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-zinc-900 to-black p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <WifiOff className="w-3 h-3 text-zinc-500" />
                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Fractures</div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className={`text-3xl font-bold tracking-tighter ${weakLinks > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                                {weakLinks}
                            </span>
                            <span className="text-xs text-zinc-500 mb-1.5">Detected</span>
                        </div>
                    </div>
                </div>
           </div>
        </div>

        {/* Dynamic Panel Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-black/20 custom-scrollbar space-y-6">
           
           {/* Mode Selection Tabs - Refined */}
           <div className="bg-[#0a0a0a] p-1 rounded-xl border border-white/5 flex mb-6">
              {[
                  { id: 'health', label: 'DNA' },
                  { id: 'transfer', label: 'Scout' },
                  { id: 'fit_to_player', label: 'Fit' }
              ].map((m) => (
                 <button
                    key={m.id}
                    onClick={() => setAnalysisMode(m.id as AnalysisMode)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                       analysisMode === m.id 
                          ? 'bg-white text-black shadow-md scale-[1.02]' 
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                 >
                    {m.label}
                 </button>
              ))}
           </div>

           {analysisMode === 'transfer' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center gap-3 mb-2 p-4 bg-[#1a1a1a] border border-white/5 rounded-2xl focus-within:border-pink-500/50 transition-colors shadow-inner">
                    <Search className="w-4 h-4 text-zinc-500" />
                    <input 
                       placeholder="Search replacement..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-600 font-medium"
                    />
                 </div>
                 
                 <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                       <Zap className="w-3 h-3 text-pink-500" />
                       High Synergy Targets
                    </h3>
                    {suggestedPlayers.map(p => (
                       <div key={p.id} className="p-4 bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 rounded-2xl hover:border-pink-500/30 hover:from-pink-500/5 cursor-pointer group transition-all duration-300">
                          <div className="flex justify-between items-start mb-3">
                             <div>
                                <div className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">{p.name}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">{p.team} • {p.position}</div>
                             </div>
                             <div className="text-right">
                                <div className="text-sm font-black text-green-400">{p.fitScore}%</div>
                                <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Compatibility</div>
                             </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                             <div className="text-xs font-mono text-zinc-400">{p.cost}</div>
                             <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-pink-600 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all border border-white/5 hover:border-pink-500">
                                Simulate
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}
           
           {analysisMode === 'fit_to_player' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div 
                        className="p-5 bg-gradient-to-br from-pink-900/20 to-blue-900/10 border border-pink-500/20 rounded-2xl cursor-pointer hover:border-pink-500/40 transition-all group relative overflow-hidden" 
                        onClick={() => selectedPlayer && setShowPlayerDetail(true)}
                    >
                       <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="relative z-10 flex items-center gap-4">
                           {selectedPlayer ? (
                               <>
                                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-blue-600 flex items-center justify-center text-sm font-black text-white shadow-lg">
                                        {selectedPlayer.position}
                                   </div>
                                   <div className="flex-1">
                                       <div className="text-xs font-bold text-pink-400 mb-0.5 uppercase tracking-wider">Analyzing</div>
                                       <div className="text-lg font-bold text-white">{selectedPlayer.name}</div>
                                   </div>
                                   <ChevronRight className="w-5 h-5 text-pink-400 group-hover:translate-x-1 transition-transform" />
                               </>
                           ) : (
                               <>
                                   <div className="w-12 h-12 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-lg font-black text-zinc-600">?</div>
                                   <div className="flex-1">
                                       <div className="text-sm font-bold text-white">Select Player</div>
                                       <div className="text-xs text-zinc-500">Tap pitch node</div>
                                   </div>
                               </>
                           )}
                       </div>
                   </div>

                   <div className="space-y-3">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                           <Layout className="w-3 h-3 text-blue-400" />
                           Optimal Configurations
                        </h3>
                        {suitableFormations.map(f => (
                           <div key={f.id} className="p-4 bg-[#1a1a1a] border border-white/5 rounded-2xl hover:bg-[#222] cursor-pointer group transition-all">
                              <div className="flex justify-between items-center mb-2">
                                 <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{f.name}</div>
                                 <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400">{f.fit}% Fit</div>
                              </div>
                              <p className="text-xs text-zinc-500 leading-relaxed">{f.reason}</p>
                           </div>
                        ))}
                   </div>
               </div>
           )}

           {analysisMode === 'health' && (
             <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Squad DNA</h3>
               {formation.map(p => (
                 <div key={p.id} className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer group ${
                    p.isWeakLink 
                        ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                 }`} onClick={() => {
                     setSelectedPlayer(p);
                     setShowPlayerDetail(true);
                 }}>
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-colors ${
                         p.isWeakLink 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : 'bg-zinc-900/50 text-zinc-400 border-white/5 group-hover:border-white/20 group-hover:text-white'
                      }`}>
                         {p.position}
                      </div>
                      <div>
                         <div className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">{p.name}</div>
                         <div className={`text-[10px] font-medium flex items-center gap-1.5 ${p.isWeakLink ? 'text-red-400' : 'text-zinc-500'}`}>
                            {p.isWeakLink ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    Low Synergy
                                </>
                            ) : (
                                <>
                                    <span className={`w-1.5 h-1.5 rounded-full ${p.health > 90 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    LIM Score: {p.health}
                                </>
                            )}
                         </div>
                      </div>
                   </div>
                   {p.isWeakLink ? (
                       <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                   ) : (
                       <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
                   )}
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* Main Pitch Visualization */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080808] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
        {/* Pitch Controls */}
        <div className="absolute top-8 right-8 z-20 flex gap-3">
           <button 
              onClick={() => setShowLIM(!showLIM)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border backdrop-blur-md transition-all ${
                 showLIM 
                    ? 'bg-pink-600/90 text-white border-pink-500/50 shadow-[0_0_20px_rgba(244,114,182,0.3)]' 
                    : 'bg-black/40 text-zinc-400 border-white/10 hover:text-white hover:bg-black/60'
              }`}
           >
              <Activity className="w-3.5 h-3.5" />
              Toggle Connectivity
           </button>
        </div>

        {/* Pitch Render */}
        <div className="flex-1 relative overflow-hidden group perspective-1000 bg-[#050505]">
           {/* Loading overlay */}
           {lineupLoading && (
             <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 backdrop-blur-sm">
               <div className="text-white text-sm font-bold animate-pulse uppercase tracking-widest">Loading Lineup...</div>
             </div>
           )}
           {/* Cyber Grid Pattern - Replaces Grass */}
           <div className="absolute inset-0 opacity-30" 
             style={{ 
               backgroundImage: `
                 linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
               `,
               backgroundSize: '40px 40px',
               transform: 'perspective(1000px) rotateX(25deg) scale(1.2) translateY(-50px)'
             }} 
           />
           {/* Pitch Markings Glow */}
           <div className="absolute inset-0 pointer-events-none" 
                style={{ 
                    background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
                    transform: 'perspective(1000px) rotateX(25deg) scale(1.2) translateY(-50px)'
                }} 
           />

           {/* LIM Connections (SVG Overlay) */}
           {showLIM && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen" style={{ transform: 'perspective(1000px) rotateX(25deg) scale(1.2) translateY(-50px)' }}>
                 {/* Generate dynamic connections based on distance/role */}
                 {formation.map((p1, i) => (
                    formation.slice(i + 1).map((p2, j) => {
                       const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                       // Only connect reasonably close players to avoid clutter
                       if (dist < 40) { 
                          const isWeakConnection = p1.isWeakLink || p2.isWeakLink;
                          return (
                             <line 
                                key={`${p1.id}-${p2.id}`}
                                x1={`${p1.x}%`} y1={`${p1.y}%`}
                                x2={`${p2.x}%`} y2={`${p2.y}%`}
                                stroke={isWeakConnection ? '#ef4444' : '#8b5cf6'}
                                strokeWidth={isWeakConnection ? 1.5 : 1}
                                strokeOpacity={isWeakConnection ? 0.6 : 0.3}
                                strokeDasharray={isWeakConnection ? "4,4" : "0"}
                                className={isWeakConnection ? "animate-pulse" : ""}
                             />
                          );
                       }
                       return null;
                    })
                 ))}
              </svg>
           )}

           {/* Players */}
           {formation.map((p) => (
              <div
                 key={p.id}
                 className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group/player z-10 transition-all duration-500"
                 style={{ 
                    left: `${p.x}%`, 
                    top: `${p.y}%`,
                    transform: `translate(-50%, -50%) perspective(1000px) rotateX(25deg) scale(1.2) translateY(-50px)` 
                 }}
                 onClick={() => {
                    setSelectedPlayer(p);
                    if (p.isWeakLink) setAnalysisMode('transfer');
                    else setAnalysisMode('fit_to_player');
                 }}
              >
                 {/* Player Node Visuals */}
                 <div className="relative">
                     {/* Pulse Effect for Weak Links */}
                     {p.isWeakLink && (
                         <div className="absolute inset-0 -m-4 bg-red-500/20 rounded-full animate-ping" />
                     )}
                     
                     <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300 relative overflow-hidden backdrop-blur-sm ${
                        p.isWeakLink 
                           ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                           : 'bg-[#111]/80 border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover/player:border-white group-hover/player:bg-[#222] group-hover/player:scale-110'
                     }`}>
                        <span className="text-sm font-bold text-white relative z-10">{p.rating}</span>
                        
                        {/* Health Indicator Ring */}
                        {!p.isWeakLink && (
                           <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                              <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                              <circle 
                                 cx="28" cy="28" r="26" fill="none" 
                                 stroke={p.health > 90 ? '#4ade80' : '#eab308'} 
                                 strokeWidth="2" 
                                 strokeDasharray={`${(p.health / 100) * 163} 163`}
                                 className="transition-all duration-1000 ease-out"
                              />
                           </svg>
                        )}
                     </div>

                     {/* Label */}
                     <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 flex flex-col items-center">
                        <div className={`px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg border flex flex-col items-center shadow-xl transition-all ${
                            p.isWeakLink ? 'border-red-500/30' : 'border-white/10 group-hover/player:border-white/30'
                        }`}>
                           <span className="text-[10px] font-bold text-white whitespace-nowrap tracking-wide">
                              {p.name}
                           </span>
                           <span className="text-[8px] text-zinc-500 font-mono uppercase">
                                {p.position}
                           </span>
                        </div>
                        {p.isWeakLink && (
                           <span className="mt-1.5 text-[9px] font-bold text-red-100 bg-red-600 px-2 py-0.5 rounded-md uppercase tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-bounce">
                              Low Synergy
                           </span>
                        )}
                     </div>
                 </div>
              </div>
           ))}
        </div>

        {/* Player Detail Overlay */}
        {showPlayerDetail && selectedDetail && (
            <div className="absolute right-0 top-0 bottom-0 w-[450px] bg-[#09090b]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-40 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                <button 
                    onClick={() => setShowPlayerDetail(false)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6 mb-8 mt-4">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <User className="w-10 h-10 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{selectedDetail.position}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{selectedDetail.team}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{selectedDetail.name}</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                        <span className="text-xs text-green-400 font-medium">Match Fit</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors group">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Influence</span>
                            </div>
                            <div className="text-3xl font-bold text-white tracking-tight">{selectedDetail.influence_score.toFixed(2)}</div>
                        </div>
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors group">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Synergy</span>
                            </div>
                            <div className="text-3xl font-bold text-white tracking-tight">{selectedDetail.network_contribution.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-20 bg-pink-500/5 blur-[60px] rounded-full pointer-events-none" />
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            Performance DNA
                        </h3>
                        <div className="h-[250px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedDetail.stats}>
                                    <PolarGrid stroke="#3f3f46" strokeOpacity={0.3} />
                                    <PolarAngleAxis dataKey="metric" stroke="#71717a" tick={{ fontSize: 10, fontWeight: 600, fill: '#71717a' }} />
                                    <PolarRadiusAxis stroke="#3f3f46" angle={30} domain={[0, 100]} tick={false} />
                                    <Radar name="Player" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Market Info */}
                    <div className="p-6 bg-gradient-to-br from-green-900/10 to-transparent border border-green-500/10 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated Value</span>
                                <div className="flex items-center gap-1 text-green-400 text-[10px] font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                    <TrendingUp className="w-3 h-3" /> +4.2%
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-white mb-6 tracking-tight">{selectedDetail.market_value}</div>
                            <button className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]">
                                Initiate Transfer Protocol
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );

  return (
    <div>
        {viewMode === 'discovery' ? renderDiscovery() : renderAnalysis()}
    </div>
  );
}