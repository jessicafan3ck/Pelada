import { useState } from 'react';
import { 
  Play, 
  Save, 
  RotateCcw, 
  Zap, 
  Mic, 
  Keyboard, 
  MousePointer2, 
  Target,
  Share2,
  Trophy,
  History,
  Globe,
  Lock,
  Activity,
  ChevronDown,
  Shield,
  Calendar,
  Users,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  Star,
  Download,
  Layout
} from 'lucide-react';

export default function TacticsView() {
  const [view, setView] = useState<'discovery' | 'editor'>('discovery');
  const [mode, setMode] = useState<'design' | 'play' | 'describe'>('design');
  const [matchMode, setMatchMode] = useState<'upcoming' | 'custom'>('upcoming');
  const [isRecording, setIsRecording] = useState(false);
  const [tacticalDescription, setTacticalDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  
  // Benchmark management
  const [benchmarks, setBenchmarks] = useState([
    { id: 'space', name: 'Space Control', score: 92, max: 100, color: 'green' },
    { id: 'pass', name: 'Pass Options', score: 78, max: 100, color: 'yellow' },
    { id: 'risk', name: 'Counter-Press Risk', score: 85, max: 100, color: 'red', isInverse: true },
  ]);

  const [availableBenchmarks] = useState([
    { id: 'intensity', name: 'Pressing Intensity', color: 'blue' },
    { id: 'width', name: 'Effective Width', color: 'pink' },
    { id: 'xg', name: 'xG Potential', color: 'green' }
  ]);
  
  const [showAddBenchmark, setShowAddBenchmark] = useState(false);

  const addBenchmark = (b: any) => {
    setBenchmarks([...benchmarks, { ...b, score: Math.floor(Math.random() * 30) + 60, max: 100 }]); // Mock score
    setShowAddBenchmark(false);
  };
  
  const [homeTeam, setHomeTeam] = useState('Man City');
  const [awayTeam, setAwayTeam] = useState('Liverpool');

  const teams = ['Man City', 'Liverpool', 'Arsenal', 'Real Madrid', 'Bayern', 'Inter Miami'];

  const upcomingMatches = [
    { id: 1, home: 'Man City', away: 'Bayern', date: 'Today, 20:00', competition: 'UCL' },
    { id: 2, home: 'Liverpool', away: 'Chelsea', date: 'Sat, 17:30', competition: 'PL' },
    { id: 3, home: 'Real Madrid', away: 'Barcelona', date: 'Sun, 20:00', competition: 'La Liga' },
  ];
  
  const players = [
    { id: 1, name: 'GK', x: 50, y: 90, role: 'GK', color: 'bg-yellow-500 shadow-[0_0_15px_#eab308]' },
    { id: 2, name: 'LB', x: 15, y: 75, role: 'WB', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 3, name: 'CB', x: 35, y: 80, role: 'CD', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 4, name: 'CB', x: 65, y: 80, role: 'CD', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 5, name: 'RB', x: 85, y: 75, role: 'WB', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 6, name: 'DM', x: 50, y: 60, role: 'DLP', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 8, name: 'CM', x: 35, y: 45, role: 'B2B', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 10, name: 'AM', x: 65, y: 45, role: 'AP', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 7, name: 'LW', x: 15, y: 25, role: 'IW', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 9, name: 'ST', x: 50, y: 15, role: 'AF', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
    { id: 11, name: 'RW', x: 85, y: 25, role: 'W', color: 'bg-blue-600 shadow-[0_0_15px_#2563eb]' },
  ];

  // --- Discovery Data ---
  const communityTactics = [
    {
      id: 1,
      title: 'Inverted Wingback Overload',
      author: 'PepG_Official',
      downloads: '12.4k',
      rating: 4.9,
      tags: ['Positional', 'High Press'],
      image: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    },
    {
      id: 2,
      title: 'Low Block Counter v2',
      author: 'Simeone_Fan',
      downloads: '9.8k',
      rating: 4.5,
      tags: ['Defense', 'Counter'],
      image: 'linear-gradient(135deg, #3f3f46 0%, #52525b 100%)'
    },
    {
      id: 3,
      title: 'Gegenpress 4-3-3',
      author: 'Kloppite',
      downloads: '8.2k',
      rating: 4.7,
      tags: ['Intensity', 'Attacking'],
      image: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
    }
  ];

  const myTactics = [
    {
      id: 101,
      title: 'My Custom 4-2-3-1',
      lastEdited: '2 hours ago',
      status: 'Private',
      image: 'linear-gradient(135deg, #172554 0%, #1e3a8a 100%)'
    },
    {
      id: 102,
      title: 'Anti-Barca Setup',
      lastEdited: '3 days ago',
      status: 'Public',
      image: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)'
    }
  ];

  if (view === 'discovery') {
      return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="flex justify-between items-end">
                  <div>
                      <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                          <Target className="w-8 h-8 text-pink-500" />
                          Tactics Studio
                      </h1>
                      <p className="text-zinc-400 mt-2">Design, simulate, and share next-gen tactical systems.</p>
                  </div>
                  <button 
                      onClick={() => setView('editor')}
                      className="px-6 py-3 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 flex items-center gap-2"
                  >
                      <Plus className="w-4 h-4" />
                      Create New Tactic
                  </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
                  <div className="flex-1 flex items-center gap-3 px-4">
                      <Search className="w-5 h-5 text-zinc-500" />
                      <input 
                          type="text" 
                          placeholder="Search tactics, formations, or authors..." 
                          className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-zinc-600"
                      />
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                  </button>
              </div>

              {/* My Projects */}
              <div>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      Your Projects
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* New Project Card */}
                      <button 
                          onClick={() => setView('editor')}
                          className="group h-48 rounded-2xl border border-dashed border-white/20 hover:border-pink-500/50 hover:bg-pink-500/5 flex flex-col items-center justify-center gap-4 transition-all"
                      >
                          <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-pink-500/20 flex items-center justify-center transition-colors">
                              <Plus className="w-6 h-6 text-zinc-500 group-hover:text-pink-400" />
                          </div>
                          <span className="text-sm font-bold text-zinc-500 group-hover:text-pink-400 uppercase tracking-wider">Start Blank Canvas</span>
                      </button>

                      {myTactics.map(tactic => (
                          <div 
                              key={tactic.id}
                              onClick={() => setView('editor')}
                              className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl"
                          >
                              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" style={{ background: tactic.image }} />
                              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                              
                              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                                  <div className="flex justify-between items-start">
                                      <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                          tactic.status === 'Public' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20'
                                      }`}>
                                          {tactic.status}
                                      </div>
                                  </div>
                                  <div>
                                      <h3 className="text-lg font-bold text-white mb-1">{tactic.title}</h3>
                                      <div className="text-xs text-zinc-400 flex items-center gap-1">
                                          <History className="w-3 h-3" /> Edited {tactic.lastEdited}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Community Inspiration */}
              <div>
                  <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-pink-400" />
                          Community Inspiration
                      </h2>
                      <button className="text-xs text-pink-400 hover:text-white font-bold uppercase tracking-wider">View All</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {communityTactics.map(tactic => (
                          <div 
                              key={tactic.id} 
                              onClick={() => setView('editor')}
                              className="group bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all hover:shadow-lg cursor-pointer"
                          >
                              <div className="h-32 w-full relative overflow-hidden">
                                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: tactic.image }} />
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                                  <div className="absolute bottom-3 left-4">
                                      <div className="flex gap-2 mb-2">
                                          {tactic.tags.map(tag => (
                                              <span key={tag} className="text-[9px] font-bold px-2 py-0.5 bg-white/10 backdrop-blur-md rounded border border-white/10 text-white">
                                                  {tag}
                                              </span>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                              <div className="p-5">
                                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">{tactic.title}</h3>
                                  <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                                      <span className="flex items-center gap-1">
                                          <Users className="w-3 h-3" /> {tactic.author}
                                      </span>
                                      <div className="flex items-center gap-3">
                                          <span className="flex items-center gap-1 text-zinc-400">
                                              <Download className="w-3 h-3" /> {tactic.downloads}
                                          </span>
                                          <span className="flex items-center gap-1 text-yellow-500 font-bold">
                                              <Star className="w-3 h-3 fill-yellow-500" /> {tactic.rating}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // --- Editor View ---
  return (
    <div className="h-[calc(100vh-140px)] flex gap-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Back Button (Only visual enhancement for Editor Mode) */}
      <div className="absolute top-[-60px] left-0">
          <button 
              onClick={() => setView('discovery')}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
          >
              <ArrowLeft className="w-4 h-4" /> Back to Studio
          </button>
      </div>

      {/* Main Pitch Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden relative shadow-2xl group">
        {/* Mode Selector Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02] backdrop-blur-sm z-20 relative">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button
              onClick={() => setMode('design')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === 'design' 
                  ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <MousePointer2 className="w-4 h-4" />
              Design
            </button>
            <button
              onClick={() => setMode('play')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === 'play' 
                  ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(244,114,182,0.5)] border border-pink-500/50' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Play
            </button>
            <button
              onClick={() => setMode('describe')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === 'describe' 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-500/50' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="w-4 h-4" />
              AI Studio
            </button>
          </div>

          <div className="flex items-center gap-4">
             {/* Matchup Selector */}
             <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 px-3">
                {/* Match Mode Toggle */}
                <div className="flex bg-white/5 rounded-lg p-1 mr-2">
                   <button 
                     onClick={() => setMatchMode('upcoming')}
                     className={`p-1.5 rounded-md transition-colors ${matchMode === 'upcoming' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                     title="Upcoming Matches"
                   >
                      <Calendar className="w-3.5 h-3.5" />
                   </button>
                   <button 
                     onClick={() => setMatchMode('custom')}
                     className={`p-1.5 rounded-md transition-colors ${matchMode === 'custom' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                     title="Custom Matchup"
                   >
                      <Users className="w-3.5 h-3.5" />
                   </button>
                </div>

                {matchMode === 'upcoming' ? (
                   <div className="flex items-center gap-2 group cursor-pointer relative min-w-[200px] justify-between px-2">
                      <div className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                         <span className="text-sm font-bold text-white truncate max-w-[140px]">
                           {upcomingMatches[0].home} vs {upcomingMatches[0].away}
                         </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                      
                      {/* Upcoming Matches Dropdown */}
                      <div className="absolute top-full left-0 mt-2 w-64 bg-[#18181b] border border-white/10 rounded-xl shadow-xl hidden group-hover:block z-50 p-2">
                         <div className="text-[10px] text-zinc-500 font-bold px-2 py-1 uppercase">Select Match</div>
                         {upcomingMatches.map(m => (
                           <div key={m.id} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer flex justify-between items-center group/item">
                              <div>
                                 <div className="text-sm font-bold text-white">{m.home} vs {m.away}</div>
                                 <div className="text-[10px] text-zinc-500">{m.date} • {m.competition}</div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                ) : (
                   <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 group cursor-pointer relative">
                         <Shield className="w-3.5 h-3.5 text-blue-400" />
                         <span className="text-sm font-bold text-white">{homeTeam}</span>
                         <ChevronDown className="w-3 h-3 text-zinc-500" />
                         {/* Mock Dropdown */}
                         <div className="absolute top-full left-0 mt-2 w-32 bg-[#18181b] border border-white/10 rounded-lg shadow-xl hidden group-hover:block z-50">
                            {teams.map(t => (
                              <div key={t} onClick={() => setHomeTeam(t)} className="px-3 py-2 hover:bg-white/5 text-xs cursor-pointer">{t}</div>
                            ))}
                         </div>
                      </div>
                      <span className="text-xs text-zinc-500 font-bold">VS</span>
                      <div className="flex items-center gap-2 group cursor-pointer relative">
                         <span className="text-sm font-bold text-white">{awayTeam}</span>
                         <Shield className="w-3.5 h-3.5 text-red-400" />
                         <ChevronDown className="w-3 h-3 text-zinc-500" />
                         {/* Mock Dropdown */}
                         <div className="absolute top-full right-0 mt-2 w-32 bg-[#18181b] border border-white/10 rounded-lg shadow-xl hidden group-hover:block z-50">
                            {teams.map(t => (
                              <div key={t} onClick={() => setAwayTeam(t)} className="px-3 py-2 hover:bg-white/5 text-xs cursor-pointer">{t}</div>
                            ))}
                         </div>
                      </div>
                   </div>
                )}
             </div>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
               <button 
                 onClick={() => setPrivacy('public')}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                   privacy === 'public' 
                     ? 'bg-white/10 text-white shadow' 
                     : 'text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 <Globe className="w-3 h-3" />
               </button>
               <button 
                 onClick={() => setPrivacy('private')}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                   privacy === 'private' 
                     ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                     : 'text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 <Lock className="w-3 h-3" />
               </button>
            </div>
          </div>
        </div>

        {/* Pitch Visual */}
        <div className="flex-1 relative bg-[#050505] overflow-hidden group">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 bg-gradient-to-b from-pink-900/10 to-blue-900/10 opacity-50" />
          
          {/* Pitch Grid Pattern */}
          <div className="absolute inset-0 opacity-20" 
               style={{ 
                 backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent)',
                 backgroundSize: '50px 50px',
                 transform: 'perspective(1000px) rotateX(10deg) scale(1.1)'
               }} 
          />
          
          {/* Center Circle & Lines with Glow */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: 'perspective(1000px) rotateX(10deg) scale(1.1)' }}
          >
            <div className="w-full h-px bg-white/20 absolute top-1/2 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            <div className="w-48 h-48 rounded-full border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
          </div>

          {/* Goal Areas */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 border-x border-b border-white/20 bg-white/[0.02]" 
            style={{ transform: 'perspective(1000px) rotateX(10deg)' }}
          />
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 border-x border-t border-white/20 bg-white/[0.02]" 
            style={{ transform: 'perspective(1000px) rotateX(10deg)' }}
          />

          {/* Player Tokens */}
          {players.map((p) => (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group/player z-10"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div className={`w-10 h-10 rounded-full ${p.color} border-2 border-white flex items-center justify-center transition-all group-hover/player:scale-110 relative`}>
                <span className="text-[10px] font-black text-white drop-shadow-md">{p.id}</span>
                {/* Ring Indicator */}
                <div className="absolute inset-0 rounded-full border border-white/50 scale-125 opacity-0 group-hover/player:opacity-100 transition-all duration-500 animate-ping" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover/player:opacity-100 transition-all pointer-events-none shadow-xl translate-y-2 group-hover/player:translate-y-0">
                {p.name} • {p.role}
              </div>
              
              {/* Movement Vector (Visual only) */}
              {mode === 'play' && (
                <div className="absolute top-1/2 left-1/2 w-1 h-16 bg-gradient-to-b from-white to-transparent origin-top -rotate-45 pointer-events-none opacity-50" />
              )}
            </div>
          ))}

          {/* WASD Overlay */}
          {mode === 'play' && (
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 items-center bg-black/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500">
              <div className="w-12 h-12 border border-white/20 rounded-xl flex items-center justify-center text-white font-mono text-lg bg-white/5 shadow-inner">W</div>
              <div className="flex gap-2">
                <div className="w-12 h-12 border border-white/20 rounded-xl flex items-center justify-center text-white font-mono text-lg bg-white/5 shadow-inner">A</div>
                <div className="w-12 h-12 border border-white/20 rounded-xl flex items-center justify-center text-white font-mono text-lg bg-white/5 shadow-inner">S</div>
                <div className="w-12 h-12 border border-white/20 rounded-xl flex items-center justify-center text-white font-mono text-lg bg-white/5 shadow-inner">D</div>
              </div>
              <span className="text-[10px] text-zinc-400 mt-2 uppercase tracking-[0.15em] font-bold">Player #10 Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-[400px] flex flex-col gap-8">
        {/* Contextual Panel */}
        <div className="flex-1 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 p-8 flex flex-col shadow-xl">
          {mode === 'describe' ? (
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-xl border border-pink-500/20">
                   <Zap className="w-5 h-5 text-pink-400" />
                </div>
                Tactical AI
              </h3>
              <div className="flex-1 relative mb-6 group">
                <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-blue-500/5 rounded-2xl pointer-events-none" />
                <textarea
                  value={tacticalDescription}
                  onChange={(e) => setTacticalDescription(e.target.value)}
                  placeholder={`Describe a tactical sequence for ${homeTeam} against ${awayTeam}...`}
                  className="w-full h-full bg-black/20 border border-white/10 rounded-2xl p-6 text-sm text-white resize-none focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all placeholder:text-zinc-600 leading-relaxed shadow-inner"
                />
                <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={`absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_#ef4444]' : 'bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 border border-white/10'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
              <button className="w-full py-4 bg-gradient-to-r from-pink-600 to-blue-600 rounded-2xl text-white font-bold uppercase tracking-wider text-xs hover:shadow-[0_0_30px_rgba(244,114,182,0.4)] transition-all transform active:scale-95 border border-white/10">
                Generate Tactic
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-white">Optimization Benchmarks</h3>
                 <button 
                   onClick={() => setShowAddBenchmark(!showAddBenchmark)}
                   className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                 >
                   {showAddBenchmark ? <ChevronDown className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                 </button>
               </div>
               
               {showAddBenchmark && (
                 <div className="mb-6 p-4 bg-black/40 border border-white/10 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Add Metric</div>
                    <div className="space-y-2">
                       {availableBenchmarks.filter(ab => !benchmarks.find(b => b.id === ab.id)).map(ab => (
                         <button
                           key={ab.id}
                           onClick={() => addBenchmark(ab)}
                           className="w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-zinc-300 hover:text-white transition-colors flex items-center justify-between group"
                         >
                           {ab.name}
                           <span className="opacity-0 group-hover:opacity-100 text-pink-400 text-xs font-bold">+ Add</span>
                         </button>
                       ))}
                       {availableBenchmarks.filter(ab => !benchmarks.find(b => b.id === ab.id)).length === 0 && (
                          <div className="text-xs text-zinc-600 italic px-2">No more metrics available</div>
                       )}
                    </div>
                 </div>
               )}
               
               <div className="space-y-4 mb-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                 {benchmarks.map((b) => (
                   <div key={b.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
                     {/* Glass effect background */}
                     <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     
                     <div className="relative z-10">
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-zinc-300 text-sm font-medium">{b.name}</span>
                         <span className={`font-bold text-lg font-mono ${
                            b.color === 'green' ? 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                            b.color === 'yellow' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' :
                            b.color === 'red' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                            b.color === 'blue' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                            'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]'
                         }`}>
                           {b.isInverse ? (b.score > 80 ? 'High' : b.score > 50 ? 'Med' : 'Low') : `${b.score}/${b.max}`}
                         </span>
                       </div>
                       <div className="h-1.5 bg-black/50 rounded-full overflow-hidden p-[1px] border border-white/5">
                         <div 
                           className={`h-full rounded-full shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out ${
                              b.color === 'green' ? 'bg-green-500 text-green-500' :
                              b.color === 'yellow' ? 'bg-yellow-400 text-yellow-400' :
                              b.color === 'red' ? 'bg-red-500 text-red-500' :
                              b.color === 'blue' ? 'bg-blue-500 text-blue-500' :
                              'bg-pink-500 text-pink-500'
                           }`} 
                           style={{ width: `${b.score}%` }}
                         />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="mt-auto space-y-4">
                 {/* Generate Summary Button */}
                 <button className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group">
                    <Zap className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
                    Generate Tactic Summary
                 </button>

                 {/* Better Leaderboard Card */}
                 <div className="bg-gradient-to-r from-pink-900/10 to-blue-900/10 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-pink-500/30 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Rank</div>
                          <div className="text-xl font-black text-white italic">#42 <span className="text-xs font-normal text-zinc-500 not-italic">Global</span></div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] text-zinc-500 mb-1">Top Tier</div>
                       <div className="text-xs font-bold text-pink-400">Possession</div>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* History / Versions */}
        <div className="h-56 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 overflow-y-auto custom-scrollbar shadow-xl">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 sticky top-0 bg-transparent backdrop-blur-md pb-2 z-10">
            <History className="w-3 h-3" />
            Version History
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5 group">
              <span className="text-sm text-white font-medium group-hover:text-pink-400 transition-colors">v2.4 - Width Adjustment</span>
              <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded-md">2m ago</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5 group">
              <span className="text-sm text-zinc-400 font-medium group-hover:text-white transition-colors">v2.3 - Base 4-3-3</span>
              <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded-md">15m ago</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5 group">
              <span className="text-sm text-zinc-400 font-medium group-hover:text-white transition-colors">v2.0 - Initial Draft</span>
              <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded-md">1h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}