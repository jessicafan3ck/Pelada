import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useAppContext } from '../context/AppContext';
import { DataContext } from '../context/DataContext';
import {
  X, Send, ArrowRight, Maximize2, Minimize2, User, Zap, Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PassMap from './visualizations/PassMap';
import PressureTimeline from './visualizations/PressureTimeline';
import QuadrantPlot from './visualizations/QuadrantPlot';
import SetPieceAnalysis from './visualizations/SetPieceAnalysis';

const LIBRARY_ITEMS = [
  { id:  1, type: 'widget',    title: 'xG Momentum Flow',            author: 'DataViz_Pro',   downloads: '8.2k', rating: 4.9, tags: ['Visualization','xG'],      color: '#2B3F9E', dark: '#0d1832', nav: 'widgets'   },
  { id:  2, type: 'model',     title: 'Collapse Predictor v2',       author: 'Pelada_Labs',   downloads: '5.1k', rating: 4.8, tags: ['ML','Defense'],             color: '#C2298A', dark: '#2a0020', nav: 'models'    },
  { id:  3, type: 'tactics',   title: 'Inverted Wingback Overload',  author: 'tactician_88',  downloads: '12k',  rating: 4.7, tags: ['Pressing','Width'],         color: '#E53935', dark: '#2a0808', nav: 'tactics'   },
  { id:  4, type: 'widget',    title: 'GOAT XI Builder — WWC',       author: 'jessica_fan',   downloads: '19k',  rating: 5.0, tags: ['Fan','Interactive'],        color: '#C9D426', dark: '#1a2000', nav: 'widgets'   },
  { id:  5, type: 'model',     title: 'Flair Index — WWC 2027',      author: 'xG_Prophet',    downloads: '3.4k', rating: 4.6, tags: ['Creativity','Player'],      color: '#4CAF50', dark: '#082008', nav: 'models'    },
  { id:  6, type: 'formation', title: '3-4-3 Barcelona Replica',     author: 'Bonmati_AI',    downloads: '9.8k', rating: 4.8, tags: ['Positional','Press'],       color: '#F04A36', dark: '#2a1000', nav: 'formation' },
  { id:  7, type: 'widget',    title: 'Match Heat Map',              author: 'HeatMap_Pro',   downloads: '4.1k', rating: 4.5, tags: ['Visualization','Heat'],     color: '#4FC3F7', dark: '#0a2030', nav: 'widgets'   },
  { id:  8, type: 'model',     title: 'Pass Network Graph',          author: 'GraphML',       downloads: '2.9k', rating: 4.4, tags: ['Network','Passing'],        color: '#F5C418', dark: '#2a2000', nav: 'models'    },
  { id:  9, type: 'tactics',   title: 'High Press Trigger Zones',    author: 'PressKing',     downloads: '7.3k', rating: 4.6, tags: ['Press','Defending'],        color: '#F04A36', dark: '#2a0808', nav: 'tactics'   },
  { id: 10, type: 'widget',    title: 'Player Radar Chart',          author: 'RadarKing',     downloads: '6.8k', rating: 4.7, tags: ['Player','Stats'],           color: '#C2298A', dark: '#200015', nav: 'widgets'   },
  { id: 11, type: 'formation', title: '4-3-3 High Block Counter',    author: 'CounterKing',   downloads: '5.6k', rating: 4.5, tags: ['Counter','Block'],          color: '#2B3F9E', dark: '#0a1020', nav: 'formation' },
  { id: 12, type: 'formation', title: '3-5-2 Wing Overload',         author: 'WingMaster',    downloads: '3.2k', rating: 4.3, tags: ['Width','Attack'],           color: '#4CAF50', dark: '#082008', nav: 'formation' },
  { id: 13, type: 'model',     title: 'Aerial Duel Predictor',       author: 'AerialAI',      downloads: '1.8k', rating: 4.2, tags: ['Set Piece','Physical'],     color: '#E53935', dark: '#200808', nav: 'models'    },
  { id: 14, type: 'tactics',   title: 'Low Block 4-4-2 Compact',     author: 'DefenseMaster', downloads: '8.9k', rating: 4.5, tags: ['Defending','Low Block'],    color: '#4FC3F7', dark: '#081828', nav: 'tactics'   },
  { id: 15, type: 'widget',    title: 'Live xG Gauge',               author: 'LiveStats',     downloads: '11k',  rating: 4.8, tags: ['Live','xG'],                color: '#C9D426', dark: '#182000', nav: 'widgets'   },
];

type LibFilter = 'all' | 'widget' | 'model' | 'tactics' | 'formation';

type Message = {
  id: string;
  type: 'user' | 'agent';
  text?: string;
  visualization?: 'passmap' | 'pressure' | 'quadrant' | 'setpiece';
  action?: { label: string; view: string };
};

type ViewType = 'dashboard' | 'copilot' | 'tactics' | 'models' | 'widgets' | 'benchmarks' | 'formation' | 'history' | 'calendar';

interface PeladaAgentProps {
  onNavigate: (view: ViewType) => void;
  currentView: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  fullPage?: boolean;
}

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Hub', copilot: 'Co-Pilot', tactics: 'Tactics Studio',
  models: 'Model Sandbox', widgets: 'Widget Builder', benchmarks: 'Benchmarks',
  formation: 'Formation Analysis', history: 'Historical Data', calendar: 'Match Calendar',
};

