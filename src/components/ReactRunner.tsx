import React, { useState, useEffect, Component } from 'react';
import * as Recharts from 'recharts';

interface ReactRunnerProps {
  code: string;
  height?: number;
}

export function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

function braceDepth(code: string): number {
  let depth = 0, inStr = false, strChar = '';
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (inStr) {
      if (ch === strChar && code[i - 1] !== '\\') inStr = false;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      inStr = true; strChar = ch;
    } else if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  return depth;
}

const RECHARTS_KEYS = [
  'LineChart','Line','BarChart','Bar','PieChart','Pie','Cell',
  'AreaChart','Area','ScatterChart','Scatter',
  'RadarChart','Radar','PolarGrid','PolarAngleAxis','PolarRadiusAxis',
  'XAxis','YAxis','CartesianGrid','Tooltip','Legend','ResponsiveContainer',
  'ComposedChart','ReferenceLine',
] as const;

// Error boundary to catch render-time exceptions from generated widgets
class WidgetBoundary extends Component<
  { children: React.ReactNode },
  { err: string | null }
> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) { return { err: e.message }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{ color: '#f87171', fontSize: 11, fontFamily: 'monospace',
          padding: 12, background: '#1f0a0a', border: '1px solid #7f1d1d', borderRadius: 8 }}>
          Render error: {this.state.err}
        </div>
      );
    }
    return this.props.children;
  }
}

const ReactRunner = ({ code, height = 280 }: ReactRunnerProps) => {
  const cleanCode = stripFences(code);
  const [Widget, setWidget] = useState<React.ComponentType | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [ready, setReady] = useState(typeof (window as any).Babel !== 'undefined');

  // Wait for Babel (loaded via index.html script tag) to be available
  useEffect(() => {
    if (ready) return;
    const t = setInterval(() => {
      if (typeof (window as any).Babel !== 'undefined') { setReady(true); clearInterval(t); }
    }, 100);
    return () => clearInterval(t);
  }, [ready]);

  useEffect(() => {
    if (!ready || !cleanCode) return;
    setCompileError(null);
    setWidget(null);
    try {
      const Babel = (window as any).Babel;
      const { code: transformed } = Babel.transform(cleanCode, { presets: ['react'] });

      const rechartsArgs = RECHARTS_KEYS.map(k => (Recharts as Record<string, unknown>)[k]);

      // new Function runs in global scope — we explicitly pass every dependency
      // the widget code might reference, so it never needs to reach into the module.
      const factory = new Function(
        'React',
        'useState','useEffect','useMemo','useCallback','useRef','useReducer',
        ...RECHARTS_KEYS,
        `${transformed}\nif (typeof Widget !== 'undefined') return Widget;\nthrow new Error('Your code must define a function named Widget.');`
      );

      const WidgetFn = factory(
        React,
        React.useState, React.useEffect, React.useMemo,
        React.useCallback, React.useRef, React.useReducer,
        ...rechartsArgs,
      );

      setWidget(() => WidgetFn);
    } catch (e: unknown) {
      setCompileError(e instanceof Error ? e.message : String(e));
    }
  }, [cleanCode, ready]);

  if (!cleanCode) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 flex items-center justify-center p-8 text-zinc-500 text-sm">
        Describe a widget and hit Generate.
      </div>
    );
  }

  if (braceDepth(cleanCode) > 0) {
    return (
      <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 text-red-400 text-xs font-mono leading-relaxed">
        Generated code looks truncated (unclosed braces). Try a shorter or simpler description and generate again.
      </div>
    );
  }

  if (compileError) {
    return (
      <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 text-red-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
        {compileError}
      </div>
    );
  }

  if (!ready || !Widget) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 flex items-center justify-center p-8 text-zinc-500 text-sm">
        {!ready ? 'Loading Babel…' : 'Building widget…'}
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/40 border border-yellow-500/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/60" />
        </div>
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Live Preview</span>
        <div />
      </div>
      <div className="overflow-auto p-4" style={{ height: height - 36 }}>
        <WidgetBoundary>
          <Widget />
        </WidgetBoundary>
      </div>
    </div>
  );
};

export default ReactRunner;
