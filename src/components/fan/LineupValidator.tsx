import { useState, useMemo } from 'react';
import { Search, X, BarChart3, Loader2, RotateCcw, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Player DB (shared stat schema with GoatBuilder) ──────────────────────────

type Pos = 'GK' | 'DEF' | 'MID' | 'FWD';
interface Player { id: string; name: string; flag: string; country: string; position: Pos; passing: number; shooting: number; pressing: number; physicality: number; pace: number; }

const PLAYERS: Player[] = [
  { id:'messi',      name:'Lionel Messi',       flag:'🇦🇷', country:'Argentina',   position:'FWD', passing:96, shooting:94, pressing:62, physicality:68, pace:78 },
  { id:'mbappe',     name:'Kylian Mbappé',      flag:'🇫🇷', country:'France',      position:'FWD', passing:80, shooting:92, pressing:74, physicality:78, pace:99 },
  { id:'modric',     name:'Luka Modrić',        flag:'🇭🇷', country:'Croatia',     position:'MID', passing:93, shooting:76, pressing:80, physicality:65, pace:72 },
  { id:'amrabat',    name:'Sofyan Amrabat',     flag:'🇲🇦', country:'Morocco',     position:'MID', passing:72, shooting:62, pressing:93, physicality:85, pace:76 },
  { id:'hakimi',     name:'Achraf Hakimi',      flag:'🇲🇦', country:'Morocco',     position:'DEF', passing:78, shooting:72, pressing:80, physicality:76, pace:93 },
  { id:'gvardiol',   name:'Joško Gvardiol',     flag:'🇭🇷', country:'Croatia',     position:'DEF', passing:72, shooting:65, pressing:82, physicality:90, pace:83 },
  { id:'giroud',     name:'Olivier Giroud',     flag:'🇫🇷', country:'France',      position:'FWD', passing:72, shooting:88, pressing:76, physicality:91, pace:64 },
  { id:'alvarez',    name:'Julián Álvarez',     flag:'🇦🇷', country:'Argentina',   position:'FWD', passing:76, shooting:87, pressing:85, physicality:77, pace:82 },
  { id:'bellingham', name:'Jude Bellingham',    flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', country:'England',     position:'MID', passing:87, shooting:84, pressing:88, physicality:84, pace:83 },
  { id:'pedri',      name:'Pedri',              flag:'🇪🇸', country:'Spain',       position:'MID', passing:89, shooting:76, pressing:82, physicality:67, pace:74 },
  { id:'macallister',name:'Mac Allister',       flag:'🇦🇷', country:'Argentina',   position:'MID', passing:85, shooting:78, pressing:86, physicality:74, pace:76 },
  { id:'dembele',    name:'Ousmane Dembélé',    flag:'🇫🇷', country:'France',      position:'FWD', passing:75, shooting:82, pressing:72, physicality:68, pace:96 },
  { id:'upamecano',  name:'D. Upamecano',       flag:'🇫🇷', country:'France',      position:'DEF', passing:70, shooting:60, pressing:78, physicality:88, pace:82 },
  { id:'militao',    name:'Éder Militão',       flag:'🇧🇷', country:'Brazil',      position:'DEF', passing:72, shooting:62, pressing:80, physicality:87, pace:80 },
  { id:'theo',       name:'Theo Hernández',     flag:'🇫🇷', country:'France',      position:'DEF', passing:75, shooting:70, pressing:76, physicality:80, pace:91 },
  { id:'lloris',     name:'Hugo Lloris',        flag:'🇫🇷', country:'France',      position:'GK',  passing:68, shooting:40, pressing:55, physicality:72, pace:52 },
  { id:'alisson',    name:'Alisson Becker',     flag:'🇧🇷', country:'Brazil',      position:'GK',  passing:74, shooting:40, pressing:60, physicality:75, pace:55 },
  { id:'livakovic',  name:'D. Livakovic',       flag:'🇭🇷', country:'Croatia',     position:'GK',  passing:65, shooting:40, pressing:58, physicality:70, pace:50 },
  { id:'putellas',   name:'Alexia Putellas',    flag:'🇪🇸', country:'Spain',       position:'MID', passing:95, shooting:84, pressing:82, physicality:72, pace:76 },
  { id:'kerr',       name:'Sam Kerr',           flag:'🇦🇺', country:'Australia',   position:'FWD', passing:74, shooting:95, pressing:80, physicality:90, pace:82 },
  { id:'bonmati',    name:'Aitana Bonmatí',     flag:'🇪🇸', country:'Spain',       position:'MID', passing:93, shooting:80, pressing:88, physicality:68, pace:82 },
  { id:'harder',     name:'Pernille Harder',    flag:'🇩🇰', country:'Denmark',     position:'MID', passing:86, shooting:86, pressing:82, physicality:85, pace:80 },
  { id:'caicedo',    name:'Linda Caicedo',      flag:'🇨🇴', country:'Colombia',    position:'FWD', passing:79, shooting:88, pressing:75, physicality:72, pace:86 },
  { id:'marta',      name:'Marta',              flag:'🇧🇷', country:'Brazil',      position:'FWD', passing:84, shooting:93, pressing:75, physicality:72, pace:88 },
  { id:'renard',     name:'Wendie Renard',      flag:'🇫🇷', country:'France',      position:'DEF', passing:76, shooting:74, pressing:79, physicality:93, pace:68 },
  { id:'oshoala',    name:'Asisat Oshoala',     flag:'🇳🇬', country:'Nigeria',     position:'FWD', passing:72, shooting:89, pressing:76, physicality:86, pace:90 },
  { id:'earps',      name:'Mary Earps',         flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', country:'England',     position:'GK',  passing:65, shooting:40, pressing:70, physicality:78, pace:62 },
];

// ── Formation definitions ────────────────────────────────────────────────────

// Each slot: { role, pos, x, y } — x,y in 0-1 pitch coords (0,0=bottom-left, attack=top)
interface Slot { role: string; pos: Pos; x: number; y: number; }

const FORMATIONS: Record<string, Slot[]> = {
  '4-3-3': [
    { role:'GK',  pos:'GK',  x:0.50, y:0.04 },
    { role:'LB',  pos:'DEF', x:0.15, y:0.22 }, { role:'LCB', pos:'DEF', x:0.35, y:0.18 },
    { role:'RCB', pos:'DEF', x:0.65, y:0.18 }, { role:'RB',  pos:'DEF', x:0.85, y:0.22 },
    { role:'LCM', pos:'MID', x:0.25, y:0.44 }, { role:'CM',  pos:'MID', x:0.50, y:0.42 }, { role:'RCM', pos:'MID', x:0.75, y:0.44 },
    { role:'LW',  pos:'FWD', x:0.18, y:0.72 }, { role:'ST',  pos:'FWD', x:0.50, y:0.78 }, { role:'RW',  pos:'FWD', x:0.82, y:0.72 },
  ],
  '4-4-2': [
    { role:'GK',  pos:'GK',  x:0.50, y:0.04 },
    { role:'LB',  pos:'DEF', x:0.12, y:0.22 }, { role:'LCB', pos:'DEF', x:0.35, y:0.18 },
    { role:'RCB', pos:'DEF', x:0.65, y:0.18 }, { role:'RB',  pos:'DEF', x:0.88, y:0.22 },
    { role:'LM',  pos:'MID', x:0.12, y:0.48 }, { role:'LCM', pos:'MID', x:0.37, y:0.44 },
    { role:'RCM', pos:'MID', x:0.63, y:0.44 }, { role:'RM',  pos:'MID', x:0.88, y:0.48 },
    { role:'ST1', pos:'FWD', x:0.35, y:0.74 }, { role:'ST2', pos:'FWD', x:0.65, y:0.74 },
  ],
  '3-5-2': [
    { role:'GK',  pos:'GK',  x:0.50, y:0.04 },
    { role:'LCB', pos:'DEF', x:0.22, y:0.20 }, { role:'CB',  pos:'DEF', x:0.50, y:0.17 }, { role:'RCB', pos:'DEF', x:0.78, y:0.20 },
    { role:'LWB', pos:'DEF', x:0.08, y:0.46 }, { role:'LCM', pos:'MID', x:0.30, y:0.46 },
    { role:'CM',  pos:'MID', x:0.50, y:0.50 }, { role:'RCM', pos:'MID', x:0.70, y:0.46 }, { role:'RWB', pos:'DEF', x:0.92, y:0.46 },
    { role:'ST1', pos:'FWD', x:0.35, y:0.76 }, { role:'ST2', pos:'FWD', x:0.65, y:0.76 },
  ],
  '4-2-3-1': [
    { role:'GK',  pos:'GK',  x:0.50, y:0.04 },
    { role:'LB',  pos:'DEF', x:0.12, y:0.22 }, { role:'LCB', pos:'DEF', x:0.37, y:0.18 },
    { role:'RCB', pos:'DEF', x:0.63, y:0.18 }, { role:'RB',  pos:'DEF', x:0.88, y:0.22 },
    { role:'LDM', pos:'MID', x:0.35, y:0.40 }, { role:'RDM', pos:'MID', x:0.65, y:0.40 },
    { role:'LW',  pos:'MID', x:0.15, y:0.60 }, { role:'CAM', pos:'MID', x:0.50, y:0.62 }, { role:'RW',  pos:'MID', x:0.85, y:0.60 },
    { role:'ST',  pos:'FWD', x:0.50, y:0.82 },
  ],
};

// Which slot indices are "adjacent" (will have LIM edges)
const EDGES: Record<string, [number,number][]> = {
  '4-3-3': [[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[1,5],[2,5],[2,6],[3,6],[3,7],[4,7],[5,6],[6,7],[5,8],[6,8],[6,9],[6,10],[7,10],[8,9],[9,10]],
  '4-4-2': [[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[1,5],[2,6],[3,7],[4,8],[5,6],[7,8],[5,9],[6,9],[7,10],[8,10],[9,10]],
  '3-5-2': [[0,1],[0,2],[0,3],[1,2],[2,3],[1,4],[3,8],[4,5],[5,6],[6,7],[7,8],[4,9],[5,9],[6,9],[6,10],[7,10],[8,10],[9,10]],
  '4-2-3-1': [[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[1,5],[2,5],[3,6],[4,6],[5,7],[5,8],[6,8],[6,9],[7,8],[8,9],[7,10],[8,10],[9,10]],
};

// ── LIM computation ──────────────────────────────────────────────────────────

function edgeWeight(a: Player, b: Player): number {
  const passComp = (a.passing + b.passing) / 200;
  const pressComp = 1 - Math.abs(a.pressing - b.pressing) / 100;
  const physComp = (a.physicality + b.physicality) / 200;
  return Math.round((passComp * 0.45 + pressComp * 0.35 + physComp * 0.20) * 100);
}

function cohesionScore(edges: Array<{ w: number }>): number {
  if (!edges.length) return 0;
  return Math.round(edges.reduce((s, e) => s + e.w, 0) / edges.length);
}

function ballKnowledge(lineup: (Player|null)[]): number {
  const filled = lineup.filter(Boolean) as Player[];
  if (filled.length < 11) return 0;
  const avgPassing = filled.reduce((s, p) => s + p.passing, 0) / 11;
  const avgPress = filled.reduce((s, p) => s + p.pressing, 0) / 11;
  const diversity = new Set(filled.map(p => p.country)).size;
  const raw = avgPassing * 0.5 + avgPress * 0.3 + diversity * 2;
  return Math.min(99, Math.round((raw / 92) * 99));
}

// ── Pitch SVG ────────────────────────────────────────────────────────────────

const W = 340, H = 480;
function px(x: number) { return x * W; }
function py(y: number) { return H - y * H; }

function PitchMarkings() {
  return (
    <g stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none">
      <rect x={0} y={0} width={W} height={H} fill="#1a3a1a" rx="4" />
      {/* Halfway */}
      <line x1={0} y1={H/2} x2={W} y2={H/2} />
      <circle cx={W/2} cy={H/2} r={40} />
      {/* Centre spot */}
      <circle cx={W/2} cy={H/2} r={2} fill="rgba(255,255,255,0.3)" />
      {/* Penalty areas */}
      <rect x={W*0.18} y={0} width={W*0.64} height={H*0.17} />
      <rect x={W*0.18} y={H*0.83} width={W*0.64} height={H*0.17} />
      {/* Goal areas */}
      <rect x={W*0.33} y={0} width={W*0.34} height={H*0.07} />
      <rect x={W*0.33} y={H*0.93} width={W*0.34} height={H*0.07} />
      {/* Corner arcs */}
      {[[0,0],[W,0],[0,H],[W,H]].map(([cx,cy],i) => (
        <path key={i} d={`M ${cx} ${cy+8} A 8 8 0 0 ${cx>0?0:1} ${cx+8} ${cy}`} />
      ))}
    </g>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Analysis { cohesion: number; bk: number; edgeData: Array<{ i:number; j:number; w:number }>; narrative: string; }

export default function LineupValidator() {
  const [formation, setFormation] = useState<string>('4-3-3');
  const [lineup, setLineup] = useState<(Player|null)[]>(Array(11).fill(null));
  const [activeSlot, setActiveSlot] = useState<number|null>(null);
  const [search, setSearch] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis|null>(null);

  const slots = FORMATIONS[formation];
  const edges = EDGES[formation];

  const filledCount = lineup.filter(Boolean).length;

  const edgeData = useMemo(() => {
    return edges.map(([i,j]) => {
      const a = lineup[i], b = lineup[j];
      return { i, j, w: a && b ? edgeWeight(a, b) : 50 };
    });
  }, [lineup, edges]);

  const minW = Math.min(...edgeData.map(e => e.w));

  function switchFormation(f: string) {
    setFormation(f);
    setLineup(Array(11).fill(null));
    setAnalysis(null);
    setActiveSlot(null);
  }

  function assignPlayer(p: Player) {
    if (activeSlot === null) return;
    const next = [...lineup];
    // Remove from other slot if already assigned
    const existing = next.findIndex(x => x?.id === p.id);
    if (existing !== -1) next[existing] = null;
    next[activeSlot] = p;
    setLineup(next);
    setActiveSlot(null);
    setSearch('');
    setAnalysis(null);
  }

  function removePlayer(i: number) {
    const next = [...lineup]; next[i] = null;
    setLineup(next); setAnalysis(null);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const usedIds = new Set(lineup.filter(Boolean).map(p => p!.id));
    return PLAYERS.filter(p => !usedIds.has(p.id) && (
      !q || p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    ));
  }, [search, lineup]);

  async function analyze() {
    if (filledCount < 11) return;
    setAnalyzing(true);
    setAnalysis(null);

    const cohesion = cohesionScore(edgeData);
    const bk = ballKnowledge(lineup);
    const weakLinks = edgeData.filter(e => e.w === minW).map(e => ({
      a: lineup[e.i]?.name, b: lineup[e.j]?.name, w: e.w
    }));

    const prompt = `Football lineup analysis. Formation: ${formation}. Players: ${lineup.map((p,i) => `${slots[i].role}: ${p?.name??'?'}`).join(', ')}. Network cohesion: ${cohesion}/100. Ball knowledge percentile: ${bk}th. Weakest link: ${weakLinks[0]?.a} ↔ ${weakLinks[0]?.b} (${weakLinks[0]?.w}). Write 2 punchy sentences of expert analysis. Name specific players. No bullet points. JSON only: {"narrative": "..."}`;

    let narrative = `This lineup shows a cohesion score of ${cohesion} — ${cohesion > 70 ? 'a well-connected unit with strong passing triangles throughout' : 'with fragmentation risk around the ' + (weakLinks[0]?.a ?? 'midfield') + ' connection'}. The ${bk}th percentile ball knowledge score suggests ${bk > 70 ? 'these are manager-level choices that match historical tournament decisions' : 'some unconventional selections that diverge from proven tournament patterns'}.`;

    try {
      const res = await fetch('/api/langgraph', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message:prompt, mode:'agent', history:[] }) });
      const data = await res.json();
      const m = (data.final_response||'').match(/\{[\s\S]*\}/);
      if (m) narrative = JSON.parse(m[0]).narrative ?? narrative;
    } catch { /* use fallback */ }

    setAnalysis({ cohesion, bk, edgeData, narrative });
    setAnalyzing(false);
  }

  function reset() { setLineup(Array(11).fill(null)); setAnalysis(null); setActiveSlot(null); }

  const edgeColor = (w: number, min: number) => {
    const isWeak = w === min && w < 65;
    if (isWeak) return '#ef4444';
    if (w >= 80) return '#22c55e';
    if (w >= 65) return '#eab308';
    return '#f97316';
  };

  return (
    <div className="h-full overflow-auto p-6">
      <style>{`
        .lv-scroll::-webkit-scrollbar{width:4px;} .lv-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
        @keyframes lv-pulse{0%,100%{opacity:0.6;}50%{opacity:1;}}
        @keyframes lv-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Lineup Validator</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Build your XI. See the network. Find the weak link.</p>
        </div>
        <div className="flex items-center gap-2">
          {lineup.some(Boolean) && (
            <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-white text-xs transition-colors">
              <RotateCcw size={11} /> Reset
            </button>
          )}
          <button onClick={analyze} disabled={filledCount < 11 || analyzing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all border-none cursor-pointer"
            style={{ background: filledCount === 11 ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.05)', color: filledCount === 11 ? '#fff' : 'rgba(255,255,255,0.25)', boxShadow: filledCount===11?'0 0 16px rgba(124,58,237,0.35)':'none' }}>
            {analyzing ? <><Loader2 size={13} style={{animation:'lv-spin 1s linear infinite'}}/> Analyzing…</> : <><BarChart3 size={13}/> Analyze ({filledCount}/11)</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[340px_1fr] gap-5 items-start">

        {/* ── Pitch ── */}
        <div>
          {/* Formation picker */}
          <div className="flex gap-1.5 mb-3">
            {Object.keys(FORMATIONS).map(f => (
              <button key={f} onClick={() => switchFormation(f)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer"
                style={{ background: formation===f?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.03)', borderColor: formation===f?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.06)', color: formation===f?'#a78bfa':'rgba(255,255,255,0.4)' }}>
                {f}
              </button>
            ))}
          </div>

          {/* SVG Pitch */}
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ borderRadius:8, display:'block' }}>
            <PitchMarkings />

            {/* Edges */}
            {edgeData.map(({ i, j, w }) => {
              const a = slots[i], b = slots[j];
              const color = edgeColor(w, minW);
              const isWeak = color === '#ef4444';
              return (
                <line key={`${i}-${j}`}
                  x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)}
                  stroke={color} strokeWidth={isWeak ? 2.5 : 1.5}
                  strokeOpacity={lineup[i] && lineup[j] ? (isWeak ? 0.9 : 0.5) : 0.15}
                  style={isWeak ? { animation:'lv-pulse 1.5s ease-in-out infinite' } : undefined}
                />
              );
            })}

            {/* Player slots */}
            {slots.map((slot, i) => {
              const player = lineup[i];
              const isActive = activeSlot === i;
              const cx = px(slot.x), cy = py(slot.y);
              return (
                <g key={i} style={{ cursor:'pointer' }} onClick={() => { setActiveSlot(isActive ? null : i); setSearch(''); }}>
                  <circle cx={cx} cy={cy} r={18}
                    fill={player ? (isActive ? 'rgba(124,58,237,0.8)' : 'rgba(30,60,30,0.95)') : (isActive ? 'rgba(124,58,237,0.4)' : 'rgba(0,0,0,0.5)')}
                    stroke={isActive ? '#a78bfa' : player ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {player ? (
                    <>
                      <text x={cx} y={cy-4} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700" dominantBaseline="middle">
                        {player.name.split(' ').pop()?.slice(0,8)}
                      </text>
                      <text x={cx} y={cy+7} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)" dominantBaseline="middle">
                        {slot.role}
                      </text>
                    </>
                  ) : (
                    <text x={cx} y={cy} textAnchor="middle" fontSize="8" fill={isActive ? '#a78bfa' : 'rgba(255,255,255,0.3)'} dominantBaseline="middle" fontWeight="600">
                      {slot.role}
                    </text>
                  )}
                  {player && (
                    <g onClick={e => { e.stopPropagation(); removePlayer(i); }}>
                      <circle cx={cx+13} cy={cy-13} r={6} fill="rgba(239,68,68,0.8)" />
                      <text x={cx+13} y={cy-13} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#fff" fontWeight="800">×</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Edge legend */}
          <div className="flex items-center gap-4 mt-2 px-1">
            {[['#22c55e','Strong'],['#eab308','Moderate'],['#ef4444','Weak link']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div style={{ width:16, height:2, background:c, borderRadius:1 }} />
                <span className="text-[10px] text-zinc-600">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex flex-col gap-4">

          {/* Player picker (shows when slot is active) */}
          <AnimatePresence>
            {activeSlot !== null && (
              <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-yellow-300">Assigning: <span className="text-white">{slots[activeSlot].role}</span></p>
                  <button onClick={() => setActiveSlot(null)} className="text-zinc-600 hover:text-white transition-colors bg-transparent border-none cursor-pointer"><X size={14}/></button>
                </div>
                <div className="relative mb-2">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player..."
                    className="w-full pl-7 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-zinc-600 placeholder:text-zinc-700" autoFocus />
                </div>
                <div className="lv-scroll flex flex-col gap-0.5 max-h-44 overflow-y-auto">
                  {filtered.map(p => (
                    <button key={p.id} onClick={() => assignPlayer(p)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left w-full transition-colors border-none bg-transparent cursor-pointer">
                      <span>{p.flag}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-zinc-200 truncate block">{p.name}</span>
                        <span className="text-[10px] text-zinc-600">{p.country} · {p.position}</span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">{p.passing}/{p.pressing}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions when no active slot */}
          {activeSlot === null && !analysis && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center">
              <Users size={24} className="mx-auto text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-500">Tap any position on the pitch to assign a player</p>
              <p className="text-[10px] text-zinc-700 mt-1">{11 - filledCount} positions remaining</p>
            </div>
          )}

          {/* Analysis results */}
          <AnimatePresence>
            {analysis && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="flex flex-col gap-3">

                {/* Scores */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Network Cohesion</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-3xl font-black" style={{ color: analysis.cohesion>75?'#22c55e':analysis.cohesion>60?'#eab308':'#ef4444' }}>{analysis.cohesion}</span>
                      <span className="text-xs text-zinc-600 mb-1">/100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 mt-2 overflow-hidden">
                      <div style={{ width:`${analysis.cohesion}%`, background: analysis.cohesion>75?'#22c55e':analysis.cohesion>60?'#eab308':'#ef4444', height:'100%', borderRadius:4 }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Ball Knowledge</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-3xl font-black text-yellow-400">{analysis.bk}</span>
                      <span className="text-xs text-zinc-600 mb-1">th %ile</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2">vs. historical manager selections</p>
                  </div>
                </div>

                {/* Weak link callout */}
                {(() => {
                  const weakEdge = analysis.edgeData.reduce((a, b) => a.w < b.w ? a : b);
                  if (weakEdge.w >= 65) return null;
                  return (
                    <div className="p-3 rounded-xl border border-red-500/25 bg-red-500/8">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Fragmentation Risk</p>
                      <p className="text-xs text-zinc-300">
                        <span className="text-white font-semibold">{lineup[weakEdge.i]?.name}</span> ↔ <span className="text-white font-semibold">{lineup[weakEdge.j]?.name}</span>
                        <span className="text-zinc-500"> — network weight {weakEdge.w}. Opposition can exploit this seam.</span>
                      </p>
                    </div>
                  );
                })()}

                {/* LLM narrative */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Analysis</p>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">"{analysis.narrative}"</p>
                </div>

                {/* Share */}
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white text-xs font-semibold transition-colors bg-transparent cursor-pointer w-full">
                  Share Result
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
