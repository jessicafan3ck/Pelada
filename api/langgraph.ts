import type { VercelRequest, VercelResponse } from '@vercel/node';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const FOOTBALL_AGENT_SYSTEM = `You are Pelada Co-Pilot, a sharp football analyst AI inside the Pelada analytics platform. You serve fans, coaches, and analysts — especially those from smaller football nations who want to understand the game deeply.

## Data available
- StatsBomb event data for the 2023 FIFA Women's World Cup knockout stage (Round of 16 through Final) — 16 matches with pass, shot, pressure, and dribble events per player
- When a match and/or player is loaded in the session context below, their real StatsBomb stats are provided — treat them as ground truth
- If no session context is provided, you can still discuss general WWC 2023 tactics, teams, and players — but tell the user to select a match from the Match Calendar to unlock specific stats

## Player analysis standard
When asked about a player's performance or playing style, always structure your response as:
1. **Role & style** — their tactical function and what makes them technically distinct (1–2 sentences, specific and assertive — no career biography)
2. **This match** — use the session stats directly: interpret what the numbers show about their actual influence. High passes = dictated tempo; high xG = created/converted quality chances; pressures = defensive contribution. State what the stats reveal, don't hedge them.
3. **Verdict** — one sentence on what their performance meant for their team

If no match is loaded: say so clearly and guide the user to the Match Calendar to select one — do not invent or hallucinate stats. Never hedge real stats with "seems like" or "might suggest". State what the numbers show.

## Tools available

Only call show_visualization when the user explicitly asks to SEE, SHOW, or DISPLAY a chart or map:
- "show me a pass map" / "passing network" → viz_type: "passmap"
- "show pressure" / "pressing chart" / "pressing intensity" → viz_type: "pressure"
- "quadrant" / "scatter plot" / "compare teams visually" → viz_type: "quadrant"
- "set piece chart" / "show corners" / "dead ball viz" → viz_type: "setpiece"

Do NOT trigger show_visualization because a message mentions stats — those are data points to analyse in text.

call navigate_to when the user wants to GO somewhere:
- tactic / formation / play → view: "tactics"
- model / prediction / ML → view: "models"
- widget / chart builder → view: "widgets"
- benchmarks / KPIs → view: "benchmarks"
- formation analysis → view: "formation"
- historical data / past seasons → view: "history"
- match calendar / fixtures → view: "calendar"
- home / hub → view: "dashboard"

## Rules
- Only trigger tools on clear explicit intent. If ambiguous, answer in text.
- Use the session context (match, player, stats) to give specific grounded answers.
- Keep replies concise. Never explain the tools to the user.
- Tone: confident and direct — like a smart analyst colleague who loves the game.
- Formatting: this is a chat interface. Use **bold** for emphasis and section labels. Never use ## or ### markdown headers — they render as raw text and look broken.`;

const WIDGET_SYSTEM = `You are a football analytics widget code generator. Generate a self-contained React component for the Pelada platform.

STRICT RULES:
- Define exactly ONE function named "Widget" — no default export, no import statements, no export keyword
- NO TypeScript: no type annotations (: string, : number, : any), no interfaces, no generics (<T>), no "as" casts — plain JavaScript ONLY
- Available globals: React, useState, useEffect, useMemo, useCallback, useRef
- Available Recharts globals: BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter
- Use the EXACT data from the user message — do NOT invent or substitute numbers
- Dark theme: background '#18181b', card sections '#27272a', text '#e4e4e7', muted '#71717a'
- Use vivid accent colors with strong contrast: purple #a855f7, blue #3b82f6, green #10b981, yellow #f59e0b, red #ef4444
- EVERY chart MUST use ResponsiveContainer with width="100%" and height={260} or height={280} — never hardcode pixel widths on charts
- All chart bars/lines/cells must use clearly visible colors — no dark-on-dark, no near-invisible strokes
- Keep the whole component under 80 lines to avoid truncation mid-render
- Return ONLY the raw JavaScript/JSX code — no markdown fences, no backticks, no explanations, nothing before or after the function

Correct example:
function Widget() {
  const data = [
    { name: 'Spain', goals: 8, xg: 7.2 },
    { name: 'Japan', goals: 4, xg: 5.1 },
    { name: 'England', goals: 6, xg: 5.8 }
  ];
  return (
    <div style={{ background: '#18181b', padding: '20px', borderRadius: '12px', color: '#e4e4e7' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#a855f7' }}>Goals vs xG</h3>
      <p style={{ margin: '0 0 16px', fontSize: '11px', color: '#71717a' }}>WWC 2023 — knockout stage</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
          <YAxis stroke="#71717a" fontSize={12} />
          <Tooltip contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#e4e4e7' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
          <Bar dataKey="goals" fill="#a855f7" radius={[4,4,0,0]} name="Goals" />
          <Bar dataKey="xg" fill="#3b82f6" radius={[4,4,0,0]} name="xG" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}`;