const QUICK_PROMPTS = [
  { label: 'Pass map', prompt: 'Show me a pass map' },
  { label: 'Pressure timeline', prompt: 'Show a pressure timeline' },
  { label: 'Tactics Studio', prompt: 'Take me to the Tactics Studio' },
];

const VIZ_COMPONENTS: Record<string, React.ReactElement> = {
  passmap: <PassMap />,
  pressure: <PressureTimeline />,
  quadrant: <QuadrantPlot />,
  setpiece: <SetPieceAnalysis />,
};

// ─── sub-components defined OUTSIDE parent so React identity stays stable ────

function LogoAvatar() {
  return (
    <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden relative" style={{ background: '#000' }}>
      <svg className="absolute inset-0" viewBox="0 0 32 32" width="32" height="32" aria-hidden fill="none">
        <polyline points="1,5 8,13 16,5 24,13 31,5"   stroke="#F59E0B" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points="1,27 8,19 16,27 24,19 31,27" stroke="#009C3B" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-3 px-1">
      <LogoAvatar />
      <div className="bg-white/5 border border-white/8 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
      </div>
    </div>
  );
}

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  variant?: 'default' | 'amber';
}

function ChatInput({ value, onChange, onSend, placeholder = 'Ask anything...', autoFocus, variant = 'default' }: ChatInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  if (variant === 'amber') {
    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder={placeholder}
          className="w-full bg-white/5 rounded-2xl text-sm text-white focus:outline-none transition-all placeholder:text-zinc-500"
          style={{ border: '1.5px solid rgba(251,191,36,0.6)', boxShadow: '0 0 0 3px rgba(251,191,36,0.08)', paddingLeft: '28px', paddingRight: '56px', paddingTop: '16px', paddingBottom: '16px' }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)' }}
        >
          <Send className="w-3.5 h-3.5 text-black" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm text-white focus:outline-none focus:border-sky-500/60 focus:bg-white/8 transition-all placeholder:text-zinc-500"
      />
      <button
        onClick={onSend}
        disabled={!value.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl text-white shadow-lg hover:shadow-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function PeladaAgent({ onNavigate, currentView, isOpen, onOpenChange, fullPage = false }: PeladaAgentProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copilotTab, setCopilotTab] = useState<'chat' | 'library'>('chat');
  const [libSearch, setLibSearch] = useState('');
  const [libFilter, setLibFilter] = useState<LibFilter>('all');
  const filteredLib = LIBRARY_ITEMS
    .filter(i => libFilter === 'all' || i.type === libFilter)
    .filter(i => !libSearch || [i.title, i.author, ...i.tags].some(s => s.toLowerCase().includes(libSearch.toLowerCase())));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { copilotQuery, setCopilotQuery, activeMatchId, selectedPlayer } = useAppContext();
  const { matchMeta, events } = useContext(DataContext);

  const matchInfo = matchMeta.find((m: any) => m.match_id === activeMatchId) ?? null;

  const playerStats = selectedPlayer ? (() => {
    const ev = events.filter((e: any) => e.match_id === selectedPlayer.match_id && e.from_player_name === selectedPlayer.name);
    const passes = ev.filter((e: any) => e.event === 'pass');
    const shots = ev.filter((e: any) => e.event === 'shot');
    return {
      passes: passes.length,
      passesComplete: passes.filter((e: any) => e.outcome === 'complete').length,
      shots: shots.length,
      shotsOnTarget: shots.filter((e: any) => ['saved', 'goal'].includes(e.outcome ?? '')).length,
      pressures: ev.filter((e: any) => e.event === 'pressure').length,
      xg: parseFloat(shots.reduce((s: number, e: any) => s + (e.xg ?? 0), 0).toFixed(2)),
    };
  })() : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const buildHistory = (msgs: Message[]) =>
    msgs.filter(m => m.text).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text!
    }));

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/langgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        message: text,
        history: buildHistory(messages),
        mode: 'agent',
        matchContext: { matchInfo, selectedPlayer, playerStats },
      })
      });
      const data = await res.json();

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: data.final_response || "Done.",
      };
      if (data.visualization_type) {
        // Override API viz type with text-based detection when they conflict,
        // since the LLM sometimes picks "pressure" by default due to context bias.
        const responseText = (data.final_response || '').toLowerCase();
        const textViz =
          responseText.includes('pass map') || responseText.includes('passing network') ? 'passmap'
          : responseText.includes('quadrant') || responseText.includes('scatter') ? 'quadrant'
          : responseText.includes('set piece') || responseText.includes('corner') || responseText.includes('free kick') ? 'setpiece'
          : responseText.includes('pressure') || responseText.includes('pressing') ? 'pressure'
          : null;
        agentMsg.visualization = (textViz || data.visualization_type) as Message['visualization'];
      }
      if (data.navigation) agentMsg.action = { label: `Open ${VIEW_LABELS[data.navigation]}`, view: data.navigation };

      setMessages(prev => [...prev, agentMsg]);
      if (data.navigation && !data.visualization_type) onNavigate(data.navigation as ViewType);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: "Connection error — make sure the API key is configured."
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, messages, onNavigate]);

  const handleSend = useCallback(() => sendMessage(inputValue), [sendMessage, inputValue]);

  useEffect(() => {
    if (copilotQuery && fullPage) {
      sendMessage(copilotQuery);
      setCopilotQuery(null);
    }
  }, [copilotQuery, fullPage]);

  // ── markdown renderer: headers, bullets, bold, italic ───────────────────
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### '))
        return <p key={i} className="font-semibold text-white mt-2 mb-0.5">{renderInline(line.slice(4))}</p>;
      if (line.startsWith('## '))
        return <p key={i} className="font-bold text-white mt-3 mb-0.5">{renderInline(line.slice(3))}</p>;
      if (line.startsWith('- '))
        return <p key={i} className="pl-3 text-zinc-200">· {renderInline(line.slice(2))}</p>;
      if (line.trim() === '')
        return <span key={i} className="block h-2" />;
      return <span key={i} className="block">{renderInline(line)}</span>;
    });
  };

  // ── shared message renderer ──────────────────────────────────────────────

  const renderMessage = (msg: Message) => (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {/* Text bubble row — constrained width */}
      {(msg.text || msg.action) && (
        <div className={`flex gap-3 max-w-3xl mx-auto w-full ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          {msg.type === 'agent'
            ? <div className="mt-0.5"><LogoAvatar /></div>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gradient-to-br from-sky-500 to-sky-600">
                <User className="w-4 h-4 text-white" />
              </div>
          }

          <div className={`flex flex-col gap-2 ${msg.type === 'user' ? 'items-end max-w-[75%]' : 'items-start w-full'}`}>
            {msg.text && (
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.type === 'user'
                  ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-tr-sm shadow-lg shadow-sky-900/30'
                  : 'bg-white/6 border border-white/8 text-zinc-100 rounded-tl-sm'
              }`}>
                {msg.type === 'agent' ? renderMarkdown(msg.text) : msg.text}
              </div>
            )}

            {msg.action && (
              <button
                onClick={() => onNavigate(msg.action!.view as ViewType)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/40 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all group"
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                {msg.action.label}
                <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Visualization — full chat width, no avatar, no bubble constraint */}
      {msg.visualization && VIZ_COMPONENTS[msg.visualization] && (
        <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          {VIZ_COMPONENTS[msg.visualization]}
        </div>
      )}
    </motion.div>
  );



  // ── full-page layout ─────────────────────────────────────────────────────

  if (fullPage) {
    return (
      <div className="h-full flex flex-col bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden">

        {/* ── GO EPIC.-style banner header — amber + sky blue ── */}
        <div className="relative shrink-0 overflow-hidden" style={{ height: '88px' }}>
          {/* Amber base */}
          <div className="absolute inset-0" style={{ background: '#FBBF24' }} />
          {/* Sky blue diagonal — right portion */}
          <div className="absolute inset-0" style={{ background: '#38BDF8', clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 28% 100%)' }} />
          {/* Chevron pattern overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.07 }} aria-hidden>
            <defs>
              <pattern id="copilot-chevrons" x="0" y="0" width="40" height="28" patternUnits="userSpaceOnUse">
                <polyline points="0,0 20,14 40,0"   stroke="black" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points="0,14 20,28 40,14" stroke="black" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#copilot-chevrons)" />
          </svg>
          {/* Header content */}
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.28em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: '2px' }}>Pelada Analytics</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>Co-Pilot.</div>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }} />
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Online</span>
              </div>
              <div className="flex p-1 gap-0.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.08)' }}>
                {(['chat', 'library'] as const).map(t => (
                  <button key={t} onClick={() => setCopilotTab(t)}
                    className="px-5 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={copilotTab === t
                      ? { background: 'rgba(0,0,0,0.18)', color: '#000' }
                      : { color: 'rgba(0,0,0,0.38)' }}>
                    {t === 'chat' ? 'Ask' : 'Library'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {copilotTab === 'chat' ? (
          messages.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex-1 flex flex-col items-center px-8 text-center" style={{ gap: '36px', paddingTop: '36px', paddingBottom: '36px' }}>
              <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '14px', lineHeight: 1.7, maxWidth: '380px' }}>
                Ask me anything — xG trends, pass networks, tactical breakdowns — or pick a quick action below to get started.
              </p>
              <div className="w-full max-w-3xl">
                <ChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSend}
                  placeholder="Ask me anything..."
                  autoFocus
                  variant="amber"
                />
              </div>
              <div className="flex flex-wrap gap-3 justify-center max-w-md">
                {QUICK_PROMPTS.map(q => (
                  <button key={q.prompt} onClick={() => sendMessage(q.prompt)}
                    className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all hover:scale-105"
                    style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.28)', color: '#FBBF24' }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-6">
                  {messages.map(renderMessage)}
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
                      <TypingDots />
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="px-8 pb-8 pt-5 bg-black/20 shrink-0">
                <div className="max-w-3xl mx-auto">
                  <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSend}
                    placeholder="Ask about pass maps, tactics, formations, or navigate the platform..."
                    variant="amber"
                  />
                </div>
              </div>
            </>
          )
        ) : (
          /* ── Library tab ── */
          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
            <div className="px-8 py-5 border-b border-white/5 space-y-3 shrink-0">
              <div className="max-w-3xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  value={libSearch}
                  onChange={e => setLibSearch(e.target.value)}
                  placeholder="Search tactics, models, widgets, formations..."
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/40 transition-colors"
                />
              </div>
              <div className="max-w-3xl mx-auto flex gap-2">
                {(['all', 'widget', 'model', 'tactics', 'formation'] as const).map(f => (
                  <button key={f} onClick={() => setLibFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                      libFilter === f ? 'bg-white text-black' : 'bg-white/5 border border-white/8 text-zinc-500 hover:text-white'
                    }`}>
                    {f === 'all' ? 'All' : f === 'widget' ? 'Widgets' : f === 'model' ? 'Models' : f === 'tactics' ? 'Tactics' : 'Formations'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="max-w-3xl mx-auto">
                {filteredLib.length === 0 ? (
                  <div className="text-center py-16 text-zinc-600 text-sm">No results for "{libSearch}"</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredLib.map(item => (
                      <div key={item.id} onClick={() => onNavigate(item.nav as ViewType)}
                        className="group bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer">
                        <div className="h-24 relative overflow-hidden">
                          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${item.dark} 0%, ${item.color} 100%)` }} />
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.12 }} aria-hidden>
                            <defs>
                              <pattern id={`lc-${item.id}`} x="0" y="0" width="40" height="28" patternUnits="userSpaceOnUse">
                                <polyline points="0,0 20,14 40,0"   stroke="white" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                                <polyline points="0,14 20,28 40,14" stroke="white" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#lc-${item.id})`} />
                          </svg>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/70 to-transparent" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[9px] font-bold text-white/60 uppercase tracking-wider">
                            {item.type}
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-bold text-white truncate group-hover:text-sky-400 transition-colors">{item.title}</div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-zinc-600 truncate">@{item.author}</span>
                            <span className="text-[10px] text-yellow-500 font-bold ml-1 shrink-0">★ {item.rating}</span>
                          </div>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {item.tags.slice(0, 2).map(t => (
                              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-white/5 text-zinc-600 rounded">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── floating panel ───────────────────────────────────────────────────────

  return (
    <>
      <AnimatePresence>
        {!isOpen && currentView !== 'dashboard' && currentView !== 'copilot' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => onOpenChange(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.5)] border border-white/20 z-50 hover:scale-110 transition-transform cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full border border-white/30 animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`fixed z-50 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col rounded-3xl overflow-hidden
              ${isMinimized ? 'bottom-8 right-8 w-72 h-16' : 'bottom-8 right-8 w-[400px] h-[580px]'}
            `}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-white/[0.02] cursor-pointer shrink-0"
              onClick={() => setIsMinimized(m => !m)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600" />
                <div>
                  <span className="text-sm font-bold text-white leading-none block">Co-Pilot</span>
                  <span className="text-[10px] text-green-400 font-medium">Online</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <button onClick={() => setIsMinimized(m => !m)} className="p-1.5 hover:bg-white/8 rounded-lg text-zinc-400 hover:text-white transition-colors">
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => onOpenChange(false)} className="p-1.5 hover:bg-white/8 rounded-lg text-zinc-400 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="p-5 space-y-3">
                      <p className="text-xs text-zinc-500 text-center">Try a quick action:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PROMPTS.map(q => (
                          <button
                            key={q.prompt}
                            onClick={() => sendMessage(q.prompt)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/15 border border-white/8 hover:border-purple-500/40 rounded-lg text-[11px] text-zinc-400 hover:text-white transition-all"
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {messages.map(renderMessage)}
                      {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <TypingDots />
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/8 bg-black/30 shrink-0">
                  <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSend}
                    autoFocus={isOpen}
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
