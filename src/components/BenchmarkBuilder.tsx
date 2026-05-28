import { useState } from 'react';
import { 
  Activity, 
  Target, 
  Plus, 
  Save, 
  Play, 
  Lock, 
  Globe, 
  MoreHorizontal,
  CheckCircle,
  X,
  Search,
  Filter,
  BarChart,
  ArrowLeft,
  Star,
  Download,
  Shield
} from 'lucide-react';

type ViewMode = 'discovery' | 'builder';

export default function BenchmarkBuilder() {
  const [viewMode, setViewMode] = useState<ViewMode>('discovery');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  
  const benchmarks = [
    {
      id: 1,
      name: 'High Press Resilience',
      description: 'Evaluates network stability against top-tier pressing intensity.',
      metrics: ['Pass Completion > 82%', 'Turnovers < 12/game', 'Network Health > 0.75'],
      status: 'active',
      scope: 'public',
      author: 'UEFA Lab',
      downloads: '5.2k',
      rating: 4.9,
      tags: ['Pressing', 'Stability']
    },
    {
      id: 2,
      name: 'Counter-Attack Efficiency',
      description: 'Measures speed and conversion rate of transition sequences.',
      metrics: ['Transition Time < 12s', 'xG/Shot > 0.15', 'Verticality Index > 0.8'],
      status: 'draft',
      scope: 'private',
      author: 'My Studio',
      downloads: '-',
      rating: 0,
      tags: ['Counter', 'Speed']
    },
    {
      id: 3,
      name: 'Possession Dominance',
      description: 'Standard possession test for control-based tactics.',
      metrics: ['Possession > 65%', 'Field Tilt > 70%'],
      status: 'active',
      scope: 'public',
      author: 'City Group',
      downloads: '8.9k',
      rating: 4.8,
      tags: ['Possession', 'Control']
    }
  ];

  const renderDiscovery = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex justify-between items-end">
              <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                      <Activity className="w-8 h-8 text-pink-400" />
                      Benchmark Suite
                  </h1>
                  <p className="text-zinc-400 mt-2">Define success criteria and stress-test your tactical systems.</p>
              </div>
              <button 
                  onClick={() => setViewMode('builder')}
                  className="px-6 py-3 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 flex items-center gap-2"
              >
                  <Plus className="w-4 h-4" />
                  New Test Suite
              </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
              <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-zinc-500" />
                  <input 
                      type="text" 
                      placeholder="Search standardized tests, KPIs, or stress tests..." 
                      className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-zinc-600"
                  />
              </div>
              <div className="h-8 w-px bg-white/10" />
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
              </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                  { title: 'Standardized Tests', icon: CheckCircle, desc: 'FIFA/UEFA approved metrics', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                  { title: 'Stress Tests', icon: Activity, desc: 'Extreme scenarios & edge cases', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                  { title: 'League Specific', icon: Shield, desc: 'PL, La Liga, Serie A profiles', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              ].map((cat, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${cat.border} ${cat.bg} hover:brightness-110 transition-all cursor-pointer group`}>
                      <div className="flex items-center justify-between mb-4">
                          <cat.icon className={`w-8 h-8 ${cat.color}`} />
                          <ArrowLeft className="w-4 h-4 text-white rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{cat.title}</h3>
                      <p className="text-xs text-zinc-400">{cat.desc}</p>
                  </div>
              ))}
          </div>

          {/* Benchmark List */}
          <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-yellow-500" />
                  Global Standards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {benchmarks.map((b) => (
                      <div 
                          key={b.id} 
                          onClick={() => setViewMode('builder')}
                          className="group bg-[#09090b] border border-white/5 rounded-2xl p-6 hover:border-yellow-500/30 transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] cursor-pointer hover:-translate-y-1 flex flex-col h-full"
                      >
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-yellow-500/10 group-hover:border-yellow-500/20 transition-colors">
                                  <BarChart className="w-6 h-6 text-zinc-400 group-hover:text-yellow-500" />
                              </div>
                              <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                  b.scope === 'public' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}>
                                  {b.scope}
                              </div>
                          </div>
                          
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-500 transition-colors">{b.name}</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed mb-6 line-clamp-2">{b.description}</p>
                          
                          <div className="space-y-2 mt-auto">
                              {b.metrics.slice(0, 2).map((m, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-300 font-mono bg-black/40 px-2 py-1.5 rounded border border-white/5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                      {m}
                                  </div>
                              ))}
                          </div>

                          <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
                              <span className="text-xs text-zinc-500 font-medium">{b.author}</span>
                              <div className="flex items-center gap-3">
                                  {b.scope === 'public' && (
                                      <>
                                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                                              <Download className="w-3.5 h-3.5" /> {b.downloads}
                                          </span>
                                          <span className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                                              <Star className="w-3.5 h-3.5 fill-yellow-500" /> {b.rating}
                                          </span>
                                      </>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const renderBuilder = () => (
    <div className="h-[calc(100vh-140px)] flex gap-8 animate-in fade-in zoom-in-95 duration-300 relative">
      <button 
          onClick={() => setViewMode('discovery')}
          className="absolute top-[-50px] left-0 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
      >
          <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>

      {/* Sidebar: Library */}
      <div className="w-80 flex flex-col bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
           <div className="flex items-center justify-between mb-4">
               <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active List</span>
               <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-300">{benchmarks.length} items</span>
           </div>
          <button className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-pink-600/25 group">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            New Benchmark
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
           {benchmarks.map((b) => (
             <div key={b.id} className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 ${
                b.id === 1 
                  ? 'bg-pink-900/10 border-pink-500/30' 
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-pink-500/30'
             }`}>
               <div className="flex justify-between items-start mb-2">
                 <span className={`text-sm font-bold transition-colors ${b.id === 1 ? 'text-white' : 'text-zinc-300 group-hover:text-pink-400'}`}>{b.name}</span>
                 {b.scope === 'public' ? (
                   <Globe className="w-3 h-3 text-zinc-500" />
                 ) : (
                   <Lock className="w-3 h-3 text-amber-500" />
                 )}
               </div>
               <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">{b.description}</p>
               <div className="flex flex-wrap gap-1.5">
                 {b.metrics.slice(0, 2).map((m, i) => (
                   <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-zinc-400 border border-white/5 font-medium">{m}</span>
                 ))}
                 {b.metrics.length > 2 && <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-zinc-500 font-medium">+ {b.metrics.length - 2}</span>}
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Main Builder */}
      <div className="flex-1 flex flex-col min-w-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02] backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-[0_0_10px_rgba(244,114,182,0.1)]">
              <Activity className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Benchmark Suite</h2>
              <p className="text-xs text-zinc-400 font-medium">Define success criteria for tactics & models</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
               <button 
                 onClick={() => setPrivacy('public')}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                   privacy === 'public' 
                     ? 'bg-white/10 text-white shadow' 
                     : 'text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 <Globe className="w-3 h-3" /> Public
               </button>
               <button 
                 onClick={() => setPrivacy('private')}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                   privacy === 'private' 
                     ? 'bg-amber-500/10 text-amber-500 shadow' 
                     : 'text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 <Lock className="w-3 h-3" /> Private
               </button>
            </div>
            <button className="px-5 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <Save className="w-4 h-4" />
              Save Benchmark
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
           <div className="max-w-4xl mx-auto space-y-10">
             {/* Basic Info */}
             <div className="space-y-6">
               <div>
                 <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Benchmark Name</label>
                 <input 
                   type="text" 
                   defaultValue="Low Block Penetration Test"
                   className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all font-medium text-lg placeholder:text-zinc-600"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Description</label>
                 <textarea 
                   defaultValue="Assesses ability to generate xG against a compact 4-4-2 defensive block."
                   className="w-full h-28 bg-black/20 border border-white/10 rounded-xl px-5 py-3 text-white resize-none focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all text-sm leading-relaxed placeholder:text-zinc-600"
                 />
               </div>
             </div>

             {/* Metrics Builder */}
             <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                   <Target className="w-4 h-4 text-pink-400" />
                   Success Metrics
                 </h3>
                 <button className="text-xs text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 uppercase tracking-wider bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20 hover:bg-pink-500/20 transition-all">
                   <Plus className="w-3 h-3" /> Add Metric
                 </button>
               </div>
               
               <div className="space-y-3">
                 {[
                   { label: 'Network Health (Final 3rd)', op: '>', val: '0.70', unit: 'Index' },
                   { label: 'Expected Goals (xG)', op: '>', val: '1.85', unit: 'xG' },
                   { label: 'Counter-Press Recovery', op: '<', val: '5.0', unit: 'sec' }
                 ].map((m, i) => (
                   <div key={i} className="flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-white/10 transition-all shadow-sm">
                     <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                       <CheckCircle className="w-4 h-4 text-green-500" />
                     </div>
                     <div className="flex-1 grid grid-cols-12 gap-6 items-center">
                       <div className="col-span-5">
                         <input type="text" defaultValue={m.label} className="w-full bg-transparent text-sm text-white font-medium focus:outline-none placeholder:text-zinc-600" />
                       </div>
                       <div className="col-span-2">
                         <select className="w-full bg-[#18181b] rounded-lg border border-white/10 text-sm text-zinc-300 font-bold focus:outline-none text-center py-1">
                           <option>{m.op}</option>
                           <option>=</option>
                           <option>&lt;</option>
                         </select>
                       </div>
                       <div className="col-span-3">
                         <input type="text" defaultValue={m.val} className="w-full bg-black/40 rounded-lg px-2 py-1 text-sm text-white font-mono font-bold focus:outline-none text-center border border-white/10 focus:border-pink-500/50" />
                       </div>
                       <div className="col-span-2 text-right">
                         <span className="text-xs text-zinc-500 font-medium">{m.unit}</span>
                       </div>
                     </div>
                     <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg text-red-400 transition-all">
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
               </div>
             </div>

             {/* Test Scenarios */}
             <div>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                   <Play className="w-4 h-4 text-blue-400" />
                   Simulation Scenarios
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-black/20 border border-white/10 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-sm border border-blue-500/20 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                      ATM
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">vs Atletico Madrid</div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">Low Block • 5-3-2</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-blue-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-5 bg-black/20 border border-white/10 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center font-black text-red-500 text-sm border border-red-500/20 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                      LIV
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">vs Liverpool</div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">Gegenpress • 4-3-3</div>
                    </div>
                    <div className="ml-auto w-5 h-5 rounded-full border border-zinc-700 group-hover:border-red-500 transition-colors" />
                  </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
        {viewMode === 'discovery' ? renderDiscovery() : renderBuilder()}
    </div>
  );
}