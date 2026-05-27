import { useState, useEffect } from 'react';
import {
  Sparkles,
  Code,
  Eye,
  Share2,
  Download,
  Search,
  Globe,
  Lock,
  Plus,
  BarChart3,
  PieChart,
  Activity,
  Box,
  ArrowLeft,
  Filter,
  Star,
  Layout,
  LayoutGrid,
  TrendingUp,
  MoreHorizontal,
  Check,
} from 'lucide-react';
import ReactRunner, { stripFences, buildWidgetSrcdoc } from './ReactRunner';
import EffectHouseExporter from './EffectHouseExporter';

const WIDGETS_KEY = 'pelada-widgets';

interface SavedWidget {
  id: string;
  name: string;
  description: string;
  code: string;
  tags: string[];
  author: string;
  type: string;
  createdAt: string;
  likes: number;
  scope: 'public' | 'private';
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadWidgets(): SavedWidget[] {
  try { return JSON.parse(localStorage.getItem(WIDGETS_KEY) || '[]'); } catch { return []; }
}

function saveWidgets(widgets: SavedWidget[]) {
  localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgets));
}

type ViewMode = 'discovery' | 'builder';

const SEED_WIDGETS: SavedWidget[] = [
  {
    id: 'w1', name: 'Collapse Risk Timeline', author: '@jessica_fan', type: 'Chart',
    description: 'Visualizes network stability over time, highlighting potential structural failures.',
    tags: ['Stability', 'Timeline'], code: '', createdAt: '2026-05-01T00:00:00Z', likes: 2800, scope: 'public',
  },
  {
    id: 'w2', name: 'Living Space Heatmap', author: '@tactical_ai', type: 'Map',
    description: 'Dynamic heatmap showing effective playing space controlled by the team.',
    tags: ['Space', 'Heatmap'], code: '', createdAt: '2026-05-10T00:00:00Z', likes: 2100, scope: 'public',
  },
  {
    id: 'w3', name: 'Pass Network Graph', author: 'Pelada', type: 'Graph',
    description: 'Force-directed graph of player passing connections and volume.',
    tags: ['Passing', 'Network'], code: '', createdAt: '2026-05-15T00:00:00Z', likes: 3400, scope: 'public',
  },
  {
    id: 'w4', name: 'Team Internal KPI', author: 'Manchester City', type: 'KPI',
    description: 'Internal proprietary metrics dashboard for coaching staff.',
    tags: ['KPI', 'Internal'], code: '', createdAt: '2026-05-20T00:00:00Z', likes: 12, scope: 'private',
  },
];

const GEN_MESSAGES = [
  'Analyzing match data…',
  'Designing visualization…',
  'Working out the details…',
  'Building chart structure…',
  'Calibrating axes…',
  'Populating WC 2022 stats…',
  'Wiring up interactivity…',
];

