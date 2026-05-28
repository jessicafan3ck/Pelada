import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Activity } from 'lucide-react';

// ── Match config ──────────────────────────────────────────────────────────────

const MATCHES = [
  { id: 'esp_jpn', home: 'Spain',     away: 'Japan',   homeAbbr: 'ESP', awayAbbr: 'JPN', hp: 0.64, ap: 0.58 },
  { id: 'arg_eng', home: 'Argentina', away: 'England', homeAbbr: 'ARG', awayAbbr: 'ENG', hp: 0.66, ap: 0.63 },
  { id: 'ger_usa', home: 'Germany',   away: 'USA',     homeAbbr: 'GER', awayAbbr: 'USA', hp: 0.65, ap: 0.60 },
  { id: 'fra_bra', home: 'France',    away: 'Brazil',  homeAbbr: 'FRA', awayAbbr: 'BRA', hp: 0.63, ap: 0.62 },
];

// ── Zone system ───────────────────────────────────────────────────────────────
// SVG viewBox 400×600. Home attacks upward (toward y=0). Away attacks downward (toward y=600).
// Ball coords: ballX 0-100 → SVG x * 4; ballY 0-100 → SVG y * 6

const ZONE_POS: Record<string, [number, number]> = {
  home_gk:  [50, 90], home_def: [50, 76], home_mid: [50, 52],
  home_atk: [50, 28], home_box: [50, 12],
  away_gk:  [50, 10], away_def: [50, 24], away_mid: [50, 48],
  away_atk: [50, 72], away_box: [50, 88],
};

const ZONE_HIGHLIGHT: Record<string, [number, number, number, number]> = {
  home_gk:  [20, 490, 360, 110], home_def: [20, 375, 360, 115],
  home_mid: [20, 250, 360, 125], home_atk: [20, 120, 360, 130],
  home_box: [90,  20, 220, 100],
  away_gk:  [20,   0, 360, 110], away_def: [20, 110, 360, 115],
  away_mid: [20, 225, 360, 125], away_atk: [20, 350, 360, 130],
  away_box: [90, 480, 220, 100],
};

type EventType = 'pass' | 'dribble' | 'shot' | 'goal' | 'tackle' | 'save' | 'info';

interface Transition { next: string; prob: number; desc: string; loss?: boolean }

const T: Record<string, Transition[]> = {
  home_gk:  [
    { next: 'home_def', prob: 0.70, desc: 'Pass out from back' },
    { next: 'home_mid', prob: 0.85, desc: 'Long clearance to midfield' },
    { next: 'home_atk', prob: 0.92, desc: 'Goalkeeper punt forward' },
    { next: 'home_gk',  prob: 1.00, desc: 'Pressed — forced goal kick', loss: true },
  ],
  home_def: [
    { next: 'home_gk',  prob: 0.12, desc: 'Pass back to keeper' },
    { next: 'home_def', prob: 0.28, desc: 'Recycle across the back line' },
    { next: 'home_mid', prob: 0.62, desc: 'Pass into midfield' },
    { next: 'home_atk', prob: 0.75, desc: 'Switch — ball forward' },
    { next: 'away_mid', prob: 1.00, desc: 'Tackle — turnover', loss: true },
  ],
  home_mid: [
    { next: 'home_def', prob: 0.14, desc: 'Pass back, retain shape' },
    { next: 'home_mid', prob: 0.30, desc: 'One-two, hold possession' },
    { next: 'home_atk', prob: 0.60, desc: 'Through ball — in behind' },
    { next: 'home_box', prob: 0.72, desc: 'Incisive pass — danger zone' },
    { next: 'away_mid', prob: 1.00, desc: 'Dispossessed in midfield', loss: true },
  ],
  home_atk: [
    { next: 'home_mid', prob: 0.16, desc: 'Hold up, lay off' },
    { next: 'home_atk', prob: 0.30, desc: 'Dribble at the defender' },
    { next: 'home_box', prob: 0.52, desc: 'Cut inside — danger area' },
    { next: 'SHOT',     prob: 0.68, desc: 'Shot from outside the box' },
    { next: 'away_def', prob: 1.00, desc: 'Tackled on the wing', loss: true },
  ],
  home_box: [
    { next: 'SHOT',     prob: 0.65, desc: 'Shot in the penalty box' },
    { next: 'home_atk', prob: 0.80, desc: 'Saved — corner awarded' },
    { next: 'away_def', prob: 1.00, desc: 'Blocked — clearance upfield', loss: true },
  ],
  away_gk:  [
    { next: 'away_def', prob: 0.70, desc: 'Pass out from back' },
    { next: 'away_mid', prob: 0.85, desc: 'Long clearance' },
    { next: 'away_atk', prob: 0.92, desc: 'Goalkeeper distribution' },
    { next: 'away_gk',  prob: 1.00, desc: 'Pressed — goal kick', loss: true },
  ],
  away_def: [
    { next: 'away_gk',  prob: 0.12, desc: 'Pass back to keeper' },
    { next: 'away_def', prob: 0.28, desc: 'Recycle across the defence' },
    { next: 'away_mid', prob: 0.62, desc: 'Pass into midfield' },
    { next: 'away_atk', prob: 0.75, desc: 'Ball forward' },
    { next: 'home_mid', prob: 1.00, desc: 'Tackle — turnover', loss: true },
  ],
  away_mid: [
    { next: 'away_def', prob: 0.14, desc: 'Pass back, retain shape' },
    { next: 'away_mid', prob: 0.30, desc: 'One-two, hold possession' },
    { next: 'away_atk', prob: 0.60, desc: 'Through ball' },
    { next: 'away_box', prob: 0.72, desc: 'Incisive pass' },
    { next: 'home_mid', prob: 1.00, desc: 'Dispossessed', loss: true },
  ],
  away_atk: [
    { next: 'away_mid', prob: 0.16, desc: 'Hold up, lay off' },
    { next: 'away_atk', prob: 0.30, desc: 'Dribble at the defender' },
    { next: 'away_box', prob: 0.52, desc: 'Cut inside' },
    { next: 'SHOT',     prob: 0.68, desc: 'Shot from outside the box' },
    { next: 'home_def', prob: 1.00, desc: 'Tackled on the wing', loss: true },
  ],
  away_box: [
    { next: 'SHOT',     prob: 0.65, desc: 'Shot in the penalty box' },
    { next: 'away_atk', prob: 0.80, desc: 'Saved — corner awarded' },
    { next: 'home_def', prob: 1.00, desc: 'Blocked — clearance', loss: true },
  ],
};

