import { useEffect, useMemo, useState } from 'react';

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

const RECHARTS_KEYS = [
  'BarChart','Bar','LineChart','Line','AreaChart','Area',
  'PieChart','Pie','Cell','XAxis','YAxis','CartesianGrid',
  'Tooltip','Legend','ResponsiveContainer',
  'RadarChart','Radar','PolarGrid','PolarAngleAxis','ScatterChart','Scatter',
];

// ─── Standalone srcdoc — used by both ReactRunner and EmbedPlayer ─────────────
export function buildWidgetSrcdoc(rawCode: string): string {
  const code = rawCode
    .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/\bexport\s+default\s+/g, '')
    .replace(/\bexport\s+\{[^}]*\};?/g, '')
    .trim();

  const safe = JSON.stringify(code).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const hookNames = ['React','useState','useEffect','useMemo','useRef','useCallback','useReducer'];
  const allParams = [...hookNames, ...RECHARTS_KEYS].map(p => `"${p}"`).join(',');
  const hookArgs  = ['React','React.useState','React.useEffect','React.useMemo',
                     'React.useRef','React.useCallback','React.useReducer'];
  const allArgs   = [...hookArgs, ...RECHARTS_KEYS.map(k => `R.${k}`)].join(',');

  const rechartsKeys = JSON.stringify(RECHARTS_KEYS);

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<script>window.process={env:{NODE_ENV:'production'}};</script>
<script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.development.js" onerror="window.__loadErr='React failed to load'"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.development.js" onerror="window.__loadErr='ReactDOM failed to load'"></script>
<script src="https://cdn.jsdelivr.net/npm/recharts@2.10.3/umd/Recharts.js" onerror="window.__loadErr='Recharts failed to load'"></script>
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.23.9/babel.min.js" onerror="window.__loadErr='Babel failed to load'"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#e4e4e7;font-family:system-ui,sans-serif}
#root{padding:16px;min-height:200px}
.err{color:#f87171;padding:16px;font-size:12px;font-family:monospace;white-space:pre-wrap;background:#1a0000;border-radius:8px;margin:8px}
</style>
</head><body>
<div id="root"></div>
<script>(function(){
var rootEl=document.getElementById("root");
function showErr(msg){rootEl.innerHTML="<div class='err'>"+String(msg)+"</div>";}
if(window.__loadErr){showErr(window.__loadErr);return;}
if(typeof Babel==='undefined'){showErr("Babel not loaded");return;}
if(typeof React==='undefined'){showErr("React not loaded");return;}
if(typeof ReactDOM==='undefined'){showErr("ReactDOM not loaded");return;}
var R=window.Recharts||{};
var missingR=${rechartsKeys}.filter(function(k){return!R[k];});
if(missingR.length===${RECHARTS_KEYS.length}){showErr("Recharts not available. typeof window.Recharts="+typeof window.Recharts+". Keys found: "+Object.keys(window.Recharts||{}).slice(0,5).join(",")||"none");return;}
var c=${safe};
try{
var t=Babel.transform(c,{presets:["react","typescript"],sourceType:"module",filename:"widget.tsx"}).code;
var fn=new Function(${allParams},t+"\\nreturn typeof Widget!='undefined'?Widget:null;");
var W=fn(${allArgs});
if(!W)throw new Error("No Widget() function found — define: function Widget() { return <div>...</div>; }");
var ErrBoundary=class extends React.Component{constructor(p){super(p);this.state={err:null};}static getDerivedStateFromError(e){return{err:e};}render(){if(this.state.err)return React.createElement('div',{className:'err'},String(this.state.err));return this.props.children;}};
ReactDOM.createRoot(rootEl).render(React.createElement(ErrBoundary,null,React.createElement(W)));
}catch(err){showErr(err.message||String(err));}
})();</script>
</body></html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ReactRunner = ({ code, height = 320 }: ReactRunnerProps) => {
  const cleanCode = useMemo(() => stripFences(code), [code]);
  const srcDoc    = useMemo(() => cleanCode ? buildWidgetSrcdoc(cleanCode) : '', [cleanCode]);
  const [loaded, setLoaded] = useState(false);

  // Reset loaded state when code changes so spinner shows during re-render
  useEffect(() => { setLoaded(false); }, [cleanCode]);

  if (!cleanCode) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 flex items-center justify-center p-8 text-zinc-500 text-sm">
        Describe a widget and hit Generate.
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
      {!loaded && (
        <div className="flex items-center justify-center gap-3 text-zinc-600 text-xs" style={{ height }}>
          <div className="w-4 h-4 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin" />
          Loading…
        </div>
      )}
      <iframe
        key={cleanCode}
        srcDoc={srcDoc}
        style={{ width: '100%', height, border: 'none', display: loaded ? 'block' : 'none', background: '#0a0a0a' }}
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setLoaded(true)}
        title="Widget Sandbox"
      />
    </div>
  );
};

export default ReactRunner;
