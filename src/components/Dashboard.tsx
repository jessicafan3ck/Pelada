import { useState, useEffect } from 'react';
import {
  ArrowRight, Star, Sparkles, Cpu, Box, BarChart2,
  Target, Layout, Download, Activity, Zap, Users2,
  Play, Globe,
} from 'lucide-react';

interface DashboardProps {
  onOpenAgent: () => void;
  onNavigate: (view: string) => void;
}

// ── WWC 2027 data ─────────────────────────────────────────────────────────────

const WWC_START = new Date('2027-07-24T00:00:00');

const FEATURED_MATCHES = [
  { id: 1, home: 'Brazil',    away: 'Colombia', group: 'Group A', date: 'Jul 24', homeColor: '#22c55e', awayColor: '#f59e0b' },
  { id: 2, home: 'Spain',     away: 'Japan',    group: 'Group B', date: 'Jul 26', homeColor: '#ef4444', awayColor: '#3b82f6' },
  { id: 3, home: 'England',   away: 'Germany',  group: 'Group C', date: 'Jul 27', homeColor: '#f9fafb', awayColor: '#1d4ed8' },
  { id: 4, home: 'Argentina', away: 'USA',      group: 'Group D', date: 'Jul 28', homeColor: '#60a5fa', awayColor: '#f87171' },
];

const PERSONAS = [
  {
    id: 'widgets',
    label: 'Watch & Share',
    role: 'Fan',
    desc: 'Browse match widgets, build your GOAT XI, and share to TikTok or anywhere.',
    grad: 'from-pink-900/20 to-purple-900/10',
    border: 'border-pink-500/20 hover:border-pink-500/40',
    shadow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.12)]',
    accent: 'text-pink-400',
    iconBg: 'bg-pink-500/10',
    icon: Box,
    cta: 'Explore Widgets',
  },
  {
    id: 'widgets',
    label: 'Build & Publish',
    role: 'Creator',
    desc: 'Generate custom analytics widgets with AI and publish them to the community.',
    grad: 'from-indigo-900/20 to-blue-900/10',
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    shadow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]',
    accent: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10',
    icon: Sparkles,
    cta: 'Open Widget Builder',
  },
  {
    id: 'models',
    label: 'Model & Predict',
    role: 'Analyst',
    desc: 'Design ML models with AI, run Python locally via the Pelada Agent, simulate matches with MCMC.',
    grad: 'from-cyan-900/20 to-teal-900/10',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    shadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]',
    accent: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10',
    icon: Cpu,
    cta: 'Open Model Sandbox',
  },
];

const RANKINGS = [
  { rank: 1, name: 'Bonmati_AI',     score: 3140, role: 'Analyst' },
  { rank: 2, name: 'tactician_88',   score: 2980, role: 'Creator' },
  { rank: 3, name: 'Pelada_Labs',    score: 2840, role: 'Developer' },
  { rank: 4, name: 'xG_Prophet',     score: 2790, role: 'Analyst' },
  { rank: 5, name: 'jessica_fan',    score: 2740, role: 'Builder' },
  { rank: 6, name: 'DataViz_Pro',    score: 2680, role: 'Creator' },
  { rank: 7, name: 'ScoutMaster',    score: 2610, role: 'Scout' },
  { rank: 8, name: 'Simeone_Fan',    score: 2550, role: 'Tactician' },
];

