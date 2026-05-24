import { useMemo } from 'react';

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

const RECHARTS_DESTRUCTURE = [
  'LineChart', 'Line', 'BarChart', 'Bar', 'PieChart', 'Pie', 'Cell',
  'AreaChart', 'Area', 'ScatterChart', 'Scatter',
  'RadarChart', 'Radar', 'PolarGrid', 'PolarAngleAxis', 'PolarRadiusAxis',
  'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend', 'ResponsiveContainer',
  'ComposedChart', 'ReferenceLine',
].map(n => `var ${n} = (typeof Recharts !== 'undefined' && Recharts.${n}) || null;`).join('\n');

const REACT_HOOKS = ['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useReducer']
  .map(n => `var ${n} = React.${n};`).join('\n');

const ReactRunner = ({ code, height = 280 }: ReactRunnerProps) => {
  const cleanCode = stripFences(code);

  const iframeContent = useMemo(() => {
    const safeCode = JSON.stringify(cleanCode);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://unpkg.com/recharts@2.15.2/umd/recharts.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; background: #0d1117; color: #e4e4e7;
           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #root { width: 100%; }
    #err { color: #f87171; font-size: 11px; font-family: monospace; padding: 12px;
           white-space: pre-wrap; background: #1f0a0a; border: 1px solid #7f1d1d;
           border-radius: 8px; margin: 4px; display: none; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="err"></div>
  <script>
    function showErr(msg) {
      var el = document.getElementById('err');
      el.style.display = 'block';
      el.textContent = msg;
    }
    window.onerror = function(msg) { showErr('Runtime error: ' + msg); return true; };

    window.addEventListener('load', function() {
      var rawCode = ${safeCode};
      try {
        ${REACT_HOOKS}
        ${RECHARTS_DESTRUCTURE}
        var transformed = Babel.transform(
          '(function(){"use strict";' + rawCode + '\\nreturn Widget;})()',
          { presets: ['react'] }
        ).code;
        var Widget = eval(transformed);
        if (typeof Widget !== 'function') throw new Error('Widget function not found — make sure your code defines a function named Widget.');
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Widget));
      } catch(e) {
        showErr('Widget error: ' + e.message);
      }
    });
  <\/script>
</body>
</html>`;
  }, [cleanCode]);

  if (!cleanCode) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 flex items-center justify-center p-8 text-zinc-500 text-sm">
        No code to preview.
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
      <iframe
        srcDoc={iframeContent}
        style={{ width: '100%', height, border: 'none', display: 'block' }}
        sandbox="allow-scripts"
        title="Widget Live Preview"
      />
    </div>
  );
};

export default ReactRunner;
