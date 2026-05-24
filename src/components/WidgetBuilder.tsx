import { useState, useEffect } from 'react';
import {
  Sparkles, Code, Eye, Share2, Download, Search,
  Globe, Lock, Plus, BarChart3, PieChart, Activity,
  Box, ArrowLeft, Star, TrendingUp, LayoutGrid, Check,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactRunner from './ReactRunner';

const WIDGETS_KEY = 'filmroom-widgets';

interface SavedWidget {
  id: string;
  name: string;
  description: string;
  code: string;
  tags: string[];
  author: string;
  createdAt: string;
  likes: number;
  scope: 'public' | 'private';
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadWidgets(): SavedWidget[] {
  try {
    return JSON.parse(localStorage.getItem(WIDGETS_KEY) || '[]');
  } catch { return []; }
}

function saveWidgets(widgets: SavedWidget[]) {
  localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgets));
}

const SEED_WIDGETS: SavedWidget[] = [
  {
    id: 'seed1', name: 'Pass Network Graph', description: 'Force-directed graph of player passing connections and volume.',
    code: '', tags: ['Passing', 'Network'], author: 'Film Room', createdAt: '2026-05-01T00:00:00Z', likes: 341, scope: 'public',
  },
  {
    id: 'seed2', name: 'Living Space Heatmap', description: 'Dynamic heatmap showing effective playing space controlled by the team.',
    code: '', tags: ['Space', 'Heatmap'], author: '@tactical_ai', createdAt: '2026-05-10T00:00:00Z', likes: 210, scope: 'public',
  },
  {
    id: 'seed3', name: 'Collapse Risk Timeline', description: 'Visualizes network stability over time, highlighting potential structural failures.',
    code: '', tags: ['Stability', 'Timeline'], author: '@jessica_fan', createdAt: '2026-05-15T00:00:00Z', likes: 280, scope: 'public',
  },
];

const TEMPLATES = [
  { icon: BarChart3,  label: 'Match Stats',         hint: 'Possession, xG, shots on target as a bar chart' },
  { icon: PieChart,   label: 'Player Distribution', hint: 'Passing zones breakdown as a pie chart' },
  { icon: Activity,   label: 'Performance Trend',   hint: 'Season-long performance trend line chart' },
  { icon: TrendingUp, label: 'xG Race',             hint: 'Cumulative xG over match time for both teams' },
];