const ARTIFACTS = [
  { id: 1, type: 'widget',    title: 'xG Momentum Flow',              author: 'DataViz_Pro',   downloads: '8.2k', rating: 4.9, tags: ['Visualization', 'xG'],    grad: 'from-[#1e1b4b] to-[#312e81]', icon: Box,      nav: 'widgets' },
  { id: 2, type: 'model',     title: 'Collapse Predictor v2',         author: 'Pelada_Labs',   downloads: '5.1k', rating: 4.8, tags: ['ML', 'Defense'],           grad: 'from-[#4a044e] to-[#701a75]', icon: Cpu,      nav: 'models' },
  { id: 3, type: 'tactics',   title: 'Inverted Wingback Overload',    author: 'tactician_88',  downloads: '12k',  rating: 4.7, tags: ['Pressing', 'Width'],        grad: 'from-[#0f172a] to-[#1e3a5f]', icon: Target,   nav: 'tactics' },
  { id: 4, type: 'widget',    title: 'GOAT XI Builder — WWC Edition', author: 'jessica_fan',   downloads: '19k',  rating: 5.0, tags: ['Fan', 'Interactive'],       grad: 'from-[#3b0764] to-[#6b21a8]', icon: Users2,   nav: 'widgets' },
  { id: 5, type: 'model',     title: 'Flair Index — WWC 2027',        author: 'xG_Prophet',    downloads: '3.4k', rating: 4.6, tags: ['Creativity', 'Player'],     grad: 'from-[#064e3b] to-[#065f46]', icon: Activity, nav: 'models' },
  { id: 6, type: 'formation', title: '3-4-3 Barcelona Replica',       author: 'Bonmati_AI',    downloads: '9.8k', rating: 4.8, tags: ['Positional', 'Press'],      grad: 'from-[#7c2d12] to-[#9a3412]', icon: Layout,   nav: 'formation' },
];

// ── Countdown ─────────────────────────────────────────────────────────────────

