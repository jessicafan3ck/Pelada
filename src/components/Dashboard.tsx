import { useState, useEffect } from 'react';
import {
  ArrowRight, Star, Sparkles, Cpu, Box, BarChart2,
  Target, Layout, Download, Activity, Shield,
  TrendingUp, Calendar,
} from 'lucide-react';

interface DashboardProps {
  onOpenAgent: () => void;
  onNavigate: (view: string) => void;
}

// date-only string → parsed as UTC midnight, avoiding timezone off-by-one
const WWC_START = new Date('2027-07-24');

const RANKINGS = [
  { rank: 1,  name: 'Bonmati_AI',    score: 3140, role: 'Analyst'   },
  { rank: 2,  name: 'tactician_88',  score: 2980, role: 'Creator'   },
  { rank: 3,  name: 'Pelada_Labs',   score: 2840, role: 'Developer' },
  { rank: 4,  name: 'xG_Prophet',    score: 2790, role: 'Analyst'   },
  { rank: 5,  name: 'jessica_fan',   score: 2740, role: 'Builder'   },
  { rank: 6,  name: 'DataViz_Pro',   score: 2680, role: 'Creator'   },
  { rank: 7,  name: 'ScoutMaster',   score: 2610, role: 'Scout'     },
  { rank: 8,  name: 'Simeone_Fan',   score: 2550, role: 'Tactician' },
  { rank: 9,  name: 'Analyst_Mike',  score: 2450, role: 'Analyst'   },
  { rank: 10, name: 'City_Watcher',  score: 2410, role: 'Observer'  },
];

const ARTIFACTS = [
  {
    id: 1, type: 'widget',    title: 'xG Momentum Flow',              author: 'DataViz_Pro',  downloads: '8.2k',  rating: 4.9, tags: ['Visualization', 'xG'],
    image: 'linear-gradient(135deg, #0d1832 0%, #2B3F9E 100%)',    icon: Box,      nav: 'widgets',
  },
  {
    id: 2, type: 'model',     title: 'Collapse Predictor v2',         author: 'Pelada_Labs',  downloads: '5.1k',  rating: 4.8, tags: ['ML', 'Defense'],
    image: 'linear-gradient(135deg, #2a0020 0%, #C2298A 100%)',    icon: Cpu,      nav: 'models',
  },
  {
    id: 3, type: 'tactics',   title: 'Inverted Wingback Overload',    author: 'tactician_88', downloads: '12k',   rating: 4.7, tags: ['Pressing', 'Width'],
    image: 'linear-gradient(135deg, #2a0808 0%, #E53935 100%)',    icon: Target,   nav: 'tactics',
  },
  {
    id: 4, type: 'widget',    title: 'GOAT XI Builder — WWC Edition', author: 'jessica_fan',  downloads: '19k',   rating: 5.0, tags: ['Fan', 'Interactive'],
    image: 'linear-gradient(135deg, #1a2000 0%, #C9D426 100%)',    icon: Star,     nav: 'widgets',
  },
  {
    id: 5, type: 'model',     title: 'Flair Index — WWC 2027',        author: 'xG_Prophet',   downloads: '3.4k',  rating: 4.6, tags: ['Creativity', 'Player'],
    image: 'linear-gradient(135deg, #082008 0%, #4CAF50 100%)',    icon: Activity, nav: 'models',
  },
  {
    id: 6, type: 'formation', title: '3-4-3 Barcelona Replica',       author: 'Bonmati_AI',   downloads: '9.8k',  rating: 4.8, tags: ['Positional', 'Press'],
    image: 'linear-gradient(135deg, #2a1000 0%, #F04A36 100%)',    icon: Layout,   nav: 'formation',
  },
];

type Category = 'all' | 'widget' | 'model' | 'tactics' | 'formation';

const CATEGORIES: { id: Category; label: string; icon: typeof Box }[] = [
  { id: 'all',       label: 'All',        icon: Sparkles },
  { id: 'widget',    label: 'Widgets',    icon: Box      },
  { id: 'model',     label: 'Models',     icon: Cpu      },
  { id: 'tactics',   label: 'Tactics',    icon: Target   },
  { id: 'formation', label: 'Formations', icon: Layout   },
];

function useCountdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, WWC_START.getTime() - Date.now());
      setT({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
    };
    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

const OTHER_MATCHES = [
  { home: 'Spain',     away: 'Japan',    group: 'Group B', date: 'Jul 26', homeColor: '#ef4444', awayColor: '#3b82f6' },
  { home: 'England',   away: 'Germany',  group: 'Group C', date: 'Jul 27', homeColor: '#f9fafb', awayColor: '#1d4ed8' },
  { home: 'Argentina', away: 'USA',      group: 'Group D', date: 'Jul 28', homeColor: '#60a5fa', awayColor: '#f87171' },
];

export default function Dashboard({ onOpenAgent, onNavigate }: DashboardProps) {
  const { days, hours, minutes, seconds } = useCountdown();
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filtered = activeCategory === 'all'
    ? ARTIFACTS
    : ARTIFACTS.filter(a => a.type === activeCategory);

  return (
    <div className="space-y-10 pb-10">

      {/* ── WWC 2027 Hero ────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: '180px' }}>
        {/* Teal base */}
        <div className="absolute inset-0" style={{ background: '#00C2A8' }} />
        {/* Hot pink diagonal block */}
        <div
          className="absolute right-0 top-0 bottom-0"
          style={{ width: '48%', background: '#E8197D', clipPath: 'polygon(28% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
        />
        {/* Chevron pattern overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.07 }} aria-hidden="true">
          <defs>
            <pattern id="wwc-chevrons" x="0" y="0" width="80" height="56" patternUnits="userSpaceOnUse">
              <polyline points="0,0 40,28 80,0"  stroke="black" strokeWidth="7" fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <polyline points="0,28 40,56 80,28" stroke="black" strokeWidth="7" fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wwc-chevrons)" />
        </svg>

        <div className="relative z-10 flex items-center justify-between px-10 py-9">
          {/* Left: wordmark */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.28em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: '10px' }}>
              FIFA Women's World Cup · Brasil 2027
            </div>
            <div style={{ fontSize: '68px', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: '0.85' }}>
              GO<br />EPIC.
            </div>
          </div>

          {/* Right: live countdown clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
            {([
              { n: String(days),                          l: 'Days'    },
              { n: String(hours).padStart(2, '0'),        l: 'Hours'   },
              { n: String(minutes).padStart(2, '0'),      l: 'Min'     },
              { n: String(seconds).padStart(2, '0'),      l: 'Sec'     },
            ] as const).map(({ n, l }, i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {i > 0 && (
                  <div style={{ fontSize: '36px', fontWeight: 900, color: 'rgba(0,0,0,0.3)', lineHeight: 1, marginBottom: '16px' }}>:</div>
                )}
                <div style={{ textAlign: 'center', minWidth: l === 'Days' ? '72px' : '56px' }}>
                  <div style={{ fontSize: l === 'Days' ? '48px' : '42px', fontWeight: 900, color: '#000', fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFeatureSettings: '"tnum"' }}>{n}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '6px' }}>{l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">

        {/* Match Center — 8 col */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-black/40 backdrop-blur-2xl rounded-[32px] border border-white/5 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative flex flex-col min-h-[420px]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5 flex justify-between items-center relative z-10 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">WWC 2027 · Group Stage</h2>
                <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Opening round · Jul 24 – Aug 12
                </p>
              </div>
              <button
                onClick={() => onNavigate('simulation')}
                className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-cyan-500/20 transition-colors"
              >
                Run Simulation
              </button>
            </div>

            {/* Featured match face-off */}
            <div
              onClick={() => onNavigate('simulation')}
              className="relative z-10 mx-6 my-5 bg-gradient-to-r from-zinc-900/50 to-black/50 rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer group overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
              <div className="p-8 flex items-center justify-between">

                {/* Home — Brazil */}
                <div className="flex flex-col items-center gap-4 w-1/3">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #14532d, #065f46)', boxShadow: '0 0 30px rgba(34,197,94,0.25)' }}
                  >
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white">Brazil</h3>
                    <span className="text-xs text-zinc-500 font-mono tracking-wider">HOME</span>
                  </div>
                </div>

                {/* Centre info */}
                <div className="flex flex-col items-center gap-3 w-1/3">
                  <div className="text-xs font-bold text-zinc-400 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
                    Group A · Jul 24
                  </div>
                  <span className="text-[10px] text-zinc-600 text-center">Estádio Nacional · Brasília</span>
                  <div className="flex gap-3 mt-1">
                    <button
                      onClick={e => { e.stopPropagation(); onNavigate('simulation'); }}
                      className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                      Simulate
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onNavigate('lineup'); }}
                      className="px-4 py-2 bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                    >
                      Lineup
                    </button>
                  </div>
                </div>

                {/* Away — Colombia */}
                <div className="flex flex-col items-center gap-4 w-1/3">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #78350f, #92400e)', boxShadow: '0 0 30px rgba(245,158,11,0.25)' }}
                  >
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white">Colombia</h3>
                    <span className="text-xs text-zinc-500 font-mono tracking-wider">AWAY</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Other matches */}
            <div className="px-6 pb-6 grid grid-cols-3 gap-3 relative z-10 shrink-0">
              {OTHER_MATCHES.map((m, i) => (
                <div
                  key={i}
                  onClick={() => onNavigate('simulation')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.06] cursor-pointer transition-all"
                >
                  <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{m.group} · {m.date}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.homeColor }} />
                    <span className="text-[11px] font-bold text-white">{m.home}</span>
                    <span className="text-[10px] text-zinc-600">vs</span>
                    <span className="text-[11px] font-bold text-white">{m.away}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.awayColor }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — 4 col */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-black/40 backdrop-blur-2xl rounded-[32px] border border-white/5 p-8 h-full flex flex-col shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="text-xs font-bold text-zinc-500 mb-5 uppercase tracking-[0.15em] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-600" /> Community Pulse
            </div>
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-1.5 bg-purple-500/10 rounded-lg"><TrendingUp className="w-3.5 h-3.5 text-purple-400" /></div>
                  <span className="text-xs font-bold text-white">Most Downloaded</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  "GOAT XI Builder — WWC Edition" trending with 19k+ downloads.
                </p>
              </div>
              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-1.5 bg-cyan-500/10 rounded-lg"><Activity className="w-3.5 h-3.5 text-cyan-400" /></div>
                  <span className="text-xs font-bold text-white">New Model</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  @Bonmati_AI published Flair Index v2 with WWC 2027 squad data.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-yellow-500/60" /> Global Rankings
              </span>
              <span className="text-[10px] text-purple-400 cursor-pointer hover:text-white transition-colors">WWC 2027</span>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {RANKINGS.map(u => (
                <div key={u.rank} className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-white/5 hover:border-purple-500/30 rounded-xl px-3 py-2 flex items-center justify-between group transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border ${
                      u.rank === 1 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                      : u.rank === 2 ? 'text-zinc-300 border-zinc-500/30 bg-zinc-500/10'
                      : u.rank === 3 ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                      : 'text-zinc-600 border-white/5 bg-white/5'
                    }`}>{u.rank}</div>
                    <div>
                      <div className="text-[11px] font-bold text-white group-hover:text-purple-400 transition-colors">@{u.name}</div>
                      <div className="text-[9px] text-zinc-600">{u.role}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">{u.score.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Discover Community Work ──────────────────────────────────────────── */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Discover Community Work
            </h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-2xl">
              Explore community-created tactics, models, widgets, and formations. Clone, adapt, and improve.
            </p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-xl flex gap-1 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-white text-black shadow-lg'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => onNavigate(item.nav)}
              className="group bg-[#09090b] border border-white/5 rounded-[24px] overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 cursor-pointer"
            >
              <div className="h-48 w-full relative overflow-hidden">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" style={{ background: item.image }} />
                {/* Chevron pattern overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.1 }} aria-hidden="true">
                  <defs>
                    <pattern id={`chv-${item.id}`} x="0" y="0" width="50" height="35" patternUnits="userSpaceOnUse">
                      <polyline points="0,0 25,17 50,0"  stroke="white" strokeWidth="3.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                      <polyline points="0,17 25,35 50,17" stroke="white" strokeWidth="3.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#chv-${item.id})`} />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-90" />
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 flex items-center gap-2">
                  <item.icon className="w-3 h-3 text-purple-400" />
                  {item.type}
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                  <button className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6 pt-2">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors leading-snug">{item.title}</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mb-5 font-medium border-b border-white/5 pb-4">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold">
                      {item.author[0].toUpperCase()}
                    </div>
                    {item.author}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> {item.downloads}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/5 text-zinc-400 font-semibold rounded-md group-hover:border-white/10 group-hover:text-zinc-300 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold shrink-0 ml-2">
                    <Star className="w-3.5 h-3.5 fill-yellow-500" />
                    {item.rating}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Co-Pilot CTA */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-[24px] border border-white/10 p-1 flex items-center justify-between backdrop-blur-sm group hover:border-white/20 transition-all">
          <div className="flex items-center gap-6 px-6 py-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Can't find what you need?</h3>
              <p className="text-sm text-zinc-400">Ask Pelada to generate a custom tactic, model, or widget for you.</p>
            </div>
          </div>
          <button
            onClick={onOpenAgent}
            className="mr-6 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            Open Co-Pilot <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
