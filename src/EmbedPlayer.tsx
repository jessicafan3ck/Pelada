/**
 * Standalone embed player — fullscreen widget, no app chrome.
 * Loaded when URL contains ?embed=<base64-encoded-widget-code>
 *
 * Renders directly in the page (no srcdoc iframe) using the already-bundled
 * React + Recharts + window.Babel (guaranteed by the blocking <script> in
 * index.html, which runs before the ES-module entry point).
 * Typical render time: <200 ms after the main bundle loads.
 *
 * Camera mode: tapping the camera button overlays the widget on live camera
 * so it feels like a TikTok filter inside TikTok's in-app WebView.
 */
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Recharts from 'recharts';

const RECHARTS_KEYS = [
  'BarChart','Bar','LineChart','Line','AreaChart','Area',
  'PieChart','Pie','Cell','XAxis','YAxis','CartesianGrid',
  'Tooltip','Legend','ResponsiveContainer',
  'RadarChart','Radar','PolarGrid','PolarAngleAxis','ScatterChart','Scatter',
] as const;

function decodeEmbedParam(raw: string): string {
  const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function sanitize(code: string): string {
  return code
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/\bexport\s+default\s+/g, '')
    .replace(/\bexport\s+\{[^}]*\};?/g, '')
    .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

export default function EmbedPlayer() {
  const widgetRootRef  = useRef<HTMLDivElement>(null);
  const videoRef       = useRef<HTMLVideoElement>(null);
  const [error, setError]         = useState('');
  const [cameraOn, setCameraOn]   = useState(false);
  const [camError, setCamError]   = useState('');
  const [widgetReady, setWidgetReady] = useState(false);

  // ── Render widget directly into the page ──────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('embed');
    if (!raw) { setError('No widget code provided.'); return; }

    try {
      const rawCode = decodeEmbedParam(raw);
      const code    = sanitize(rawCode);

      const Babel = (window as unknown as { Babel: { transform: (c: string, o: object) => { code: string } } }).Babel;
      if (!Babel) { setError('Babel runtime not available.'); return; }

      const { code: transformed } = Babel.transform(code, {
        presets: ['react'],
        sourceType: 'script',
      });

      const rechartsVals = RECHARTS_KEYS.map(k => (Recharts as Record<string, unknown>)[k]);

      const fn = new Function(
        'React',
        'useState', 'useEffect', 'useMemo', 'useRef', 'useCallback', 'useReducer',
        ...RECHARTS_KEYS,
        transformed + '\nreturn typeof Widget !== "undefined" ? Widget : null;',
      );

      const Widget = fn(
        React,
        React.useState, React.useEffect, React.useMemo,
        React.useRef, React.useCallback, React.useReducer,
        ...rechartsVals,
      ) as React.ComponentType | null;

      if (!Widget) { setError('Widget() function not defined.'); return; }

      // Defer one tick so the div is mounted
      requestAnimationFrame(() => {
        if (widgetRootRef.current) {
          ReactDOM.createRoot(widgetRootRef.current).render(React.createElement(Widget));
          setWidgetReady(true);
        }
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // ── Camera overlay (TikTok filter feel) ──────────────────────────────────
  useEffect(() => {
    if (!cameraOn) {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => {
        setCamError('Camera access denied.');
        setCameraOn(false);
      });
  }, [cameraOn]);

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex',
      alignItems:'center', justifyContent:'center', padding:16 }}>
      <p style={{ color:'#f87171', fontSize:12, fontFamily:'monospace', whiteSpace:'pre-wrap' }}>{error}</p>
    </div>
  );

  return (
    <div style={{ position:'relative', minHeight:'100vh', background:'#0a0a0a',
      color:'#e4e4e7', fontFamily:'system-ui,sans-serif', overflow:'hidden' }}>

      {/* Camera feed — fills background when active */}
      {cameraOn && (
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', transform:'scaleX(-1)', zIndex:0,
          }}
        />
      )}

      {/* Backdrop so widget is readable over camera */}
      {cameraOn && (
        <div style={{
          position:'absolute', inset:0, zIndex:1,
          background:'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 100%)',
        }} />
      )}

      {/* Widget */}
      <div
        ref={widgetRootRef}
        style={{
          position: cameraOn ? 'absolute' : 'relative',
          ...(cameraOn ? {
            bottom: 80, left: 12, right: 12, zIndex: 2,
            background: 'rgba(10,10,10,0.82)',
            borderRadius: 16,
            backdropFilter: 'blur(12px)',
            padding: 12,
          } : {
            minHeight: '100vh',
            padding: 16,
          }),
        }}
      />

      {/* Camera toggle — only show after widget is ready */}
      {widgetReady && (
        <button
          onClick={() => { setCamError(''); setCameraOn(v => !v); }}
          style={{
            position:'fixed', bottom:24, right:20, zIndex:10,
            width:52, height:52, borderRadius:'50%',
            background: cameraOn ? '#7c3aed' : 'rgba(255,255,255,0.12)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', backdropFilter:'blur(8px)',
            fontSize:22,
          }}
          title={cameraOn ? 'Turn off camera' : 'Camera filter mode'}
        >
          {cameraOn ? '📷' : '🎥'}
        </button>
      )}

      {camError && (
        <p style={{ position:'fixed', bottom:88, right:20, zIndex:10,
          fontSize:11, color:'#f87171', background:'rgba(0,0,0,0.7)',
          padding:'4px 8px', borderRadius:6 }}>
          {camError}
        </p>
      )}

      {/* Subtle Pelada watermark */}
      {widgetReady && (
        <div style={{
          position:'fixed', top:12, right:14, zIndex:10,
          fontSize:10, color:'rgba(255,255,255,0.25)',
          letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase',
        }}>
          Pelada
        </div>
      )}
    </div>
  );
}
