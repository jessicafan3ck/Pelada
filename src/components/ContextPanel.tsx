import React, { useEffect, useState, useRef } from 'react';
import { X, User, Loader2, Flag, Shirt, Target, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { getWWCPlayerStatsForMatch, getWWCMatchById } from '../services/wwcData';
import type { WWCPlayerStat, WWCMatch } from '../services/wwcData';

export interface ContextPanelProps {
  onNavigateToCopilot?: () => void;
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-sky-300">{sub}</div>}
      <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

export default function ContextPanel({ onNavigateToCopilot }: ContextPanelProps) {
  const { contextPanelOpen, setContextPanelOpen, selectedPlayer, setCopilotQuery } = useAppContext();

  const [stats, setStats]       = useState<WWCPlayerStat | null>(null);
  const [match, setMatch]       = useState<WWCMatch | null>(null);
  const [wikiText, setWikiText] = useState('');
  const [wikiThumb, setWikiThumb] = useState('');
  const [loading, setLoading]   = useState(false);
  const analysisCache = useRef<Map<string, string>>(new Map());

  // Fetch real player stats + match from Supabase when player changes
  useEffect(() => {
    if (!selectedPlayer || !contextPanelOpen) return;
    setStats(null);
    setMatch(null);

    const matchId = selectedPlayer.match_id;
    if (matchId) {
      getWWCMatchById(matchId).then(setMatch);
      getWWCPlayerStatsForMatch(matchId).then(rows => {
        const row = rows.find(r =>
          r.player_name === selectedPlayer.name ||
          r.player_id   === selectedPlayer.id
        ) ?? null;
        setStats(row);
      });
    }
  }, [selectedPlayer?.id, selectedPlayer?.match_id, contextPanelOpen]);

  // Wikipedia bio fetch
  useEffect(() => {
    if (!selectedPlayer || !contextPanelOpen) return;
    const cacheKey = `wiki_${selectedPlayer.name}`;
    const cached = analysisCache.current.get(cacheKey);
    if (cached) {
      const { text, thumb } = JSON.parse(cached);
      setWikiText(text); setWikiThumb(thumb); setLoading(false);
      return;
    }
    setWikiText(''); setWikiThumb(''); setLoading(true);
    const title = encodeURIComponent(selectedPlayer.name.replace(/ /g, '_'));
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
      .then(r => r.json())
      .then(d => {
        if (d.type === 'disambiguation' || !d.extract) { setLoading(false); return; }
        const sentences = d.extract.split('. ');
        const text = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
        const thumb = d.thumbnail?.source ?? '';
        setWikiText(text); setWikiThumb(thumb);
        analysisCache.current.set(cacheKey, JSON.stringify({ text, thumb }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedPlayer?.id, contextPanelOpen]);

  const stripWomens = (s: string) => s.replace(" Women's", '');

  return (
    <AnimatePresence>
      {contextPanelOpen && selectedPlayer && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30"
            onClick={() => setContextPanelOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-[340px] bg-[#0a0a12]/95 backdrop-blur-2xl border-l border-white/8 z-40 flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/30 to-sky-700/30 border border-sky-500/20 flex items-center justify-center text-lg font-bold text-sky-200">
                  {selectedPlayer.jersey}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">{selectedPlayer.name}</h2>
                  <p className="text-xs text-zinc-400">{stripWomens(selectedPlayer.team)} · {selectedPlayer.position}</p>
                </div>
              </div>
              <button
                onClick={() => setContextPanelOpen(false)}
                className="p-1.5 hover:bg-white/8 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
              {/* Meta chips */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-xs text-zinc-300 border border-white/8">
                  <Flag className="w-3 h-3 text-sky-400" /> {selectedPlayer.country}
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-xs text-zinc-300 border border-white/8">
                  <Shirt className="w-3 h-3 text-blue-400" /> #{selectedPlayer.jersey}
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-xs text-zinc-300 border border-white/8">
                  <User className="w-3 h-3 text-green-400" /> {selectedPlayer.position}
                </span>
              </div>

              {/* Match context */}
              {match && (
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-sky-300 font-medium">{match.competition_stage}</p>
                  <p className="text-sm text-white font-semibold mt-0.5">
                    {stripWomens(match.home_team)} {match.home_score}–{match.away_score} {stripWomens(match.away_team)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{match.match_date} · {match.stadium}</p>
                </div>
              )}

              {/* Match stats (real from Supabase) */}
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Match Stats</h3>
                {stats ? (
                  <div className="grid grid-cols-3 gap-2">
                    <StatBox label="Passes" value={stats.passes} sub={`${stats.passes_complete} cmp`} />
                    <StatBox label="Shots" value={stats.shots} sub={stats.shots_on_target > 0 ? `${stats.shots_on_target} on tgt` : undefined} />
                    <StatBox label="Pressures" value={stats.pressures} />
                    {stats.xg > 0 && <StatBox label="xG" value={stats.xg.toFixed(2)} />}
                    {stats.goals > 0 && <StatBox label="Goals" value={stats.goals} />}
                    {stats.key_passes > 0 && <StatBox label="Key passes" value={stats.key_passes} />}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-600 italic">Loading match stats…</div>
                )}
              </div>

              {/* Wikipedia bio */}
              {(loading || wikiText) && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Profile
                  </h3>
                  {loading ? (
                    <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
                      <Loader2 className="w-4 h-4 animate-spin" /><span>Loading profile…</span>
                    </div>
                  ) : (
                    <motion.div
                      key={wikiText}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                      className="flex gap-3"
                    >
                      {wikiThumb && (
                        <img src={wikiThumb} alt={selectedPlayer?.name}
                          className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
                      )}
                      <p className="text-sm text-zinc-300 leading-relaxed">{wikiText}</p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setCopilotQuery(`Analyze ${selectedPlayer.name}'s playing style and WWC 2023 performance.`);
                    setContextPanelOpen(false);
                    onNavigateToCopilot?.();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 rounded-xl text-sm text-sky-200 font-medium transition-all"
                >
                  <Target className="w-4 h-4" />
                  Ask Co-Pilot about {selectedPlayer.nickname}
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-sm text-zinc-300 transition-all">
                  <Shield className="w-4 h-4 text-zinc-500" /> View full pass map
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