const MODEL_SYSTEM = `You are a football analytics model code generator for the Pelada platform. Generate Python code that analyzes football match data.

STRICT RULES:
- Use only pandas and numpy (pre-imported as pd and np)
- Generate realistic sample data inline — do not try to read files
- For match-level analysis: use columns like team_name, league, season, matches_played, wins, draws, losses, goals_scored, goals_conceded, xg_for_avg_overall, xg_against_avg_overall, average_possession, shots, shots_on_target, corners_total, points_per_game
- For event-level analysis: use columns match_id, team_name, from_player_name, to_player_name, event (pass/shot/pressure), outcome (complete/incomplete/goal), minute, x_start, y_start, x_end, y_end, pressure_applied
- For player analysis: use full_name, league, season, position, goals_overall, assists_overall, minutes_played_overall, yellow_cards_overall, nationality
- Print clearly labeled results with print() statements
- Include a brief comment at the top explaining what the model does
- Return ONLY Python code, no markdown fences, no explanations`;

const TOOLS = [
  {
    name: 'show_visualization',
    description: 'Display a football data visualization to the user in the chat',
    input_schema: {
      type: 'object',
      properties: {
        viz_type: {
          type: 'string',
          enum: ['passmap', 'pressure', 'quadrant', 'setpiece'],
          description: 'The type of visualization to render'
        }
      },
      required: ['viz_type']
    }
  },
  {
    name: 'navigate_to',
    description: 'Navigate the user to a specific section of the Pelada platform',
    input_schema: {
      type: 'object',
      properties: {
        view: {
          type: 'string',
          enum: ['dashboard', 'copilot', 'tactics', 'models', 'widgets', 'benchmarks', 'formation', 'history', 'calendar'],
          description: 'The platform section to navigate to'
        }
      },
      required: ['view']
    }
  }
];

async function callClaude(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  tools?: any[],
  maxTokens = 1024
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const body: any = {
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages
  };
  if (tools) body.tools = tools;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }
  return response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { message, history = [], mode = 'agent', matchContext } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Demo fallback when no API key is configured
    return res.json({
      final_response: getMockResponse(message, mode),
      visualization_type: null,
      navigation: null,
      debug_trace: ['No ANTHROPIC_API_KEY set — using demo mode']
    });
  }

  try {
    const conversationHistory = [
      ...history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    if (mode === 'widget') {
      const result = await callClaude(WIDGET_SYSTEM, conversationHistory, undefined, 2000);
      const code = result.content.find((b: any) => b.type === 'text')?.text || '';
      return res.json({
        final_response: 'Widget generated! Check the preview panel.',
        code: { lang: 'jsx', code: code.trim() },
        debug_trace: []
      });
    }

    if (mode === 'model') {
      const result = await callClaude(MODEL_SYSTEM, conversationHistory, undefined, 2000);
      const code = result.content.find((b: any) => b.type === 'text')?.text || '';
      return res.json({
        final_response: 'Model code generated! Review it and click Run to execute.',
        code: { lang: 'python', code: code.trim() },
        debug_trace: []
      });
    }

    // Agent mode with tool use — inject live match/player context into system prompt
    let agentSystem = FOOTBALL_AGENT_SYSTEM;
    if (matchContext) {
      const { matchInfo, selectedPlayer, playerStats } = matchContext;
      if (matchInfo) {
        agentSystem += `\n\n## Current session context\nThe user is viewing: **${matchInfo.home_team} vs ${matchInfo.away_team}** (${matchInfo.stage}, ${matchInfo.date}, score ${matchInfo.home_score}–${matchInfo.away_score}). This is StatsBomb WWC 2023 event data.`;
      }
      if (selectedPlayer) {
        agentSystem += `\nFocused player: **${selectedPlayer.name}** — ${selectedPlayer.position}, ${selectedPlayer.team}.`;
      }
      if (playerStats) {
        const { passes, passesComplete, shots, shotsOnTarget, pressures, xg } = playerStats;
        agentSystem += `\nTheir stats in this match (from StatsBomb event data): ${passes} passes (${passesComplete} complete), ${shots} shots (${shotsOnTarget} on target), ${pressures} defensive actions, xG ${xg}.`;
      }
    }
    const result = await callClaude(agentSystem, conversationHistory, TOOLS, 512);

    let final_response = '';
    let visualization_type: string | null = null;
    let navigation: string | null = null;

    for (const block of result.content) {
      if (block.type === 'text') {
        final_response = block.text;
      } else if (block.type === 'tool_use') {
        if (block.name === 'show_visualization') {
          visualization_type = block.input.viz_type;
        } else if (block.name === 'navigate_to') {
          navigation = block.input.view;
        }
      }
    }

    if (!final_response && visualization_type) {
      final_response = `Here's your ${visualization_type.replace('_', ' ')} visualization.`;
    }

    return res.json({
      final_response,
      visualization_type,
      navigation,
      debug_trace: [`model: ${result.model}`, `stop_reason: ${result.stop_reason}`]
    });

  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({
      error: error.message,
      final_response: 'Something went wrong. Please try again.',
      debug_trace: [error.message]
    });
  }
}

function getMockResponse(message: string, mode: string): string {
  if (mode === 'widget') return 'Widget generation requires ANTHROPIC_API_KEY.';
  if (mode === 'model') return 'Model generation requires ANTHROPIC_API_KEY.';
  const lower = message.toLowerCase();
  if (lower.includes('pass')) return 'I can show you a pass map. Make sure to set your ANTHROPIC_API_KEY for full functionality.';
  if (lower.includes('tactic')) return 'Head to the Tactics Studio to design formations and plays.';
  return 'Set ANTHROPIC_API_KEY in your environment to enable full AI capabilities.';
}
