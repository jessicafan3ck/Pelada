import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Upload,
  Sparkles,
  CheckCircle,
  Cpu,
  Database,
  ChevronRight,
  Terminal,
  ArrowLeft,
  FileJson,
  Github,
  X,
  Plus,
  Bot,
  Search,
  Filter,
  Star,
  GitBranch,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import PythonRunner from './PythonRunner';

const AGENT_URL = 'http://localhost:7337';

type ViewMode = 'discovery' | 'workbench' | 'create_model' | 'upload_dataset';

interface Dataset {
  id: string;
  name: string;
  type: string;
  access: string;
  features: string[]; // Parsed features
  isNew?: boolean;
}

interface Model {
  id: string;
  name: string;
  description: string;
  origin: 'builtin' | 'github' | 'generated';
  tags: string[];
  author: string;
  runs: number;
  rating: number;
  scope: 'public' | 'private';
}

export default function ModelPlayground() {
  const [viewMode, setViewMode] = useState<ViewMode>('discovery');
  const [uploadType, setUploadType] = useState<'dataset' | 'model'>('dataset');
  
  // --- Dashboard State ---
  const [selectedModel, setSelectedModel] = useState('lim_mvp');
  const [selectedDataset, setSelectedDataset] = useState('spain_japan_2025');
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'complete'>('idle');

  // --- Data ---
  const [models, setModels] = useState<Model[]>([
    {
      id: 'lim_mvp',
      name: 'LIM MVP',
      description: 'Living Influence Model - Events-Only Surrogate',
      origin: 'builtin',
      tags: ['influence', 'network'],
      author: 'Pelada Core',
      runs: 1247,
      rating: 4.8,
      scope: 'public'
    },
    {
      id: 'flair_index',
      name: 'Flair Index',
      description: 'Quantifies creative play and unpredictability',
      origin: 'github',
      tags: ['creativity', 'player-analysis'],
      author: '@jessicafan',
      runs: 834,
      rating: 4.6,
      scope: 'public'
    },
    {
      id: 'collapse_predictor',
      name: 'Collapse Predictor',
      description: 'ML model predicting network collapse events',
      origin: 'generated',
      tags: ['ml', 'prediction'],
      author: 'LLM Generated',
      runs: 412,
      rating: 4.3,
      scope: 'private'
    },
  ]);

  const [datasets, setDatasets] = useState<Dataset[]>([
    { id: 'spain_japan_2025', name: 'Spain vs Japan (U17 WWC 2025)', type: 'events', access: 'public', features: ['xG', 'pass_angle', 'pressure_index', 'ball_recovery_time'] },
    { id: 'real_madrid_q1', name: 'Real Madrid Q1 2025/26', type: 'events', access: 'public', features: ['xG', 'stamina_load', 'distance_covered'] },
    { id: 'barcelona_tracking', name: 'Barcelona Training Session', type: 'tracking', access: 'club_private', features: ['velocity', 'acceleration', 'heart_rate'] },
  ]);

  // --- Creator State ---
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string, code?: { lang: string; code: string }}[]>([
    { role: 'ai', text: 'I can help you build a new predictive model. Describe what you want to analyze and I\'ll generate Python code you can run directly.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [creatorSelectedDataset, setCreatorSelectedDataset] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Agent State ---
  const [agentConnected, setAgentConnected] = useState(false);
  const [agentOutput, setAgentOutput] = useState<{ type: string; line: string }[]>([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentWaiting, setAgentWaiting] = useState(false);
  const [agentLastCode, setAgentLastCode] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const agentOutputRef = useRef<HTMLDivElement>(null);

  const copyCmd = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${AGENT_URL}/health`, { signal: AbortSignal.timeout(2000) });
        const ok = r.ok;
        setAgentConnected(ok);
        if (ok) setAgentWaiting(false);
      } catch {
        setAgentConnected(false);
      }
    };
    check();
    // Poll faster (1 s) while user is waiting for agent to start, normal (5 s) otherwise
    const id = setInterval(check, agentWaiting ? 1000 : 5000);
    return () => clearInterval(id);
  }, [agentWaiting]);

  useEffect(() => {
    agentOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentOutput]);

  const interpretOutput = async () => {
    if (!agentOutput.length) return;
    const output = agentOutput.map(o => o.line).join('\n');
    setInterpreting(true);
    try {
      const res = await fetch('/api/langgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The following Python code was run:\n\`\`\`python\n${agentLastCode}\n\`\`\`\n\nOutput:\n${output}\n\nPlease interpret these results in plain language for a football analyst.`,
          history: [],
          mode: 'model'
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: data.final_response || 'Could not interpret the output.'
      }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Failed to interpret output.' }]);
    } finally {
      setInterpreting(false);
    }
  };

  const runInAgent = async (code: string) => {
    if (!agentConnected) return;
    setAgentLastCode(code);
    setAgentOutput([]);
    setAgentRunning(true);
    try {
      const res = await fetch(`${AGENT_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const { task_id } = await res.json();
      const evtSource = new EventSource(`${AGENT_URL}/stream/${task_id}`);
      evtSource.addEventListener('out',   (e) => setAgentOutput(p => [...p, { type: 'out',   line: (e as MessageEvent).data }]));
      evtSource.addEventListener('error', (e) => { setAgentOutput(p => [...p, { type: 'error', line: (e as MessageEvent).data || 'Error' }]); setAgentRunning(false); evtSource.close(); });
      evtSource.addEventListener('done',  ()  => { setAgentRunning(false); evtSource.close(); });
      evtSource.onerror = () => { setAgentRunning(false); evtSource.close(); };
    } catch (e) {
      setAgentOutput([{ type: 'error', line: String(e) }]);
      setAgentRunning(false);
    }
  };

  // --- Uploader State ---
  const [uploadStep, setUploadStep] = useState<'select' | 'parsing' | 'review'>('select');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedFeatures, setParsedFeatures] = useState<string[]>([]);

  // Handlers
  const handleChatSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userInput = chatInput;
    const datasetContext = creatorSelectedDataset
      ? `\n\nSelected dataset: ${datasets.find(d => d.id === creatorSelectedDataset)?.name}. Features: ${selectedFeatures.join(', ')}.`
      : '';

    setChatMessages(prev => [...prev, { role: 'user', text: userInput }]);
    setChatInput('');
    setIsGenerating(true);

    const history = chatMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.code ? `${m.text}\n\`\`\`python\n${m.code.code}\n\`\`\`` : m.text
    }));

    try {
      const res = await fetch('/api/langgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput + datasetContext,
          history,
          mode: 'model'
        })
      });
      const data = await res.json();

      const aiMsg: { role: 'ai'; text: string; code?: { lang: string; code: string } } = {
        role: 'ai',
        text: data.final_response || 'Model code generated. Review and run it below.'
      };
      if (data.code?.code) {
        aiMsg.code = data.code;
      }
      setChatMessages(prev => [...prev, aiMsg]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: 'Failed to connect to the AI backend. Make sure ANTHROPIC_API_KEY is set.'
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDatasetUpload = () => {
    setUploadStep('parsing');
    // Simulate Parsing
    setTimeout(() => {
      if (uploadType === 'dataset') {
          setParsedFeatures(['player_id', 'timestamp', 'lat', 'long', 'velocity_x', 'velocity_y', 'heart_rate_bpm', 'metabolic_power']);
      } else {
          setParsedFeatures(['Input: (Batch, 3, 224, 224)', 'Output: (Batch, 10)', 'Layer: Conv2d(3, 64)', 'Layer: BatchNorm2d(64)', 'Layer: ReLU()', 'Layer: MaxPool2d()']);
      }
      setUploadStep('review');
    }, 2000);
  };

  const confirmUpload = () => {
    if (uploadType === 'dataset') {
        const newDataset: Dataset = {
            id: 'uploaded_dataset_01',
            name: 'Uploaded Match Data (Parsed)',
            type: 'tracking',
            access: 'private',
            features: parsedFeatures,
            isNew: true
        };
        setDatasets([...datasets, newDataset]);
        setViewMode('workbench');
        setSelectedDataset(newDataset.id);
    } else {
        const newModel: Model = {
            id: 'uploaded_model_01',
            name: 'Custom Import v1',
            description: 'Imported from external repository',
            origin: 'github',
            tags: ['custom', 'imported'],
            author: 'User Import',
            runs: 0,
            rating: 0,
            scope: 'private'
        };
        setModels([...models, newModel]);
        setViewMode('workbench');
        setSelectedModel(newModel.id);
    }
  };

  const executionLogs = [
    { time: '00:01', message: `Loading dataset: ${selectedDataset}...`, level: 'info' },
    { time: '00:02', message: 'Dataset loaded: 2,847 events processed', level: 'success' },
    { time: '00:03', message: `Initializing ${selectedModel} engine...`, level: 'info' },
    { time: '00:05', message: 'Computing influence networks (Monte Carlo: 10,000 iterations)', level: 'info' },
    { time: '00:15', message: 'Simulation complete.', level: 'success' },
  ];

  // --- Views ---

  const renderDiscovery = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex justify-between items-end">
              <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                      <Cpu className="w-8 h-8 text-blue-500" />
                      Model Sandbox
                  </h1>
                  <p className="text-zinc-400 mt-2">Discover, test, and deploy advanced predictive models.</p>
              </div>
              <div className="flex gap-2">
                  <button 
                      onClick={() => setViewMode('upload_dataset')}
                      className="px-6 py-3 bg-white/5 border border-white/10 text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                      <Upload className="w-4 h-4" />
                      Import
                  </button>
                  <button 
                      onClick={() => setViewMode('create_model')}
                      className="px-6 py-3 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 flex items-center gap-2"
                  >
                      <Plus className="w-4 h-4" />
                      New Model
                  </button>
              </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
              <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-zinc-500" />
                  <input 
                      type="text" 
                      placeholder="Search models, datasets, or predictive engines..." 
                      className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-zinc-600"
                  />
              </div>
              <div className="h-8 w-px bg-white/10" />
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
              </button>
          </div>

          {/* Featured / Popular */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map(model => (
                  <div 
                      key={model.id}
                      onClick={() => {
                          setSelectedModel(model.id);
                          setViewMode('workbench');
                      }}
                      className="group bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] cursor-pointer hover:-translate-y-1"
                  >
                      <div className="h-40 bg-gradient-to-br from-blue-900/10 to-purple-900/10 relative overflow-hidden group-hover:from-blue-900/20 group-hover:to-purple-900/20 transition-colors">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(59,130,246,0.1),_transparent_70%)]" />
                          
                          <div className="absolute top-4 left-4">
                              <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                                  model.origin === 'builtin' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                  model.origin === 'generated' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                  'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                              }`}>
                                  {model.origin === 'builtin' ? 'Official' : model.origin === 'generated' ? 'AI Generated' : 'Community'}
                              </div>
                          </div>
                      </div>
                      
                      <div className="p-6">
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{model.name}</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed mb-4 min-h-[40px]">{model.description}</p>
                          
                          <div className="flex items-center gap-2 mb-4 flex-wrap">
                              {model.tags.map(tag => (
                                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/5 rounded text-zinc-500">
                                      {tag}
                                  </span>
                              ))}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                                  <Play className="w-3 h-3" /> {model.runs} Runs
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold">
                                  <Star className="w-3 h-3 fill-yellow-500" /> {model.rating}
                              </span>
                          </div>
                      </div>
                  </div>
              ))}
              
              {/* New Project Card */}
               <div 
                  onClick={() => setViewMode('create_model')}
                  className="group bg-white/[0.02] border border-dashed border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[300px]"
              >
                  <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                      <Plus className="w-8 h-8 text-zinc-500 group-hover:text-blue-400" />
                  </div>
                  <div className="text-center">
                      <h3 className="text-lg font-bold text-zinc-400 group-hover:text-blue-400 transition-colors">Create New Model</h3>
                      <p className="text-xs text-zinc-500 mt-1">From scratch or using AI</p>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderWorkbench = () => (
    <div className="h-full flex gap-8 animate-in fade-in zoom-in-95 duration-300 relative">
      <button 
          onClick={() => setViewMode('discovery')}
          className="absolute top-[-50px] left-0 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
      >
          <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>

      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
           <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Active Model</h2>
           {/* Current Model Card */}
           <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.15)] mb-6">
                <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-sm text-white">
                        {models.find(m => m.id === selectedModel)?.name}
                    </div>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {models.find(m => m.id === selectedModel)?.description}
                </p>
           </div>
           
           <div className="flex gap-2">
             <button 
               onClick={() => setViewMode('upload_dataset')}
               className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white border border-white/10 flex items-center justify-center gap-2 transition-all"
             >
               <Upload className="w-3 h-3" /> Data
             </button>
             <button 
                onClick={() => setViewMode('create_model')}
                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white border border-white/10 flex items-center justify-center gap-2 transition-all"
              >
               <GitBranch className="w-3 h-3" /> Fork
             </button>
           </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-black/20">
           <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Select Dataset</h2>
           <div className="space-y-2">
             {datasets.map((ds) => (
               <div
                 key={ds.id}
                 onClick={() => setSelectedDataset(ds.id)}
                 className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 group ${
                   selectedDataset === ds.id
                     ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.15)]'
                     : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5'
                 }`}
               >
                 <div className={`p-2 rounded-lg ${selectedDataset === ds.id ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                   <Database className={`w-4 h-4 ${selectedDataset === ds.id ? 'text-blue-400' : 'text-zinc-500'}`} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className={`text-sm font-medium truncate ${selectedDataset === ds.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                      {ds.name}
                      {ds.isNew && <span className="ml-2 text-[10px] text-green-400 font-bold uppercase">New</span>}
                   </div>
                   <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{ds.type} • {ds.access}</div>
                 </div>
                 {selectedDataset === ds.id && <ChevronRight className="w-4 h-4 text-blue-400" />}
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Main Execution Area */}
      <div className="flex-1 flex flex-col min-w-0 space-y-8">
        {/* Run Controls */}
        <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 p-8 flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
             <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/10 border border-purple-500/20 shadow-inner">
               <Cpu className="w-8 h-8 text-purple-400" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white tracking-tight">Simulation Engine</h2>
               <p className="text-sm text-zinc-400 font-medium">Ready to compute <span className="text-white">{models.find(m => m.id === selectedModel)?.name}</span></p>
             </div>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="text-right">
               <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Est. Runtime</div>
               <div className="text-lg font-mono text-white font-bold bg-black/40 px-3 py-1 rounded-lg border border-white/5">~14s</div>
            </div>
            <button
              onClick={() => setRunStatus('running')}
              className="px-8 py-4 bg-white text-black font-black uppercase tracking-wider text-xs rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Execute Run
            </button>
          </div>
        </div>

        {/* Console / Output */}
        <div className="flex-1 bg-black/60 backdrop-blur-xl rounded-3xl border border-white/5 flex flex-col overflow-hidden font-mono text-sm relative shadow-2xl">
          <div className="bg-black/40 border-b border-white/5 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-zinc-400">
              <Terminal className="w-4 h-4" />
              <span className="font-bold text-xs uppercase tracking-wider">Console Output</span>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto space-y-3 custom-scrollbar">
             {runStatus === 'idle' && (
               <div className="text-zinc-600 italic">Waiting for execution command...</div>
             )}
             {(runStatus === 'running' || runStatus === 'complete') && executionLogs.map((log, idx) => (
               <div key={idx} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 150}ms` }}>
                 <span className="text-zinc-600 select-none text-xs">[{log.time}]</span>
                 <span className={
                   log.level === 'success' ? 'text-green-400' : 
                   log.level === 'error' ? 'text-red-400' : 
                   'text-zinc-300'
                 }>
                   {log.message}
                 </span>
               </div>
             ))}
             {runStatus === 'running' && (
               <div className="flex gap-2 items-center text-purple-400 mt-2">
                 <span className="animate-pulse">_</span>
               </div>
             )}
          </div>

          {/* Visualization Overlay (Mock) */}
          {runStatus === 'complete' && (
             <div className="absolute top-16 right-16 w-80 p-6 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
               <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Sparkles className="w-3 h-3 text-purple-500" />
                 Quick Result
               </h3>
               <div className="space-y-4">
                 <div className="flex justify-between text-sm items-center">
                   <span className="text-zinc-300">Network Health</span>
                   <span className="text-green-400 font-bold font-mono">0.82</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full w-[82%] bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
                 </div>
                 
                 <div className="flex justify-between text-sm items-center pt-2">
                   <span className="text-zinc-300">Collapse Risk</span>
                   <span className="text-red-400 font-bold font-mono">0.42</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full w-[42%] bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]"></div>
                 </div>
               </div>
               <button className="mt-6 w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]">
                 View Full Report
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderModelCreator = () => (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right-8 duration-500">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('discovery')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Model Studio</h2>
            <p className="text-xs text-zinc-400">Design and configure new predictive engines.</p>
          </div>
        </div>
        {/* Agent connection status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
          agentConnected
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-white/5 border-white/10 text-zinc-500'
        }`}>
          {agentConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {agentConnected ? 'Agent Connected' : 'Agent Offline'}
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Chat Section */}
        <div className="w-1/2 flex flex-col bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
           <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="p-2 bg-purple-600/10 rounded-lg text-purple-400">
                 <Bot className="w-5 h-5" />
              </div>
              <div>
                 <h2 className="text-lg font-bold text-white">Model Architect AI</h2>
                 <p className="text-xs text-zinc-400">Describe your goal to generate a model structure.</p>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-white/5 border border-white/5 text-zinc-300 rounded-bl-none'
                  }`}>
                    <p className="mb-2">{msg.text}</p>
                    {msg.code && (
                      <div className="mt-3 space-y-2">
                        <PythonRunner code={msg.code.code} />
                        <button
                          onClick={() => runInAgent(msg.code!.code)}
                          disabled={!agentConnected || agentRunning}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 transition-all text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {agentRunning ? 'Running…' : agentConnected ? 'Run in Agent' : 'Agent Offline — run pelada-agent.py'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                   <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms'}} />
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms'}} />
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms'}} />
                   </div>
                </div>
              )}
           </div>

           <div className="p-6 border-t border-white/5 bg-white/[0.02]">
              <form onSubmit={handleChatSubmit} className="relative">
                 <input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="E.g., I want to predict player fatigue based on sprint distance..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-purple-500/50"
                 />
                 <button 
                    type="submit" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-purple-600 rounded-lg text-white transition-colors"
                 >
                    <ChevronRight className="w-4 h-4" />
                 </button>
              </form>
           </div>
        </div>

        {/* Right column — Configuration + Agent Output */}
        <div className="w-1/2 flex flex-col gap-4 min-h-0">

        {/* Agent install card — shown when offline */}
        {!agentConnected && (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-4 shrink-0">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pelada Agent</h3>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Run generated models on your machine. Your data never leaves.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { key: 'dl',  label: '1  Download', cmd: 'curl -O https://raw.githubusercontent.com/jessicafan3ck/Pelada/main/pelada-agent.py' },
                { key: 'dep', label: '2  Install',  cmd: 'pip install flask flask-cors' },
                { key: 'run', label: '3  Run',      cmd: 'python pelada-agent.py' },
              ].map(({ key, label, cmd }) => (
                <div key={key} className="rounded-xl bg-black/30 border border-white/5 px-3 py-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-0.5">{label}</div>
                    <code className="text-xs text-indigo-300 font-mono">{cmd}</code>
                  </div>
                  <button
                    onClick={() => copyCmd(key, cmd)}
                    className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    {copiedCmd === key ? '✓' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAgentWaiting(true)}
              className="w-full py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2"
            >
              {agentWaiting
                ? <><span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Waiting for connection…</>
                : "I've started the agent — connect"}
            </button>
          </div>
        )}

        {/* Agent output panel — shown when connected and output exists */}
        {agentConnected && agentOutput.length > 0 && (
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-green-500/20 flex flex-col overflow-hidden max-h-64 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
              <Terminal className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Agent Output</span>
              {agentRunning && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              <button
                onClick={interpretOutput}
                disabled={agentRunning || interpreting}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                {interpreting ? 'Interpreting…' : 'Interpret'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
              {agentOutput.map((o, i) => (
                <div key={i} className={o.type === 'error' ? 'text-red-400' : 'text-green-300'}>
                  {o.line}
                </div>
              ))}
              <div ref={agentOutputRef} />
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-xl">
           <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white mb-1">Configuration</h2>
              <p className="text-xs text-zinc-400">Link data sources and select features.</p>
           </div>

           <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Dataset Selector */}
              <div className="space-y-4">
                 <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-3 h-3" /> Target Dataset
                 </label>
                 <div className="grid grid-cols-1 gap-3">
                    {datasets.map(ds => (
                       <div 
                          key={ds.id}
                          onClick={() => {
                             setCreatorSelectedDataset(ds.id);
                             setSelectedFeatures(ds.features.slice(0, 3)); // Auto-select first few
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                             creatorSelectedDataset === ds.id 
                                ? 'bg-blue-600/10 border-blue-500/50' 
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                          }`}
                       >
                          <div className="flex items-center gap-3">
                             <div className={`w-3 h-3 rounded-full ${creatorSelectedDataset === ds.id ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-zinc-700'}`} />
                             <div>
                                <div className="text-sm font-bold text-white">{ds.name}</div>
                                <div className="text-[10px] text-zinc-400">{ds.type}</div>
                             </div>
                          </div>
                          {creatorSelectedDataset === ds.id && <CheckCircle className="w-4 h-4 text-blue-400" />}
                       </div>
                    ))}
                 </div>
              </div>

              {/* Feature Selection (Dynamic based on dataset) */}
              {creatorSelectedDataset && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <FileJson className="w-3 h-3" /> Available Features
                       </label>
                       <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Auto-Detected from Dataset</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                       {datasets.find(d => d.id === creatorSelectedDataset)?.features.map(feat => (
                          <div 
                             key={feat}
                             onClick={() => {
                                if (selectedFeatures.includes(feat)) {
                                   setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
                                } else {
                                   setSelectedFeatures([...selectedFeatures, feat]);
                                }
                             }}
                             className={`p-3 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                                selectedFeatures.includes(feat)
                                   ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                   : 'bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300'
                             }`}
                          >
                             {feat}
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
           
           <div className="p-6 border-t border-white/5 bg-white/[0.02]">
              <button className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-200 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={!creatorSelectedDataset}>
                 Compile Model
              </button>
           </div>
        </div>
        {/* end right column wrapper */}
        </div>
      </div>
    </div>
  );

  const renderDatasetUploader = () => (
     <div className="h-full flex items-center justify-center animate-in zoom-in-50 duration-300">
        <div className="w-[600px] bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
           <button 
              onClick={() => setViewMode('discovery')}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
           >
              <X className="w-5 h-5" />
           </button>

           <div className="p-8 text-center border-b border-white/5">
              <h2 className="text-2xl font-bold text-white mb-2">Import Resource</h2>
              
              <div className="flex justify-center gap-4 mt-4 mb-2">
                   <button 
                      onClick={() => setUploadType('dataset')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${uploadType === 'dataset' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                   >
                      Dataset
                   </button>
                   <button 
                      onClick={() => setUploadType('model')}
                       className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${uploadType === 'model' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                   >
                      Model
                   </button>
              </div>
              <p className="text-zinc-400 text-sm">
                 {uploadType === 'dataset' ? 'Upload CSV/JSON or connect a data repository.' : 'Import model weights (.pt, .h5) or GitHub repositories.'}
              </p>
           </div>

           <div className="p-8 space-y-8">
              {uploadStep === 'select' && (
                 <>
                    {/* Upload Box */}
                    <div 
                       onClick={handleDatasetUpload}
                       className="h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                    >
                       <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                          <Upload className="w-8 h-8 text-zinc-500 group-hover:text-purple-400" />
                       </div>
                       <div className="text-center">
                          <span className="text-sm font-bold text-zinc-400 group-hover:text-white block">Click to Browse</span>
                          <span className="text-xs text-zinc-600">Supports .csv, .json, .parquet</span>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="h-px flex-1 bg-white/10" />
                       <span className="text-xs font-bold text-zinc-600 uppercase">OR</span>
                       <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-3 transition-colors">
                       <Github className="w-5 h-5" />
                       Import from GitHub
                    </button>
                 </>
              )}

              {uploadStep === 'parsing' && (
                 <div className="text-center py-10">
                    <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-white font-bold mb-1">Parsing Structure...</h3>
                    <p className="text-zinc-500 text-xs">Identifying headers and feature columns</p>
                 </div>
              )}

              {uploadStep === 'review' && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-bold justify-center mb-4">
                       <CheckCircle className="w-5 h-5" /> Successfully Parsed
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
                       <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Detected Features</h4>
                       <div className="grid grid-cols-2 gap-2">
                          {parsedFeatures.map(f => (
                             <div key={f} className="text-xs font-mono text-zinc-300 bg-black/20 px-2 py-1 rounded border border-white/5">{f}</div>
                          ))}
                       </div>
                    </div>
                    <button 
                       onClick={confirmUpload}
                       className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                       Confirm Import
                    </button>
                 </div>
              )}
           </div>
        </div>
     </div>
  );

  return (
    <div className="h-[calc(100vh-140px)]">
      {viewMode === 'discovery' && renderDiscovery()}
      {viewMode === 'workbench' && renderWorkbench()}
      {viewMode === 'create_model' && renderModelCreator()}
      {viewMode === 'upload_dataset' && renderDatasetUploader()}
    </div>
  );
}