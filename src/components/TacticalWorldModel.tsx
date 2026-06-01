import { useState } from 'react';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

const SERVER_URL = 'http://localhost:8000';

export default function TacticalWorldModel() {
  const [loadError, setLoadError] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] animate-in fade-in duration-300">
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-lg font-bold text-white">Tactical World Model</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            SSE + Flow Matching generator · WWC StatsBomb data · communicative, not analytical
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoadError(false); setKey(k => k + 1); }}
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

      {/* iframe or error state */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-white/8 bg-[#050505] relative shadow-2xl">
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Server not reachable</p>
              <p className="text-zinc-500 text-sm max-w-sm">
                Start the tactical world model server first:
              </p>
              <code className="block mt-3 px-4 py-2 bg-black/60 border border-white/8 rounded-xl text-xs text-green-400 font-mono">
                cd ~/tactical-world-model && uvicorn server.app:app --reload
              </code>
            </div>
            <button
              onClick={() => { setLoadError(false); setKey(k => k + 1); }}
              className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_16px_rgba(236,72,153,0.3)] hover:scale-105"
            >
              Retry
            </button>
          </div>
        ) : (
          <iframe
            key={key}
            src={SERVER_URL}
            title="Tactical World Model"
            className="w-full h-full border-0"
            onError={() => setLoadError(true)}
          />
        )}
      </div>
    </div>
  );
}