function GeneratingPreview() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [bars, setBars] = useState(() =>
    Array.from({ length: 9 }, () => 18 + Math.random() * 65)
  );

  useEffect(() => {
    const msgT = setInterval(() => setMsgIdx((i: number) => (i + 1) % GEN_MESSAGES.length), 1800);
    const barT = setInterval(() => setBars(Array.from({ length: 9 }, () => 18 + Math.random() * 65)), 850);
    return () => { clearInterval(msgT); clearInterval(barT); };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden" style={{ minHeight: 320 }}>
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/40 border border-yellow-500/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/60" />
        </div>
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Live Preview</span>
        <div />
      </div>
      <div className="p-5 flex flex-col" style={{ minHeight: 276 }}>
        <div className="relative flex-1" style={{ minHeight: 220 }}>
          <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none">
            {[0, 1, 2, 3].map((i: number) => (
              <div key={i} className="w-full h-px bg-white/[0.05]" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-1.5 h-full px-1 pb-6">
            {bars.map((h: number, i: number) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  background: 'linear-gradient(to top, rgba(168,85,247,0.55), rgba(168,85,247,0.15))',
                  boxShadow: '0 0 10px rgba(168,85,247,0.25)',
                  transition: `height ${0.6 + i * 0.04}s cubic-bezier(0.34,1.56,0.64,1)`,
                }}
              />
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex gap-1.5 px-1 pb-0.5">
            {bars.map((_: number, i: number) => (
              <div key={i} className="flex-1 h-1.5 rounded bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04] mt-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i: number) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-purple-400/80"
                style={{ animation: `bounce 1.1s ease-in-out ${i * 0.18}s infinite` }}
              />
            ))}
          </div>
          <span
            key={msgIdx}
            className="text-xs text-zinc-500 font-mono"
            style={{ animation: 'fadeIn 0.4s ease' }}
          >
            {GEN_MESSAGES[msgIdx]}
          </span>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const WC2022_TEAMS = [
  'Argentina','France','Brazil','England','Netherlands','Portugal',
  'Morocco','Croatia','Spain','Japan','South Korea','USA',
  'Senegal','Australia','Switzerland','Poland',
];

function buildWidgetPrompt(userRequest: string): string {
  return `Generate a self-contained React widget for a football analytics dashboard.

STRICT CODE RULES:
- Define ONLY a function named Widget() — no imports, no exports
- React hooks available in scope: useState, useEffect, useMemo, useRef
- Recharts available: BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
- Use inline styles with dark theme (background #18181b, text #e4e4e7, muted #71717a, accent #a855f7)
- Use ResponsiveContainer width="100%" height={300} for all charts — never hardcode a pixel width
- Keep the widget under 80 lines to avoid truncation

DATA & INTERACTIVITY RULES:
- If the widget involves comparing teams, include a <select> dropdown for EACH team slot so the user can swap teams — default to real WC 2022 teams: ${WC2022_TEAMS.join(', ')}
- If it involves players, include a player selector or at minimum show the top 5 by the relevant metric
- All data must be hardcoded but realistic — use plausible WC 2022 stats (xG, shots, passes, possession %)
- Pair every stat with a selector or label so the user knows which team/player it represents
- Do NOT use emojis anywhere in the widget — no emoji in labels, tooltips, axis ticks, or text

User request: ${userRequest}`;
}

const TEMPLATES = [
  { icon: BarChart3, label: 'Match Stats',         sub: 'Possession, xG, Shots',    hint: 'Bar chart comparing possession, xG, and shots on target for both teams' },
  { icon: PieChart,  label: 'Player Distribution', sub: 'Passing zones, Heatmaps',  hint: 'Pie chart showing passing zone breakdown by player position' },
  { icon: Activity,  label: 'Performance Trend',   sub: 'Season-long analysis',     hint: 'Line chart showing season-long performance trend over match weeks' },
];

const AI_SUGGESTIONS = [
  { icon: Activity,  color: 'bg-blue-500/20 text-blue-400',    label: 'Live Match Metrics',    sub: 'Real-time possession, xG, pass completion',  hint: 'Real-time live match metrics dashboard showing possession percentage, xG, and pass completion rate' },
  { icon: BarChart3, color: 'bg-purple-500/20 text-purple-400', label: 'Historical Comparison', sub: 'Season vs Season, Player vs Player',          hint: 'Historical comparison chart showing season vs season or player vs player stat breakdown' },
];

const EMBED_BASE = 'https://pelada-plum.vercel.app';

function encodeWidget(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function DeployModal({ code, name, description, onClose }: {
  code: string;
  name: string;
  description: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<'url' | 'iframe' | null>(null);
  const [downloading, setDownloading] = useState(false);
  const embedUrl = `${EMBED_BASE}/?embed=${encodeWidget(code)}`;
  const iframeSnippet = `<iframe src="${embedUrl}" width="480" height="400" frameborder="0" style="border-radius:12px;overflow:hidden;"></iframe>`;

  const copy = (text: string, type: 'url' | 'iframe') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadHtml = async () => {
    setDownloading(true);
    const html = buildWidgetSrcdoc(code);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pelada-widget.html';
    a.click();
    URL.revokeObjectURL(a.href);
    setDownloading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0d0d0f] border border-white/10 rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl space-y-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Globe className="w-5 h-5 text-cyan-400" />
              Deploy Widget
            </h2>
            <p className="text-sm text-zinc-500 mt-1">The URL is the widget — no server required.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Embed URL */}
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Embed URL</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-cyan-400 truncate min-w-0">
              {embedUrl}
            </div>
            <button
              onClick={() => copy(embedUrl, 'url')}
              className="shrink-0 px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-600/30 transition-colors text-xs font-bold flex items-center gap-2"
            >
              {copied === 'url' ? <Check className="w-4 h-4" /> : 'Copy'}
            </button>
          </div>
        </div>

        {/* iframe snippet */}
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Embed Code (iframe)</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-blue-300 truncate min-w-0">
              {iframeSnippet}
            </div>
            <button
              onClick={() => copy(iframeSnippet, 'iframe')}
              className="shrink-0 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-600/30 transition-colors text-xs font-bold flex items-center gap-2"
            >
              {copied === 'iframe' ? <Check className="w-4 h-4" /> : 'Copy'}
            </button>
          </div>
        </div>

        {/* Deploy targets */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Website',     desc: 'Paste iframe anywhere',      color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', Icon: Box,      onClick: undefined },
            { label: 'Notion',      desc: '/Embed → paste URL',         color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',    Icon: Globe,    onClick: undefined },
            { label: 'TikTok Bio',  desc: 'Link-in-bio → URL',          color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20',    Icon: Share2,   onClick: undefined },
            { label: 'Download',    desc: 'Standalone HTML file',        color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  Icon: Download, onClick: downloadHtml },
          ].map(t => (
            <button
              key={t.label}
              onClick={t.onClick}
              className={`p-4 rounded-2xl border ${t.bg} text-center transition-all ${t.onClick ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'}`}
            >
              <t.Icon className={`w-5 h-5 mx-auto mb-2 ${t.color} ${downloading && t.label === 'Download' ? 'animate-bounce' : ''}`} />
              <div className="text-xs font-bold text-white">{t.label}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Effect House export */}
        <div className="border-t border-white/5 pt-4">
          <EffectHouseExporter widgetName={name} widgetDescription={description} widgetCode={code} />
        </div>
      </div>
    </div>
  );
}

export default function WidgetBuilder() {
  const [viewMode, setViewMode] = useState<ViewMode>('discovery');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [publishScope, setPublishScope] = useState<'public' | 'private'>('private');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [widgetHistory, setWidgetHistory] = useState<{ role: string; content: string }[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [widgetName, setWidgetName] = useState('');
  const [widgetDesc, setWidgetDesc] = useState('');
  const [widgetTags, setWidgetTags] = useState<string[]>([]);
  const [savedWidgets, setSavedWidgets] = useState<SavedWidget[]>([]);
  const [published, setPublished] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [deployOpen, setDeployOpen] = useState(false);

  useEffect(() => { setSavedWidgets(loadWidgets()); }, []);

  const handleGenerate = async (overridePrompt?: string) => {
    const q = overridePrompt ?? naturalLanguageInput;
    if (!q.trim()) return;
    if (overridePrompt) setNaturalLanguageInput(overridePrompt);
    setGenerating(true);
    setGenerateError(null);
    setGeneratedCode(null);
    setWidgetName('');
    setWidgetDesc('');
    setWidgetTags([]);
    setPublished(false);

    const newHistory = [...widgetHistory, { role: 'user', content: q }];
    try {
      const res = await fetch('/api/langgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: buildWidgetPrompt(q), history: widgetHistory, mode: 'widget' }),
      });
      const data = await res.json();
      if (data.code?.code) {
        setGeneratedCode(stripFences(data.code.code));
        setWidgetHistory([...newHistory, { role: 'assistant', content: data.final_response || 'Widget generated.' }]);
        setShowCode(false);
        generateMeta(q, data.code.code);
      } else {
        setGenerateError(data.error || 'No code returned. Try a more specific description.');
      }
    } catch {
      setGenerateError('Failed to connect to the AI backend. Check your API key.');
    } finally {
      setGenerating(false);
    }
  };

  const generateMeta = async (userPrompt: string, code: string) => {
    setGeneratingMeta(true);
    try {
      const res = await fetch('/api/langgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `A football analytics widget was just generated based on: "${userPrompt}". The widget code starts with: ${code.slice(0, 200)}...
Give it a short name (3-5 words), a one-sentence description for the community library, and 2-3 relevant tags.
Respond ONLY with valid JSON, no other text: {"name": "...", "description": "...", "tags": ["...", "..."]}`,
          mode: 'agent',
          history: [],
        }),
      });
      const data = await res.json();
      const text = data.final_response ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const meta = JSON.parse(jsonMatch[0]);
        setWidgetName(meta.name ?? '');
        setWidgetDesc(meta.description ?? '');
        setWidgetTags(meta.tags ?? []);
      }
    } catch {}
    finally { setGeneratingMeta(false); }
  };

  const handlePublish = () => {
    if (!generatedCode || !widgetName.trim()) return;
    const widget: SavedWidget = {
      id: generateId(),
      name: widgetName.trim(),
      description: widgetDesc,
      code: generatedCode,
      tags: widgetTags,
      type: widgetTags[0] ?? 'Chart',
      author: 'You',
      createdAt: new Date().toISOString(),
      likes: 0,
      scope: publishScope,
    };
    const updated = [widget, ...savedWidgets];
    saveWidgets(updated);
    setSavedWidgets(updated);
    setPublished(true);
    setTimeout(() => { setViewMode('discovery'); setPublished(false); }, 1200);
  };

  const allWidgets = [...savedWidgets, ...SEED_WIDGETS];
  const filtered = searchQuery.trim()
    ? allWidgets.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allWidgets;

  const typeIcon: Record<string, typeof BarChart3> = { Chart: TrendingUp, Map: LayoutGrid, Graph: Activity, KPI: BarChart3 };

  const renderDiscovery = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Box className="w-8 h-8 text-indigo-500" />
            Widget Library
          </h1>
          <p className="text-zinc-400 mt-2">Browse, install, and create custom data visualizations.</p>
        </div>
        <button
          onClick={() => { setViewMode('builder'); setGeneratedCode(null); setNaturalLanguageInput(''); setWidgetName(''); }}
          className="px-6 py-3 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Widget
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
        <div className="flex-1 flex items-center gap-3 px-4">
          <Search className="w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search widgets, dashboards, or visualization components..."
            className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-zinc-600"
          />
        </div>
        <div className="h-8 w-px bg-white/10" />
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Categories Grid */}
      {!searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: 'Charts & Graphs', count: 124, color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
            { icon: LayoutGrid, label: 'Heatmaps',        count: 45,  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { icon: Activity,   label: 'Live Metrics',    count: 89,  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
            { icon: Layout,     label: 'Dashboards',      count: 32,  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          ].map((cat, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${cat.border} ${cat.bg} hover:brightness-110 transition-all cursor-pointer group`}>
              <div className="flex items-center justify-between mb-2">
                <cat.icon className={`w-6 h-6 ${cat.color}`} />
                <span className="text-xs font-bold text-white bg-black/20 px-2 py-1 rounded-md">{cat.count}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{cat.label}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Your Widgets */}
      {savedWidgets.length > 0 && !searchQuery && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            Your Widgets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {savedWidgets.map(w => {
              const Icon = typeIcon[w.type] ?? BarChart3;
              return (
                <div key={w.id} className="group bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-1 flex flex-col">
                  <div className="h-40 bg-gradient-to-br from-[#111] to-[#1a1a1a] relative flex items-center justify-center p-8 group-hover:from-purple-900/10 group-hover:to-indigo-900/10 transition-colors">
                    <div className="w-full h-full bg-white/5 rounded-xl border border-white/5 relative overflow-hidden shadow-inner flex items-center justify-center">
                      <Icon className="w-10 h-10 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <span className="absolute top-3 left-3 text-[10px] font-bold text-purple-400 bg-purple-900/40 border border-purple-800 px-2 py-0.5 rounded">Yours</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">{w.name}</h3>
                        <span className="text-xs text-zinc-500">{w.author}</span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 bg-white/5 border border-white/5 px-2 py-1 rounded">{w.type}</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2 flex-1">{w.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      {w.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/5 rounded text-zinc-500">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      {w.code ? (
                        <button
                          onClick={() => { setGeneratedCode(w.code); setWidgetName(w.name); setWidgetDesc(w.description); setWidgetTags(w.tags); setNaturalLanguageInput(w.name); setViewMode('builder'); }}
                          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors font-medium"
                        >
                          <Download className="w-3.5 h-3.5" /> Load
                        </button>
                      ) : <span />}
                      <button
                        onClick={() => { const next = new Set(liked); next.has(w.id) ? next.delete(w.id) : next.add(w.id); setLiked(next); }}
                        className="flex items-center gap-1.5 text-xs transition-colors"
                      >
                        <Star className={`w-3.5 h-3.5 ${liked.has(w.id) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-500'}`} />
                        <span className={liked.has(w.id) ? 'text-yellow-400 font-bold' : 'text-zinc-500'}>{w.likes + (liked.has(w.id) ? 1 : 0)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Community Top Picks / Search Results */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-400" />
          {searchQuery ? `Results (${filtered.length})` : 'Community Top Picks'}
        </h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-500">No widgets match "{searchQuery}".</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(w => {
              const Icon = typeIcon[w.type] ?? BarChart3;
              return (
                <div
                  key={w.id}
                  onClick={() => setViewMode('builder')}
                  className="group bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] cursor-pointer hover:-translate-y-1 flex flex-col"
                >
                  <div className="h-40 bg-gradient-to-br from-[#111] to-[#1a1a1a] relative flex items-center justify-center p-8 group-hover:from-indigo-900/10 group-hover:to-purple-900/10 transition-colors">
                    <div className="w-full h-full bg-white/5 rounded-xl border border-white/5 relative overflow-hidden shadow-inner flex items-center justify-center">
                      <Icon className="w-10 h-10 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div className="absolute top-3 right-3">
                      <button className="p-1.5 bg-black/40 backdrop-blur-md rounded-lg text-zinc-400 hover:text-white border border-white/10 hover:border-white/30 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">{w.name}</h3>
                        <span className="text-xs text-zinc-500">{w.author}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded text-[10px] font-bold text-zinc-400 border border-white/5">{w.type}</div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">{w.description}</p>
                    <div className="flex items-center gap-2 mb-4 mt-auto">
                      {w.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/5 rounded text-zinc-500">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                        <Download className="w-3.5 h-3.5" /> {w.likes >= 1000 ? `${(w.likes / 1000).toFixed(1)}k` : w.likes}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" /> {(4.7 + Math.random() * 0.3).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Create New Card */}
            {!searchQuery && (
              <div
                onClick={() => setViewMode('builder')}
                className="group bg-white/[0.02] border border-dashed border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[300px]"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                  <Plus className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-zinc-400 group-hover:text-indigo-400 transition-colors">Create Custom Widget</h3>
                  <p className="text-xs text-zinc-500 mt-1">Use AI or Code</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderBuilder = () => (
    <div className="h-[calc(100vh-140px)] flex gap-8 animate-in fade-in zoom-in-95 duration-300 relative">
      <button
        onClick={() => setViewMode('discovery')}
        className="absolute top-[-50px] left-0 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>

      {/* Left Sidebar: Templates */}
      <div className="w-80 flex flex-col bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Quick Start Templates</h2>
          <p className="text-xs text-zinc-500">Drag and drop to initialize.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <button
                key={t.label}
                onClick={() => handleGenerate(t.hint)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white/[0.05] text-left transition-all border border-transparent hover:border-white/5 group"
              >
                <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-purple-400 transition-colors">
                  <t.icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white">{t.label}</span>
                  <span className="text-[10px] text-zinc-500">{t.sub}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {widgetName || 'New Widget'}
            </h2>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-wider">Draft Mode</span>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mr-2">
              <button
                onClick={() => setPublishScope('public')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${publishScope === 'public' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Globe className="w-3 h-3" /> Public
              </button>
              <button
                onClick={() => setPublishScope('private')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${publishScope === 'private' ? 'bg-amber-500/10 text-amber-500 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Lock className="w-3 h-3" /> Private
              </button>
            </div>
            <button
              onClick={() => setShowCode(s => !s)}
              disabled={!generatedCode}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${showCode ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 hover:bg-white/10 text-white border-white/5 hover:border-white/10'}`}
            >
              <Code className="w-4 h-4" />
              {showCode ? 'Preview' : 'Code'}
            </button>
            <button
              onClick={handlePublish}
              disabled={!generatedCode || !widgetName.trim() || published}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-purple-600/25 flex items-center gap-2"
            >
              {published ? <><Check className="w-4 h-4" /> Saved!</> : <><Share2 className="w-4 h-4" /> Publish</>}
            </button>
            <button
              onClick={() => setDeployOpen(true)}
              disabled={!generatedCode}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center gap-2"
            >
              <Globe className="w-4 h-4" /> Deploy
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Editor */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-white/5 flex flex-col bg-black/20">
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              {/* Prompt */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wide">
                  Describe your widget
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-2xl pointer-events-none" />
                  <textarea
                    value={naturalLanguageInput}
                    onChange={e => setNaturalLanguageInput(e.target.value)}
                    placeholder="E.g., 'Create a timeline comparing network health between Spain and Japan, highlighting collapse risk moments...'"
                    className="w-full h-40 bg-black/20 border border-white/10 rounded-2xl p-6 text-sm text-white resize-none focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all placeholder:text-zinc-600 leading-relaxed shadow-inner"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={() => handleGenerate()}
                      disabled={generating}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                      {generating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Auto-generated name — only after generation */}
              {generatedCode && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Widget Name {generatingMeta && <span className="text-zinc-600 normal-case font-normal ml-1">(generating…)</span>}
                  </label>
                  <input
                    value={widgetName}
                    onChange={e => setWidgetName(e.target.value)}
                    placeholder="Give it a name to publish…"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                  {widgetDesc && <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{widgetDesc}</p>}
                  {widgetTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {widgetTags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-500">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI Suggestions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">AI Suggestions</h3>
                {AI_SUGGESTIONS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => handleGenerate(s.hint)}
                    className="w-full p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${s.color} rounded-lg`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{s.label}</div>
                        <div className="text-xs text-zinc-500">{s.sub}</div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="w-full md:w-1/2 bg-black/10 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-transparent pointer-events-none" />
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02] backdrop-blur-sm relative z-10">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                <Eye className="w-3 h-3" /> Preview
              </span>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
              {generateError && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {generateError}
                </div>
              )}
              {generatedCode && !showCode ? (
                <ReactRunner code={generatedCode} height={320} />
              ) : generatedCode && showCode ? (
                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
                  <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">JSX Source</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-blue-300 whitespace-pre-wrap overflow-x-auto max-h-72 custom-scrollbar">
                    {generatedCode}
                  </pre>
                </div>
              ) : generating ? (
                <GeneratingPreview />
              ) : (
                <div className="w-full h-64 bg-black/60 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-4 text-zinc-500">
                  <div className="p-4 bg-white/5 rounded-full border border-white/5">
                    <Sparkles className="w-8 h-8 opacity-40 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">Describe a widget and click Generate</span>
                  <svg className="absolute inset-0 w-full h-full p-8 opacity-10 pointer-events-none" style={{ position: 'absolute' }}>
                    <path d="M 30 200 Q 100 150 200 180 T 350 100" fill="none" stroke="#a855f7" strokeWidth="3" />
                    <path d="M 30 180 Q 120 220 220 160 T 350 140" fill="none" stroke="#3b82f6" strokeWidth="3" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {viewMode === 'discovery' ? renderDiscovery() : renderBuilder()}
      {deployOpen && generatedCode && (
        <DeployModal
          code={generatedCode}
          name={widgetName}
          description={widgetDesc}
          onClose={() => setDeployOpen(false)}
        />
      )}
    </div>
  );
}