// ── State ─────────────────────────────────────────────────────────────────────

interface SimEvent { id: number; minute: number; team: 'home' | 'away' | null; type: EventType; desc: string }

interface Sim {
  zone: string; ballX: number; ballY: number;
  possession: 'home' | 'away'; minute: number;
  score: [number, number]; xg: [number, number]; shots: [number, number];
  homePoss: number; awayPoss: number;
  events: SimEvent[]; step: number;
}

function initSim(): Sim {
  return {
    zone: 'home_mid', ballX: 50, ballY: 52, possession: 'home', minute: 0,
    score: [0, 0], xg: [0, 0], shots: [0, 0], homePoss: 0, awayPoss: 0,
    events: [{ id: 0, minute: 0, team: null, type: 'info', desc: 'Kick off — MCMC simulation ready.' }],
    step: 1,
  };
}

function jitter(x: number, y: number): [number, number] {
  return [Math.max(5, Math.min(95, x + (Math.random() - 0.5) * 22)),
          Math.max(3, Math.min(97, y + (Math.random() - 0.5) * 7))];
}

function nextSim(prev: Sim, hp: number, ap: number): Sim {
  if (prev.minute >= 90) return prev;

  const minute  = prev.minute + 1;
  const stepId  = prev.step;
  const team    = prev.zone.startsWith('home') ? 'home' as const : 'away' as const;
  const transitions = T[prev.zone];
  if (!transitions) return { ...prev, minute };

  const r  = Math.random();
  const tr = transitions.find(t => r <= t.prob)!;

  let zone       = tr.next;
  let possession = prev.possession;
  const score    = [...prev.score] as [number, number];
  const xg       = [...prev.xg]    as [number, number];
  const shots    = [...prev.shots]  as [number, number];
  let evType: EventType = 'pass';
  let evDesc = tr.desc;
  let evTeam: 'home' | 'away' | null = team;

  if (tr.next === 'SHOT') {
    const inBox  = prev.zone.includes('box');
    const xgVal  = inBox ? 0.18 + Math.random() * 0.28 : 0.05 + Math.random() * 0.09;
    const power  = team === 'home' ? hp : ap;
    const isGoal = Math.random() < xgVal * power * 1.6;

    xg[team === 'home' ? 0 : 1]    += xgVal;
    shots[team === 'home' ? 0 : 1] += 1;

    if (isGoal) {
      score[team === 'home' ? 0 : 1] += 1;
      evType = 'goal';
      evDesc = `GOAL — ${team === 'home' ? 'home' : 'away'}! xG: ${xgVal.toFixed(2)}`;
      zone        = team === 'home' ? 'away_mid' : 'home_mid';
      possession  = team === 'home' ? 'away' : 'home';
    } else {
      evType = 'save';
      evDesc = `Shot saved. xG: ${xgVal.toFixed(2)}`;
      zone        = team === 'home' ? 'away_gk' : 'home_gk';
      possession  = team === 'home' ? 'away' : 'home';
    }
  } else if (tr.loss) {
    evType      = 'tackle';
    possession  = team === 'home' ? 'away' : 'home';
  } else {
    evType = tr.desc.toLowerCase().includes('dribble') ? 'dribble' : 'pass';
  }

  const zp = ZONE_POS[zone] ?? ZONE_POS[prev.zone];
  const [ballX, ballY] = jitter(...zp);

  const newEvent: SimEvent = { id: stepId, minute, team: evTeam, type: evType, desc: evDesc };

  return {
    zone, ballX, ballY, possession, minute, score, xg, shots,
    homePoss: prev.homePoss + (team === 'home' ? 1 : 0),
    awayPoss: prev.awayPoss + (team === 'away' ? 1 : 0),
    events: [newEvent, ...prev.events].slice(0, 25),
    step: stepId + 1,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const EVENT_STYLE: Record<EventType, string> = {
  goal:    'text-yellow-400 font-bold',
  shot:    'text-orange-400',
  save:    'text-blue-400',
  tackle:  'text-red-400',
  dribble: 'text-pink-400',
  pass:    'text-zinc-400',
  info:    'text-zinc-500 italic',
};

export default function MCMCSimulation() {
  const [matchIdx, setMatchIdx] = useState(0);
  const [sim, setSim]           = useState<Sim>(initSim);
  const [running, setRunning]   = useState(false);
  const [speed, setSpeed]       = useState(700);

  const match = MATCHES[matchIdx];

  const step = useCallback(() => {
    setSim(prev => nextSim(prev, match.hp, match.ap));
  }, [match]);

  useEffect(() => {
    if (!running || sim.minute >= 90) { if (sim.minute >= 90) setRunning(false); return; }
    const id = setTimeout(step, speed);
    return () => clearTimeout(id);
  }, [running, sim.minute, step, speed]);

  const reset = () => { setSim(initSim()); setRunning(false); };

  const totalPoss = (sim.homePoss + sim.awayPoss) || 1;
  const homePct   = Math.round(sim.homePoss / totalPoss * 100);
  const zoneLabel: Record<string, string> = {
    home_gk: 'Home GK', home_def: 'Home Def', home_mid: 'Midfield',
    home_atk: 'Home Atk', home_box: 'Home Box',
    away_gk: 'Away GK', away_def: 'Away Def', away_mid: 'Midfield',
    away_atk: 'Away Atk', away_box: 'Away Box',
  };

  return (
    <div className="h-full flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="w-7 h-7 text-cyan-400" />
            MCMC Match Simulation
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Markov Chain Monte Carlo — each event is a state transition sampled from learned match-flow distributions.
          </p>
        </div>
        <div className="flex gap-2">
          {MATCHES.map((m, i) => (
            <button key={m.id} onClick={() => { setMatchIdx(i); reset(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${matchIdx === i ? 'bg-cyan-500/15 border border-cyan-500/35 text-cyan-400' : 'bg-white/5 border border-white/10 text-zinc-500 hover:text-white'}`}>
              {m.homeAbbr} v {m.awayAbbr}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-5 min-h-0">

        {/* Pitch */}
        <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden flex flex-col">
          {/* Zone label */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Ball zone</span>
            <span className={`text-xs font-bold ${sim.possession === 'home' ? 'text-cyan-400' : 'text-red-400'}`}>
              {zoneLabel[sim.zone] ?? sim.zone} — {sim.possession === 'home' ? match.home : match.away}
            </span>
            <span className="text-[10px] text-zinc-600 font-mono">{sim.minute}′</span>
          </div>
          <svg className="flex-1 w-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0c2818" />
                <stop offset="50%"  stopColor="#163821" />
                <stop offset="100%" stopColor="#0c2818" />
              </linearGradient>
              <filter id="bl"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect width="400" height="600" fill="url(#pg)" />

            {/* Zone highlight */}
            {(() => { const h = ZONE_HIGHLIGHT[sim.zone]; if (!h) return null;
              const col = sim.possession === 'home' ? 'rgba(6,182,212,0.07)' : 'rgba(239,68,68,0.07)';
              return <rect x={h[0]} y={h[1]} width={h[2]} height={h[3]} fill={col} rx="2" />;
            })()}

            {/* Pitch markings */}
            <g stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none">
              <rect x="20" y="20" width="360" height="560" rx="2" />
              <line x1="20" y1="300" x2="380" y2="300" />
              <circle cx="200" cy="300" r="52" />
              <circle cx="200" cy="300" r="3" fill="rgba(255,255,255,0.25)" />
              {/* Away penalty area (top) */}
              <rect x="88" y="20"  width="224" height="90" />
              <rect x="144" y="20" width="112" height="38" />
              <rect x="162" y="13" width="76"  height="8" fill="rgba(255,255,255,0.06)" />
              {/* Home penalty area (bottom) */}
              <rect x="88" y="490"  width="224" height="90" />
              <rect x="144" y="542" width="112" height="38" />
              <rect x="162" y="579" width="76"  height="8" fill="rgba(255,255,255,0.06)" />
            </g>

            {/* Away goal indicator */}
            <text x="200" y="11" textAnchor="middle" fill="rgba(239,68,68,0.55)" fontSize="9" fontWeight="bold" fontFamily="system-ui">{match.away} ▼</text>
            {/* Home goal indicator */}
            <text x="200" y="598" textAnchor="middle" fill="rgba(6,182,212,0.55)" fontSize="9" fontWeight="bold" fontFamily="system-ui">{match.home} ▲</text>

            {/* Ball trail (last 3 positions approximated) */}
            <circle cx={sim.ballX * 4} cy={sim.ballY * 6} r="14" fill={sim.possession === 'home' ? 'rgba(6,182,212,0.06)' : 'rgba(239,68,68,0.06)'} />
            <circle cx={sim.ballX * 4} cy={sim.ballY * 6} r="8" fill="rgba(255,255,255,0.1)" />
            <circle cx={sim.ballX * 4} cy={sim.ballY * 6} r="5" fill="white" filter="url(#bl)" />
          </svg>
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col gap-3 shrink-0">

          {/* Score */}
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Score</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sim.minute >= 90 ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                {sim.minute >= 90 ? 'FT' : `${sim.minute}′`}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-center">
                <div className="text-[10px] text-cyan-400 font-bold mb-1">{match.homeAbbr}</div>
                <div className="text-5xl font-black text-white leading-none">{sim.score[0]}</div>
                <div className="text-[10px] text-zinc-600 mt-1">xG {sim.xg[0].toFixed(2)}</div>
              </div>
              <div className="text-zinc-700 text-xl font-black pb-3">:</div>
              <div className="text-center">
                <div className="text-[10px] text-red-400 font-bold mb-1">{match.awayAbbr}</div>
                <div className="text-5xl font-black text-white leading-none">{sim.score[1]}</div>
                <div className="text-[10px] text-zinc-600 mt-1">xG {sim.xg[1].toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Possession + shots */}
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/5 p-4 space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-cyan-400">{homePct}%</span>
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Possession</span>
              <span className="text-red-400">{100 - homePct}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${homePct}%`, background: 'linear-gradient(to right, rgba(6,182,212,0.8), rgba(244,114,182,0.6))' }} />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600 pt-1 border-t border-white/5">
              <span>Shots {sim.shots[0]}</span>
              <span className="text-zinc-700">Shots on target</span>
              <span>Shots {sim.shots[1]}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/5 p-3 flex gap-2">
            <button onClick={() => setRunning(r => !r)} disabled={sim.minute >= 90}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                running ? 'bg-red-500/10 border border-red-500/25 text-red-400' : 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40'
              }`}>
              {running ? <><Pause className="w-3.5 h-3.5" />Pause</> : <><Play className="w-3.5 h-3.5" />Simulate</>}
            </button>
            <button onClick={() => { if (!running) step(); }} disabled={running || sim.minute >= 90}
              className="py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={reset}
              className="py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed */}
          <div className="flex gap-1.5">
            {([['Slow', 1400], ['Normal', 700], ['Fast', 180]] as const).map(([l, ms]) => (
              <button key={l} onClick={() => setSpeed(ms)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  speed === ms ? 'bg-pink-500/15 border border-pink-500/25 text-pink-400' : 'bg-white/5 border border-white/10 text-zinc-600 hover:text-white'
                }`}>{l}</button>
            ))}
          </div>

          {/* Event log */}
          <div className="flex-1 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Match Events</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono">
              {sim.events.map(e => (
                <div key={e.id} className={`text-[10px] leading-relaxed ${EVENT_STYLE[e.type]} animate-in fade-in duration-150`}>
                  <span className="text-zinc-700">{e.minute}′ </span>{e.desc}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