function useCountdown() {
  const [days, setDays] = useState(0);
  useEffect(() => {
    const update = () => {
      const diff = WWC_START.getTime() - Date.now();
      setDays(Math.max(0, Math.floor(diff / 86_400_000)));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  return days;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard({ onOpenAgent, onNavigate }: DashboardProps) {
  const [activeType, setActiveType] = useState<string>('all');
  const days = useCountdown();

  const filtered = activeType === 'all' ? ARTIFACTS : ARTIFACTS.filter(a => a.type === activeType);
  const types = ['all', 'widget', 'model', 'tactics', 'formation'];

  return (
    <div className="space-y-10 pb-10">

      {/* ── WWC 2027 Hero ─────────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] overflow-hidden border border-white/5 shadow-2xl min-h-[320px] flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050a14] via-[#0a1628] to-[#050a14]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
          <rect x="50" y="10"  width="700" height="300" stroke="white" strokeWidth="1" fill="none" rx="2" />
          <line x1="50" y1="160" x2="750" y2="160" stroke="white" strokeWidth="1" />
          <circle cx="400" cy="160" r="60" stroke="white" strokeWidth="1" fill="none" />
          <rect x="175" y="10"  width="150" height="65" stroke="white" strokeWidth="1" fill="none" />
          <rect x="475" y="10"  width="150" height="65" stroke="white" strokeWidth="1" fill="none" />
          <rect x="175" y="245" width="150" height="65" stroke="white" strokeWidth="1" fill="none" />
          <rect x="475" y="245" width="150" height="65" stroke="white" strokeWidth="1" fill="none" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-0 flex-1">
          {/* Left — branding */}
          <div className="flex-1 p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 border border-white/10 px-3 py-1 rounded-full">
                  Women's World Cup 2027 · Brazil
                </span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-2">
                Vai Ser<br />
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Épico.
                </span>
              </h1>
              <p className="text-zinc-400 text-sm mt-4 max-w-sm leading-relaxed">
                AI-powered football analytics built for the biggest women's tournament in history.
                Every match. Every model. Every moment.
              </p>
            </div>
            <div className="flex items-center gap-6 mt-8">
              <div className="text-center">
                <div className="text-4xl font-black text-white tabular-nums">{days}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Days Away</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="text-4xl font-black text-white">32</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Teams</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="text-4xl font-black text-white">64</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Matches</div>
              </div>
            </div>
          </div>

          {/* Right — featured matches */}
          <div className="lg:w-[420px] p-6 flex flex-col justify-center gap-3 border-l border-white/5">
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-1 flex items-center gap-2">
              <Globe className="w-3 h-3" /> Group Stage Preview
            </div>
            {FEATURED_MATCHES.map(m => (
              <div
                key={m.id}
                onClick={() => onNavigate('simulation')}
                className="group flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl px-5 py-3.5 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.homeColor }} />
                  <span className="text-sm font-bold text-white truncate">{m.home}</span>
                </div>
                <div className="flex flex-col items-center shrink-0 px-3">
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{m.group}</span>
                  <span className="text-[9px] text-zinc-700">{m.date}</span>
                </div>
                <div className="flex items-center gap-3 min-w-0 justify-end">
                  <span className="text-sm font-bold text-white truncate">{m.away}</span>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.awayColor }} />
                </div>
                <Play className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 ml-3 shrink-0 transition-colors" />
              </div>
            ))}
            <button
              onClick={() => onNavigate('simulation')}
              className="mt-1 w-full py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" /> Run MCMC Simulation
            </button>
          </div>
        </div>
      </div>

      {/* ── Three Personas ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PERSONAS.map((p, i) => (
          <div
            key={i}
            onClick={() => onNavigate(p.id)}
            className={`group bg-gradient-to-br ${p.grad} border ${p.border} ${p.shadow} rounded-3xl p-7 cursor-pointer transition-all hover:-translate-y-1 flex flex-col gap-5`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 ${p.iconBg} rounded-2xl`}>
                <p.icon className={`w-6 h-6 ${p.accent}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${p.accent} opacity-60`}>{p.role}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2 group-hover:opacity-90">{p.label}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{p.desc}</p>
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold ${p.accent} group-hover:gap-3 transition-all`}>
              {p.cta} <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Community + Rankings ──────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* Artifacts grid */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Community Work
            </h2>
            <div className="flex gap-1.5 bg-black/40 border border-white/10 p-1 rounded-xl">
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeType === t ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => onNavigate(item.nav)}
                className="group bg-[#09090b] border border-white/5 rounded-[22px] overflow-hidden hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)] hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="h-36 relative overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${item.grad.replace('from-', '').replace('to-', '').split(' ').join(', ')})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[9px] font-bold text-white/70 border border-white/10">
                    <item.icon className="w-3 h-3 text-purple-400" /> {item.type}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-purple-400 transition-colors line-clamp-1">{item.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-zinc-600">@{item.author}</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-zinc-600 flex items-center gap-1"><Download className="w-3 h-3" />{item.downloads}</span>
                      <span className="text-yellow-500 flex items-center gap-1 font-bold"><Star className="w-3 h-3 fill-yellow-500" />{item.rating}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/5 text-zinc-600 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rankings sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-yellow-400" /> Global Rankings
              </h2>
              <span className="text-[10px] text-purple-400 cursor-pointer hover:text-white transition-colors">WWC 2027 Season</span>
            </div>
            <div className="space-y-2">
              {RANKINGS.map(u => (
                <div key={u.rank} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/5 hover:border-purple-500/20 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border ${
                    u.rank === 1 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                    u.rank === 2 ? 'text-zinc-300 border-zinc-500/30 bg-zinc-500/10' :
                    u.rank === 3 ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
                    'text-zinc-600 border-white/5 bg-white/5'
                  }`}>{u.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">@{u.name}</div>
                    <div className="text-[9px] text-zinc-600">{u.role}</div>
                  </div>
                  <div className="text-xs font-mono text-zinc-500">{u.score.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Co-Pilot CTA ─────────────────────────────────────────────────── */}
      <div
        onClick={onOpenAgent}
        className="group bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-[24px] border border-white/10 hover:border-white/20 p-1 flex items-center justify-between cursor-pointer transition-all"
      >
        <div className="flex items-center gap-5 px-6 py-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Can't find what you need?</h3>
            <p className="text-xs text-zinc-500">Ask Pelada Co-Pilot to generate a custom model, tactic, or widget.</p>
          </div>
        </div>
        <button className="mr-5 px-5 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2 whitespace-nowrap">
          Open Co-Pilot <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