export default function WidgetBuilder() {
  const [viewMode, setViewMode] = useState<'discovery' | 'builder' | 'viewing'>('discovery');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [publishScope, setPublishScope] = useState<'public' | 'private'>('public');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [widgetName, setWidgetName] = useState('');
  const [widgetDesc, setWidgetDesc] = useState('');
  const [widgetTags, setWidgetTags] = useState<string[]>([]);
  const [savedWidgets, setSavedWidgets] = useState<SavedWidget[]>([]);
  const [viewingWidget, setViewingWidget] = useState<SavedWidget | null>(null);
  const [published, setPublished] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSavedWidgets(loadWidgets());
  }, []);

  async function handleGenerate(overridePrompt?: string) {
    const q = overridePrompt ?? prompt;
    if (!q.trim()) return;
    setGenerating(true);
    setError(null);
    setGeneratedCode(null);
    setWidgetName('');
    setWidgetDesc('');
    setWidgetTags([]);
    setPublished(false);

    const newHistory = [...history, { role: 'user', content: q }];
    try {
      const res = await fetch('/api/langgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history, mode: 'widget' }),
      });
      const data = await res.json();
      if (data.code?.code) {
        setGeneratedCode(data.code.code);
        setHistory([...newHistory, { role: 'assistant', content: data.final_response || 'Widget generated.' }]);
        setShowCode(false);
        generateMeta(q, data.code.code);
      } else {
        setError(data.error || 'No code returned. Try a more specific description.');
      }
    } catch {
      setError('Failed to connect. Check your API key.');
    } finally {
      setGenerating(false);
    }
  }

  async function generateMeta(userPrompt: string, code: string) {
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
  }

  function handlePublish() {
    if (!generatedCode || !widgetName.trim()) return;
    const widget: SavedWidget = {
      id: generateId(),
      name: widgetName.trim(),
      description: widgetDesc,
      code: generatedCode,
      tags: widgetTags,
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
  }

  const allWidgets = [...savedWidgets, ...SEED_WIDGETS];
  const filtered = searchQuery.trim()
    ? allWidgets.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allWidgets;

  // ── Viewing a saved widget ─────────────────────────────────────────────
  if (viewMode === 'viewing' && viewingWidget) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <button onClick={() => { setViewMode('discovery'); setViewingWidget(null); }}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Widget Library
        </button>
        <h2 className="text-xl font-black text-white mb-1">{viewingWidget.name}</h2>
        <p className="text-sm text-zinc-400 mb-6">{viewingWidget.description}</p>
        {viewingWidget.code ? (
          <ReactRunner code={viewingWidget.code} height={400} />
        ) : (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 h-64 flex items-center justify-center text-zinc-600 text-sm">
            No runnable code for this widget.
          </div>
        )}
      </div>
    );
  }

  // ── Builder ────────────────────────────────────────────────────────────
  if (viewMode === 'builder') {
    return (
      <div className="max-w-5xl mx-auto py-10 px-6">
        <button onClick={() => setViewMode('discovery')}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Widget Library
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — input + meta */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Describe your widget</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="E.g. 'Bar chart comparing total pressures by team across WC 2022 knockouts'"
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Quick templates */}
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.label} onClick={() => { setPrompt(t.hint); handleGenerate(t.hint); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-left transition-all group">
                  <t.icon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                  <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">{t.label}</span>
                </button>
              ))}
            </div>

            <button onClick={() => handleGenerate()}
              disabled={!prompt.trim() || generating}
              className="w-full py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Widget</>}
            </button>

            {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">{error}</p>}

            {/* Meta — shown after generation */}
            <AnimatePresence>
              {generatedCode && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="h-px bg-zinc-800" />
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                      Widget name {generatingMeta && <span className="text-zinc-600 normal-case font-normal">(generating…)</span>}
                    </label>
                    <input
                      value={widgetName}
                      onChange={e => setWidgetName(e.target.value)}
                      placeholder="Give it a name…"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                  {widgetDesc && (
                    <p className="text-xs text-zinc-500 leading-relaxed">{widgetDesc}</p>
                  )}
                  {widgetTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {widgetTags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                      <button onClick={() => setPublishScope('public')}
                        className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${publishScope === 'public' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <Globe className="w-3 h-3" /> Public
                      </button>
                      <button onClick={() => setPublishScope('private')}
                        className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${publishScope === 'private' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <Lock className="w-3 h-3" /> Private
                      </button>
                    </div>
                    <button onClick={handlePublish}
                      disabled={!widgetName.trim() || published}
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                      {published ? <><Check className="w-4 h-4" /> Saved!</> : <><Share2 className="w-4 h-4" /> Publish to Library</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — preview */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Preview</span>
              {generatedCode && (
                <button onClick={() => setShowCode(s => !s)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg transition-all">
                  <Code className="w-3.5 h-3.5" /> {showCode ? 'Preview' : 'View Code'}
                </button>
              )}
            </div>

            {generatedCode && !showCode && <ReactRunner code={generatedCode} height={380} />}
            {generatedCode && showCode && (
              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <div className="px-4 py-2 border-b border-zinc-800">
                  <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">JSX Source</span>
                </div>
                <pre className="p-4 text-xs font-mono text-blue-300 whitespace-pre-wrap overflow-x-auto max-h-96 custom-scrollbar">{generatedCode}</pre>
              </div>
            )}
            {!generatedCode && (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 h-64 flex flex-col items-center justify-center gap-3 text-zinc-600">
                <Sparkles className="w-8 h-8 opacity-30 text-purple-400" />
                <span className="text-sm">Describe a widget and hit Generate</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Discovery ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Widget Library</h2>
          <p className="text-sm text-zinc-400">Browse community visualizations or build your own.</p>
        </div>
        <button onClick={() => { setViewMode('builder'); setGeneratedCode(null); setPrompt(''); setWidgetName(''); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all shrink-0">
          <Plus className="w-4 h-4" /> Create Widget
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-8 focus-within:border-zinc-600 transition-colors">
        <Search className="w-4 h-4 text-zinc-500 shrink-0" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search widgets, tags, or descriptions…"
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
        />
      </div>

      {/* Your widgets — only if any saved */}
      {savedWidgets.length > 0 && !searchQuery && (
        <div className="mb-10">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Your Widgets</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedWidgets.map(w => (
              <WidgetCard key={w.id} widget={w} liked={liked} setLiked={setLiked}
                onView={() => { setViewingWidget(w); setViewMode('viewing'); }}
                onLoad={() => { setGeneratedCode(w.code); setWidgetName(w.name); setWidgetDesc(w.description); setWidgetTags(w.tags); setPrompt(w.name); setViewMode('builder'); }}
                isYours />
            ))}
          </div>
        </div>
      )}

      {/* Community */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
          {searchQuery ? `Results (${filtered.length})` : 'Community Picks'}
        </p>
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-600">No widgets match "{searchQuery}".</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(w => (
              <WidgetCard key={w.id} widget={w} liked={liked} setLiked={setLiked}
                onView={() => { setViewingWidget(w); setViewMode('viewing'); }}
                onLoad={() => { setGeneratedCode(w.code); setWidgetName(w.name); setWidgetDesc(w.description); setWidgetTags(w.tags); setPrompt(w.name); setViewMode('builder'); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WidgetCard({ widget, liked, setLiked, onView, onLoad, isYours }: {
  widget: SavedWidget;
  liked: Set<string>;
  setLiked: (s: Set<string>) => void;
  onView: () => void;
  onLoad: () => void;
  isYours?: boolean;
}) {
  const typeIcon: Record<string, typeof BarChart3> = { Passing: Activity, Network: Activity, Heatmap: LayoutGrid, Timeline: TrendingUp };
  const Icon = typeIcon[widget.tags[0]] ?? BarChart3;
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col overflow-hidden group">
      <div className="h-32 bg-zinc-950 flex items-center justify-center border-b border-zinc-800 relative">
        <Icon className="w-10 h-10 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        {isYours && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-purple-400 bg-purple-900/40 border border-purple-800 px-2 py-0.5 rounded">Yours</span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-sm font-bold text-white mb-1 leading-snug">{widget.name}</p>
        <p className="text-xs text-zinc-400 leading-relaxed mb-3 flex-1 line-clamp-2">{widget.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {widget.tags.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500">{t}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <button onClick={onView} className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            {widget.code && (
              <button onClick={onLoad} className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Load
              </button>
            )}
          </div>
          <button
            onClick={() => {
              const next = new Set(liked);
              next.has(widget.id) ? next.delete(widget.id) : next.add(widget.id);
              setLiked(next);
            }}
            className="flex items-center gap-1 text-xs transition-colors"
          >
            <Star className={`w-3.5 h-3.5 transition-all ${liked.has(widget.id) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600 hover:text-zinc-400'}`} />
            <span className={liked.has(widget.id) ? 'text-yellow-400' : 'text-zinc-600'}>
              {widget.likes + (liked.has(widget.id) ? 1 : 0)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
