import React, { useContext, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, Search, ArrowLeft, MessageSquare } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { DataContext } from '../../context/DataContext';
import { useAppContext } from '../../context/AppContext';

// ── constants ─────────────────────────────────────────────────────────────────

const CLUSTER_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6'];
const K = CLUSTER_COLORS.length;
const POS_FILTERS = ['All', 'GK', 'DEF', 'MID', 'FWD'] as const;
type PosFilter = typeof POS_FILTERS[number];
type Tab = 'cards' | 'rankings' | 'scatter';

const STAT_DEFS = [
  { key: 'xgPerMatch',            label: 'xG / match',        short: 'xG',     pct: false },
  { key: 'shotsPerMatch',         label: 'Shots / match',     short: 'Shots',  pct: false },
  { key: 'shotsOnTargetPerMatch', label: 'Shots on target',   short: 'SoT',    pct: false },
  { key: 'passVolume',            label: 'Passes / match',    short: 'Passes', pct: false },
  { key: 'passCompletion',        label: 'Pass completion',   short: 'Pass%',  pct: true  },
  { key: 'pressuresPerMatch',     label: 'Pressures / match', short: 'Press',  pct: false },
  { key: 'pressRate',             label: 'Press rate',        short: 'Press%', pct: true  },
];

// 6 stats used in the radar
const RADAR_STATS = [
  { key: 'xgPerMatch',            label: 'xG'     },
  { key: 'shotsOnTargetPerMatch', label: 'SoT'    },
  { key: 'passCompletion',        label: 'Pass%'  },
  { key: 'passVolume',            label: 'Vol'    },
  { key: 'pressuresPerMatch',     label: 'Press'  },
  { key: 'pressRate',             label: 'PressR' },
];

const POS_LABEL: Record<string, string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };

// ── helpers ───────────────────────────────────────────────────────────────────

function getPos(pos: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  const p = pos.toLowerCase();
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('back') || p.includes('defender') || p.includes('stopper') || p.includes('sweeper')) return 'DEF';
  if (p.includes('midfield')) return 'MID';
  return 'FWD';
}

function fmt(key: string, v: number) {
  const d = STAT_DEFS.find(s => s.key === key);
  if (!d) return v.toFixed(2);
  if (d.pct) return `${(v * 100).toFixed(0)}%`;
  return v < 1 ? v.toFixed(2) : v.toFixed(1);
}

function normalize(vals: number[]) {
  const min = Math.min(...vals), max = Math.max(...vals);
  if (max === min) return vals.map(() => 0);
  return vals.map(v => (v - min) / (max - min));
}

