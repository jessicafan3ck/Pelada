import { useState, useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, Play, Terminal } from 'lucide-react';

const SERVER_URL = 'http://localhost:8000';

export default function TacticalWorldModel() {
  const [key, setKey] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Browsers silently block http:// iframes inside https:// pages (mixed content).
  // When on HTTPS (Vercel), show a launch-in-tab panel instead.
  const isHTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // On iframe reload, reset ready state and start a 5s timeout to catch silent failures
  useEffect(() => {
    if (isHTTPS) return;
    setIframeReady(false);
    timerRef.current = setTimeout(() => setIframeReady(false), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [key, isHTTPS]);

  const handleIframeLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIframeReady(true);
  };

  const reload = () => { setIframeReady(false); setKey(k => k + 1); };

  // ── HTTPS: launch-in-tab panel ────────────────────────────────────────────
  if (isHTTPS) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] animate-in fade-in duration-300">
        <div className="flex-1 rounded-3xl border border-white/8 bg-black/40 backdrop-blur-2xl relative overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-8 px-12 text-center">
          {/* Ambient glow */}
          <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-pink-500/8 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-sky-500/8 blur-[100px] rounded-full pointer-events-none" />

          {/* Pitch icon */}
          <div className="relative z-10 w-24 h-16 rounded-xl border border-white/10 bg-[#14532d] flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.15)]">
            <div className="w-16 h-px bg-white/30 absolute" />
            <div className="w-8 h-8 rounded-full border border-white/30" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-4 border-t border-white/20 rounded-t-full" />
          </div>

          <div className="relative z-10 space-y-3 max-w-md">
            <h2 className="text-2xl font-bold text-white tracking-tight">Tactical World Model</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              SSE + Flow Matching generator trained on WWC StatsBomb 360° data.
              Interactive — pick an action, watch the shape respond.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-sm">
            <a
              href={SERVER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-pink-600 hover:bg-pink-500 text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all shadow-[0_0_24px_rgba(236,72,153,0.35)] hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(236,72,153,0.5)]"
            >
              <Play className="w-4 h-4 fill-white" />
              Launch World Sim
            </a>
            <p className="text-zinc-600 text-xs">Opens in a new tab · requires local server running</p>
          </div>

          {/* Start command */}
          <div className="relative z-10 w-full max-w-md bg-black/50 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Start server first</span>
            </div>
            <code className="text-xs text-green-400 font-mono leading-relaxed">
              cd ~/tactical-world-model<br />
              uvicorn server.app:app --reload
            </code>
          </div>
        </div>
      </div>
    );
  }

  // ── HTTP (local dev): embed via iframe ────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-lg font-bold text-white">Tactical World Model</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            SSE + Flow Matching generator · WWC StatsBomb data · communicative, not analytical
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Reload
          </button>
          <a
            href={SERVER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Open standalone
          </a>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-white/8 bg-[#050505] relative shadow-2xl">
        {/* Loading shimmer while iframe loads */}
        {!iframeReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-8 z-10 bg-[#050505]">
            <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/8 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-zinc-600" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Connecting to World Sim…</p>
              <p className="text-zinc-500 text-sm mb-3">Make sure the server is running:</p>
              <code className="block px-4 py-2 bg-black/60 border border-white/8 rounded-xl text-xs text-green-400 font-mono">
                cd ~/tactical-world-model && uvicorn server.app:app --reload
              </code>
            </div>
            <button
              onClick={reload}
              className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_16px_rgba(236,72,153,0.3)] hover:scale-105"
            >
              Retry
            </button>
          </div>
        )}
        <iframe
          key={key}
          src={SERVER_URL}
          title="Tactical World Model"
          className={`w-full h-full border-0 transition-opacity duration-500 ${iframeReady ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}