function kmeans(data: number[][], k: number, maxIter = 80) {
  const n = data.length, dims = data[0].length;
  const sorted = [...Array(n).keys()].sort((a, b) => data[b][0] - data[a][0]);
  let centroids = Array.from({ length: k }, (_, i) => [...data[sorted[Math.floor(i * n / k)]]]);
  let assignments = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0, minD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = centroids[c].reduce((s, v, dim) => s + (v - data[i][dim]) ** 2, 0);
        if (d < minD) { minD = d; best = c; }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    if (!changed) break;
    const sums = Array.from({ length: k }, () => new Array(dims).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) { data[i].forEach((v, d) => { sums[assignments[i]][d] += v; }); counts[assignments[i]]++; }
    for (let c = 0; c < k; c++) if (counts[c] > 0) centroids[c] = sums[c].map(s => s / counts[c]);
  }
  return assignments;
}

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return `${n}th`;
  const s = ['th', 'st', 'nd', 'rd'];
  return `${n}${s[n % 10] ?? 'th'}`;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function stripWomens(team: string): string {
  return team.replace(/\bWomen'?s\b/gi, '').replace(/\s{2,}/g, ' ').trim();
}

// ── types ─────────────────────────────────────────────────────────────────────

interface PlayerRow {
  name: string; team: string; position: string; posGroup: 'GK' | 'DEF' | 'MID' | 'FWD';
  jersey: number; country: string; id: number; matchId: number;
  passVolume: number; passCompletion: number; xgPerMatch: number;
  shotsPerMatch: number; shotsOnTargetPerMatch: number; pressuresPerMatch: number; pressRate: number;
  goalsPerMatch: number; dribbles: number;
  cluster?: number;
}

// ── SpiderChart ───────────────────────────────────────────────────────────────

function SpiderChart({ player, peers }: { player: PlayerRow; peers: PlayerRow[] }) {
  const N = RADAR_STATS.length;
  const cx = 120, cy = 120, r = 88;

  const pctVals = RADAR_STATS.map(s => {
    const vals = peers.map(p => (p as any)[s.key] as number).sort((a, b) => a - b);
    const myVal = (player as any)[s.key] as number;
    const below = vals.filter(v => v <= myVal).length;
    return below / Math.max(vals.length, 1);
  });

  function polar(idx: number, radius: number) {
    const angle = (2 * Math.PI * idx) / N - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }

  function toPoints(vals: number[]) {
    return vals.map((v, i) => { const p = polar(i, v * r); return `${p.x},${p.y}`; }).join(' ');
  }

  return (
    <svg width={240} height={240} viewBox="0 0 240 240">
      {/* Rings */}
      {[0.25, 0.5, 0.75, 1].map(level => (
        <polygon key={level} points={toPoints(Array(N).fill(level))}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      {/* Avg reference at 50th pct */}
      <polygon points={toPoints(Array(N).fill(0.5))}
        fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1} strokeDasharray="3 3" />
      {/* Axis lines */}
      {RADAR_STATS.map((_, i) => {
        const end = polar(i, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />;
      })}
      {/* Player polygon */}
      <polygon points={toPoints(pctVals)} fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth={1.5} />
      {/* Dots */}
      {pctVals.map((v, i) => {
        const p = polar(i, v * r);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill="#a78bfa" />;
      })}
      {/* Labels */}
      {RADAR_STATS.map((s, i) => {
        const p = polar(i, r + 16);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fill="#a1a1aa" fontSize={9} fontFamily="system-ui, sans-serif">{s.label}</text>
        );
      })}
    </svg>
  );
}

// ── PercentileBars ────────────────────────────────────────────────────────────

function PercentileBars({ player, peers }: { player: PlayerRow; peers: PlayerRow[] }) {
  return (
    <div className="space-y-3.5">
      {STAT_DEFS.map(s => {
        const vals = peers.map(p => (p as any)[s.key] as number).sort((a, b) => a - b);
        const myVal = (player as any)[s.key] as number;
        const pct = Math.round((vals.filter(v => v <= myVal).length / Math.max(vals.length, 1)) * 100);
        const isTop = pct >= 75;
        const isLow = pct <= 25;
        const barColor = isTop ? '#a78bfa' : isLow ? '#52525b' : '#6b7280';
        return (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-zinc-300">{s.short}</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: barColor }}>
                {ordinal(pct)} %ile
              </span>
            </div>
            <div className="h-[3px] rounded-full bg-white/[0.05] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-zinc-300 pt-1">vs {peers.length} {peers[0]?.posGroup ?? ''}s in WC 2022</p>
    </div>
  );
}

// ── MatchChart ────────────────────────────────────────────────────────────────

interface MatchStat { opp: string; xg: number; passes: number; pressures: number; passComp: number }

function MatchChart({ data }: { data: MatchStat[] }) {
  const [metric, setMetric] = useState<'xg' | 'passes' | 'pressures'>('xg');

  const METRICS = [
    { key: 'xg' as const, label: 'xG', color: '#a78bfa' },
    { key: 'passes' as const, label: 'Passes', color: '#38bdf8' },
    { key: 'pressures' as const, label: 'Pressures', color: '#10b981' },
  ];

  const active = METRICS.find(m => m.key === metric)!;
  const maxVal = Math.max(...data.map(d => d[metric]), 0.01);

  return (
    <div>
      {/* Metric toggle */}
      <div className="flex items-center gap-1 mb-5">
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: metric === m.key ? `${m.color}18` : 'transparent',
              color: metric === m.key ? m.color : '#52525b',
              border: `1px solid ${metric === m.key ? m.color + '44' : 'transparent'}`,
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {data.map((d, i) => {
          const h = Math.max((d[metric] / maxVal) * 100, 2);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
              <span className="text-[9px] tabular-nums" style={{ color: active.color }}>
                {metric === 'xg' ? d.xg.toFixed(2) : d[metric]}
              </span>
              <div className="w-full rounded-sm" style={{ height: `${h}%`, background: `${active.color}30`, border: `1px solid ${active.color}60` }} />
              <span className="text-[8px] text-zinc-300 truncate w-full text-center">{d.opp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PeerComparison ────────────────────────────────────────────────────────────

function PeerComparison({ player, peers }: { player: PlayerRow; peers: PlayerRow[] }) {
  const COMPARE_STATS = [
    { key: 'xgPerMatch', label: 'xG / match' },
    { key: 'passCompletion', label: 'Pass%' },
    { key: 'pressuresPerMatch', label: 'Pressures / match' },
    { key: 'shotsOnTargetPerMatch', label: 'SoT / match' },
  ];

  const avg: Record<string, number> = {};
  for (const s of COMPARE_STATS) {
    avg[s.key] = peers.reduce((sum, p) => sum + ((p as any)[s.key] as number), 0) / Math.max(peers.length, 1);
  }
  const top = peers.reduce((best, p) => {
    const bScore = ((best as any)['xgPerMatch'] + (best as any)['passCompletion']) / 2;
    const pScore = ((p as any)['xgPerMatch'] + (p as any)['passCompletion']) / 2;
    return pScore > bScore ? p : best;
  }, peers[0]);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#a78bfa]" /><span className="text-zinc-300">{player.name.split(' ').slice(-1)[0]}</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/20" /><span className="text-zinc-400">Avg {POS_LABEL[player.posGroup]}</span></div>
        {top && top.name !== player.name && (
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]" /><span className="text-zinc-400">{top.name.split(' ').slice(-1)[0]} (top)</span></div>
        )}
      </div>

      {COMPARE_STATS.map(s => {
        const myVal = (player as any)[s.key] as number;
        const avgVal = avg[s.key];
        const topVal = top ? (top as any)[s.key] as number : 0;
        const maxVal = Math.max(myVal, avgVal, topVal, 0.001);
        return (
          <div key={s.key}>
            <p className="text-[10px] text-zinc-400 mb-1.5">{s.label}</p>
            <div className="space-y-1.5">
              {/* Player bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-[6px] rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-[#a78bfa]" style={{ width: `${(myVal / maxVal) * 100}%` }} />
                </div>
                <span className="text-[10px] text-[#a78bfa] tabular-nums w-10 text-right">{fmt(s.key, myVal)}</span>
              </div>
              {/* Avg bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-[6px] rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-white/20" style={{ width: `${(avgVal / maxVal) * 100}%` }} />
                </div>
                <span className="text-[10px] text-zinc-400 tabular-nums w-10 text-right">{fmt(s.key, avgVal)}</span>
              </div>
              {/* Top bar */}
              {top && top.name !== player.name && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[6px] rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-[#f59e0b]/60" style={{ width: `${(topVal / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-[#f59e0b]/70 tabular-nums w-10 text-right">{fmt(s.key, topVal)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ScatterTooltip ────────────────────────────────────────────────────────────

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-2xl">
      <p className="font-semibold text-white mb-0.5">{d.name}</p>
      <p className="text-zinc-300 mb-1.5">{d.team}</p>
      <p className="text-zinc-400">xG/match <span className="text-white ml-1">{d.xgPerMatch.toFixed(2)}</span></p>
      <p className="text-zinc-400">Pass% <span className="text-white ml-1">{Math.round(d.passCompletion * 100)}%</span></p>
      <p className="text-zinc-300 text-[10px] mt-1.5">click to view profile</p>
    </div>
  );
}

// ── PlayerCard ────────────────────────────────────────────────────────────────

function PlayerCard({ p, onClick }: { p: PlayerRow; onClick?: () => void }) {
  const initials = p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      onClick={onClick}
      className="rounded-xl overflow-hidden flex flex-col cursor-pointer"
      style={{ width: 160, height: 188, flexShrink: 0, background: '#000', border: '1px solid rgba(255,255,255,0.14)', transition: 'border-color 0.15s, transform 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.32)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLDivElement).style.transform = ''; }}
    >
      <div className="flex justify-center" style={{ paddingTop: 28, paddingBottom: 12 }}>
        <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-sm font-bold text-white/60" style={{ flexShrink: 0 }}>
          {p.jersey || initials}
        </div>
      </div>
      <div style={{ padding: '0 16px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>{p.name}</p>
        <p style={{ fontSize: 10, color: '#a1a1aa', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.team}</p>
        <p style={{ fontSize: 10, color: '#71717a', marginTop: 6 }}>{p.posGroup}</p>
      </div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-4">{children}</p>;
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function ScoutPage() {
  const { tournamentStats } = useContext(DataContext);
  const { setCopilotQuery } = useAppContext();

  const [tab, setTab] = useState<Tab>('cards');
  const [posFilter, setPosFilter] = useState<PosFilter>('All');
  const [search, setSearch] = useState('');
  const [rankStat, setRankStat] = useState('xgPerMatch');
  const [scatterX, setScatterX] = useState('passCompletion');
  const [scatterY, setScatterY] = useState('xgPerMatch');
  const [selected, setSelected] = useState<string | null>(null);
  const [wikiText, setWikiText] = useState('');
  const [wikiThumb, setWikiThumb] = useState('');
  const [wikiLoading, setWikiLoading] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const wikiCache = useRef<Map<string, { text: string; thumb: string }>>(new Map());

  // ── build player rows from WWC 2023 tournament stats ────────────────────

  const allPlayers = useMemo<PlayerRow[]>(() => {
    if (!tournamentStats.length) return [];

    const raw: PlayerRow[] = tournamentStats
      .filter(s => s.matches_played > 0 && s.minutes_played > 0)
      .map(s => {
        const m = Math.max(s.matches_played, 1);
        const totalActions = s.passes + s.shots + s.pressures;
        return {
          name:                  s.player_name,
          team:                  stripWomens(s.team),
          position:              s.position ?? '',
          posGroup:              getPos(s.position ?? ''),
          jersey:                0,
          country:               '',
          id:                    s.player_id,
          matchId:               0,
          passVolume:            s.passes / m,
          passCompletion:        s.pass_pct ?? (s.passes > 0 ? s.passes_complete / s.passes : 0),
          xgPerMatch:            s.xg / m,
          shotsPerMatch:         s.shots / m,
          shotsOnTargetPerMatch: s.shots_on_target / m,
          pressuresPerMatch:     s.pressures / m,
          pressRate:             totalActions > 0 ? s.pressures / totalActions : 0,
          goalsPerMatch:         s.goals / m,
          dribbles:              s.dribbles_complete,
        };
      });

    if (!raw.length) return [];

    const norms = [
      normalize(raw.map(r => r.passCompletion)),
      normalize(raw.map(r => r.xgPerMatch)),
      normalize(raw.map(r => r.pressRate)),
      normalize(raw.map(r => r.passVolume)),
    ];
    const features = raw.map((_, i) => norms.map(n => n[i]));
    const clusters = kmeans(features, K);
    return raw.map((r, i) => ({ ...r, cluster: clusters[i] }));
  }, [tournamentStats]);

  const filtered = useMemo(() =>
    allPlayers
      .filter(p => posFilter === 'All' || p.posGroup === posFilter)
      .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase())),
    [allPlayers, posFilter, search]
  );

  const maxStatVal = useMemo(() => Math.max(...filtered.map(p => (p as any)[rankStat] ?? 0), 0.001), [filtered, rankStat]);
  const selectedPlayer = useMemo(() => allPlayers.find(p => p.name === selected) ?? null, [allPlayers, selected]);
  const positionPeers = useMemo(() => selectedPlayer ? allPlayers.filter(p => p.posGroup === selectedPlayer.posGroup) : [], [allPlayers, selectedPlayer]);

  // League history not available from tournament aggregates — stub empty
  const leagueRows: any[] = [];

  // Per-match breakdown not available from tournament aggregates — stub empty
  const playerMatchStats: MatchStat[] = [];

  const scatterByCluster = useMemo(() =>
    CLUSTER_COLORS.map((_, c) => filtered.filter(p => p.cluster === c).map(p => ({ ...p, x: (p as any)[scatterX], y: (p as any)[scatterY] }))),
    [filtered, scatterX, scatterY]
  );

  const centroids = useMemo(() =>
    CLUSTER_COLORS.map((_, c) => {
      const pts = allPlayers.filter(p => p.cluster === c);
      if (!pts.length) return null;
      return { n: pts.length, comp: pts.reduce((s, p) => s + p.passCompletion, 0) / pts.length, xg: pts.reduce((s, p) => s + p.xgPerMatch, 0) / pts.length, press: pts.reduce((s, p) => s + p.pressRate, 0) / pts.length };
    }),
    [allPlayers]
  );

  // ── wiki fetch ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selected) return;
    const cached = wikiCache.current.get(selected);
    if (cached) { setWikiText(cached.text); setWikiThumb(cached.thumb); return; }
    setWikiText(''); setWikiThumb(''); setWikiLoading(true);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selected.replace(/ /g, '_'))}`)
      .then(r => r.json()).then(d => {
        if (d.type === 'disambiguation' || !d.extract) return;
        const text = d.extract.split('. ').slice(0, 3).join('. ') + '.';
        const thumb = d.thumbnail?.source ?? '';
        setWikiText(text); setWikiThumb(thumb);
        wikiCache.current.set(selected, { text, thumb });
      }).catch(() => {}).finally(() => setWikiLoading(false));
  }, [selected]);

  const interpretClusters = useCallback(async () => {
    setInterpreting(true); setInterpretation('');
    const summary = centroids.map((c, i) => c ? `Group ${i + 1} (${c.n} players): pass% ${(c.comp * 100).toFixed(0)}%, xG/match ${c.xg.toFixed(2)}, press rate ${(c.press * 100).toFixed(0)}%` : null).filter(Boolean).join('\n');
    try {
      const res = await fetch('/api/langgraph', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Analyze ${K} WC 2022 player clusters:\n${summary}\nFor each group: **Group N** + 3-5 word role label + one sharp tactical sentence.`, mode: 'agent', history: [] }) });
      setInterpretation((await res.json()).final_response || '');
    } catch { setInterpretation('Unavailable.'); }
    finally { setInterpreting(false); }
  }, [centroids]);

  if (!allPlayers.length) return <div className="flex items-center justify-center h-64 text-zinc-300 text-sm">Loading…</div>;

  // ── toolbar ───────────────────────────────────────────────────────────────

  const toolbar = !selected && (
    <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
      <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5">
        {POS_FILTERS.map(f => (
          <button key={f} onClick={() => setPosFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${posFilter === f ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-400'}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg flex-1 min-w-[180px] max-w-xs">
        <Search className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player or team…" className="bg-transparent text-xs text-white placeholder-zinc-500 outline-none w-full" />
      </div>
      {tab === 'rankings' && (
        <select value={rankStat} onChange={e => setRankStat(e.target.value)}
          className="bg-black border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none">
          {STAT_DEFS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      )}
      <span className="text-xs text-zinc-300 ml-auto">{filtered.length} players</span>
    </div>
  );

  // ── DETAIL VIEW ───────────────────────────────────────────────────────────

  if (selected && selectedPlayer) {
    const p = selectedPlayer;
    const initials = p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    return (
      <AnimatePresence mode="wait">
        <motion.div key={p.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          className="bg-black rounded-2xl border border-white/[0.06] overflow-hidden">

          {/* Back */}
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-2 px-6 py-4 text-xs text-zinc-400 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Scout
          </button>

          {/* ── Hero banner ── */}
          <div className="relative w-full overflow-hidden" style={{ minHeight: 240 }}>
            {wikiThumb && (
              <div className="absolute inset-0"
                style={{ backgroundImage: `url(${wikiThumb})`, backgroundSize: 'cover', backgroundPosition: 'center top', filter: 'blur(40px) brightness(0.2)', transform: 'scale(1.1)' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-black" />
            <div className="relative z-10 flex items-end gap-8 px-8 pb-8 pt-6">
              <div className="shrink-0">
                {wikiLoading ? (
                  <div className="w-36 h-36 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                  </div>
                ) : wikiThumb ? (
                  <img src={wikiThumb} alt={p.name} className="w-36 h-36 rounded-2xl object-cover object-top" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                ) : (
                  <div className="w-36 h-36 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-4xl font-black text-white/20">{initials}</div>
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest border border-white/[0.08] px-2 py-0.5 rounded">
                    {POS_LABEL[p.posGroup] ?? p.posGroup}
                  </span>
                  <span className="text-[10px] text-zinc-400">{p.country}</span>
                  {p.jersey > 0 && <span className="text-[10px] text-zinc-300">#{p.jersey}</span>}
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-1">{p.name}</h1>
                <p className="text-sm text-zinc-300">{p.team} · WC 2022</p>
                {wikiText && <p className="text-sm text-zinc-400 leading-relaxed mt-4 max-w-2xl">{wikiText}</p>}
              </div>
            </div>
          </div>

          {/* ── Analytics body ── */}
          <div className="px-8 py-8 space-y-10">

            {/* Row 1: Radar + Percentiles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <SectionLabel>Position Profile</SectionLabel>
                <div className="flex flex-col items-center">
                  <SpiderChart player={p} peers={positionPeers} />
                  <p className="text-[10px] text-zinc-300 mt-1">Percentile vs {positionPeers.length} {POS_LABEL[p.posGroup]}s · dashed = 50th %ile</p>
                </div>
              </div>
              <div>
                <SectionLabel>Percentile Rankings</SectionLabel>
                <PercentileBars player={p} peers={positionPeers} />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.04]" />

            {/* Row 2: Match by match */}
            {playerMatchStats.length > 0 && (
              <div>
                <SectionLabel>Match by Match</SectionLabel>
                <MatchChart data={playerMatchStats} />
              </div>
            )}

            {/* Divider */}
            {playerMatchStats.length > 0 && <div className="border-t border-white/[0.04]" />}

            {/* Row 3: Peer comparison */}
            {positionPeers.length > 1 && (
              <div>
                <SectionLabel>vs. Position Peers</SectionLabel>
                <PeerComparison player={p} peers={positionPeers} />
              </div>
            )}

            {/* League history */}
            {leagueRows.length > 0 && (
              <>
                <div className="border-t border-white/[0.04]" />
                <div>
                  <SectionLabel>League History</SectionLabel>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    {leagueRows.slice(0, 5).map((r: any, i: number) => (
                      <div key={i} className="flex items-center gap-6 px-5 py-4"
                        style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{r.club ?? '—'}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{r.league} · {r.season}</p>
                        </div>
                        <div className="flex items-center gap-8 shrink-0">
                          {[['Goals', r.goals], ['Assists', r.assists], ['Apps', r.appearances]].map(([label, val]) => (
                            <div key={label as string} className="text-right">
                              <p className="text-sm font-bold text-white">{val ?? '—'}</p>
                              <p className="text-[10px] text-zinc-300 uppercase tracking-wide">{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Co-Pilot CTA */}
            <button
              onClick={() => setCopilotQuery(`Analyze ${p.name}'s playing style and WC 2022 performance. They had ${fmt('xgPerMatch', p.xgPerMatch)} xG/match, ${fmt('passCompletion', p.passCompletion)} pass completion, and ${fmt('pressuresPerMatch', p.pressuresPerMatch)} pressures/match. Give a sharp tactical profile.`)}
              className="flex items-center gap-2 px-5 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/20 rounded-xl text-sm text-green-300 font-medium transition-all">
              <MessageSquare className="w-4 h-4" />
              Ask Co-Pilot about {p.name}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── CARDS view ────────────────────────────────────────────────────────────

  const cardsView = (
    <div className="px-6 pb-6 flex flex-wrap gap-2.5">
      {filtered.map(p => (
        <PlayerCard key={p.name} p={p} onClick={() => setSelected(p.name)} />
      ))}
    </div>
  );

  // ── RANKINGS view ─────────────────────────────────────────────────────────

  const rankingsView = (
    <div>
      {[...filtered].sort((a, b) => (b as any)[rankStat] - (a as any)[rankStat]).slice(0, 40).map((p, i) => {
        const val = (p as any)[rankStat] as number;
        const barPct = (val / maxStatVal) * 100;
        return (
          <div key={p.name} onClick={() => setSelected(p.name)}
            className="flex items-center gap-4 px-6 py-3 cursor-pointer group transition-colors hover:bg-white/[0.02]"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span className="w-5 text-xs text-zinc-300 text-right shrink-0 tabular-nums">{i + 1}</span>
            <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-xs text-zinc-300 shrink-0">
              {p.jersey || p.name[0]}
            </div>
            <div className="w-44 shrink-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-zinc-200 transition-colors">{p.name}</p>
              <p className="text-[11px] text-zinc-300 truncate">{p.team}</p>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 rounded-full bg-white/[0.06] overflow-hidden" style={{ height: 2 }}>
                <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${barPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-white w-12 text-right shrink-0 tabular-nums">{fmt(rankStat, val)}</span>
            </div>
            <span className="text-[10px] text-zinc-400 w-8 text-right shrink-0">{p.posGroup}</span>
          </div>
        );
      })}
    </div>
  );

  // ── SCATTER view ──────────────────────────────────────────────────────────

  const scatterView = (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {[{ label: 'X', val: scatterX, set: setScatterX }, { label: 'Y', val: scatterY, set: setScatterY }].map(({ label, val, set }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{label} axis</span>
            <select value={val} onChange={e => set(e.target.value)} className="bg-black border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none">
              {STAT_DEFS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        ))}
        <button onClick={interpretClusters} disabled={interpreting}
          className="ml-auto flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/20 rounded-lg text-xs text-green-300 font-medium transition-all disabled:opacity-40">
          {interpreting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Interpret clusters
        </button>
      </div>
      <div className="flex flex-wrap gap-4 mb-5">
        {CLUSTER_COLORS.map((color, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-300">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            Group {i + 1}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 28, left: 0 }}>
          <CartesianGrid strokeDasharray="1 4" stroke="#111" />
          <XAxis dataKey="x" type="number" stroke="#111" tick={{ fill: '#71717a', fontSize: 10 }}
            label={{ value: STAT_DEFS.find(s => s.key === scatterX)?.label, position: 'insideBottom', offset: -14, fill: '#71717a', fontSize: 10 }} />
          <YAxis dataKey="y" type="number" stroke="#111" tick={{ fill: '#71717a', fontSize: 10 }}
            label={{ value: STAT_DEFS.find(s => s.key === scatterY)?.label, angle: -90, position: 'insideLeft', offset: 14, fill: '#71717a', fontSize: 10 }} />
          <Tooltip content={<ScatterTooltip />} cursor={{ stroke: '#1f1f1f' }} />
          {scatterByCluster.map((pts, c) => (
            <Scatter key={c} data={pts} shape={(props: any) => (
              <circle cx={props.cx} cy={props.cy} r={4.5} fill={CLUSTER_COLORS[c]} fillOpacity={0.75}
                stroke="none" style={{ cursor: 'pointer' }}
                onClick={() => setSelected(props.payload?.name)} />
            )} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      {(interpretation || interpreting) && (
        <div className="mt-6 pt-6 border-t border-white/[0.04]">
          <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest mb-3">Cluster Analysis</p>
          {interpreting
            ? <div className="flex items-center gap-2 text-zinc-300 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Interpreting…</div>
            : <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-zinc-400 leading-relaxed">{interpretation}</motion.p>}
        </div>
      )}
    </div>
  );

  // ── shell ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-black rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Scout</h2>
        <p className="text-xs text-zinc-300 mt-0.5">WC 2022 knockout stage · {filtered.length} players</p>
      </div>
      <div className="flex items-center border-b border-white/[0.05] px-6 mb-4">
        {(['cards', 'rankings', 'scatter'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold capitalize transition-all relative ${tab === t ? 'text-white' : 'text-zinc-400 hover:text-zinc-400'}`}>
            {t}
            {tab === t && <motion.div layoutId="scout-tab" className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
          </button>
        ))}
      </div>
      {toolbar}
      {tab === 'cards'    && cardsView}
      {tab === 'rankings' && rankingsView}
      {tab === 'scatter'  && scatterView}
    </div>
  );
}
