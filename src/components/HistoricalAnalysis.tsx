import { useState } from 'react';
import { Calendar, TrendingDown, AlertCircle, Search, ExternalLink, Filter, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function HistoricalAnalysis() {
  const [selectedTeam, setSelectedTeam] = useState('real_madrid');
  const [selectedPeriod, setSelectedPeriod] = useState('season');

  const teams = [
    { id: 'real_madrid', name: 'Real Madrid', league: 'La Liga' },
    { id: 'barcelona', name: 'Barcelona', league: 'La Liga' },
    { id: 'man_united', name: 'Manchester United', league: 'Premier League' },
  ];

  const historicalData = [
    { match: 'Match 1', date: 'Aug 15', health: 85, collapse: 0.12, lambda: 0.82, result: 'W' },
    { match: 'Match 2', date: 'Aug 22', health: 82, collapse: 0.15, lambda: 0.79, result: 'W' },
    { match: 'Match 3', date: 'Aug 29', health: 79, collapse: 0.18, lambda: 0.76, result: 'D' },
    { match: 'Match 4', date: 'Sep 5', health: 74, collapse: 0.24, lambda: 0.71, result: 'L' },
    { match: 'Match 5', date: 'Sep 12', health: 68, collapse: 0.32, lambda: 0.65, result: 'L' },
    { match: 'Match 6', date: 'Sep 19', health: 71, collapse: 0.28, lambda: 0.68, result: 'D' },
    { match: 'Match 7', date: 'Sep 26', health: 76, collapse: 0.21, lambda: 0.74, result: 'W' },
    { match: 'Match 8', date: 'Oct 3', health: 80, collapse: 0.17, lambda: 0.78, result: 'W' },
    { match: 'Match 9', date: 'Oct 10', health: 78, collapse: 0.19, lambda: 0.76, result: 'W' },
    { match: 'Match 10', date: 'Oct 17', health: 83, collapse: 0.14, lambda: 0.81, result: 'W' },
  ];

  const shockEvents = [
    {
      id: 1,
      date: 'Sep 5, 2025',
      event: 'Key midfielder injury (Player #10)',
      impact: -0.11,
      description: 'Network health dropped 8% following injury to central playmaker',
      recovery: '2 weeks',
      news_source: 'ESPN FC',
    },
    {
      id: 2,
      date: 'Sep 8, 2025',
      event: 'Tactical formation change: 4-3-3 → 4-4-2',
      impact: -0.05,
      description: 'Formation adjustment resulted in temporary network instability',
      recovery: '1 week',
      news_source: 'Internal',
    },
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
       {/* Sidebar Controls */}
       <div className="w-80 flex flex-col bg-[#18181b] rounded-xl border border-white/5 overflow-hidden">
         <div className="p-4 border-b border-white/5 bg-[#18181b]">
           <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Filters</h2>
           <div className="space-y-4">
             <div>
               <label className="text-xs text-zinc-500 mb-1.5 block">Team Selection</label>
               <div className="relative">
                 <select
                   value={selectedTeam}
                   onChange={(e) => setSelectedTeam(e.target.value)}
                   className="w-full bg-[#09090b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-green-500/50"
                 >
                   {teams.map((team) => (
                     <option key={team.id} value={team.id}>{team.name}</option>
                   ))}
                 </select>
                 <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
               </div>
             </div>

             <div>
               <label className="text-xs text-zinc-500 mb-1.5 block">Time Period</label>
               <div className="grid grid-cols-2 gap-2">
                 {['Season', 'Month', 'Quarter', 'Custom'].map(period => (
                   <button
                     key={period}
                     onClick={() => setSelectedPeriod(period.toLowerCase())}
                     className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                       selectedPeriod === period.toLowerCase()
                         ? 'bg-green-600/10 border-green-500/50 text-green-400'
                         : 'bg-[#09090b] border-white/5 text-zinc-400 hover:text-white'
                     }`}
                   >
                     {period}
                   </button>
                 ))}
               </div>
             </div>
           </div>
         </div>

         <div className="flex-1 p-4 bg-[#18181b] space-y-4">
           <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Shock Events</h2>
           <div className="space-y-3">
             {shockEvents.map((shock) => (
               <div key={shock.id} className="p-3 bg-[#09090b] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                 <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500">
                   <Calendar className="w-3 h-3" />
                   {shock.date}
                 </div>
                 <div className="text-sm font-medium text-white mb-1">{shock.event}</div>
                 <div className="flex items-center justify-between mt-2">
                   <span className={`text-xs font-bold ${shock.impact > 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {shock.impact > 0 ? '+' : ''}{shock.impact} λ₂
                   </span>
                   <a href="#" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                     Source <ExternalLink className="w-3 h-3" />
                   </a>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex flex-col min-w-0 gap-6 overflow-y-auto pr-2">
         {/* Charts Row */}
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           <div className="bg-[#18181b] border border-white/5 rounded-xl p-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-semibold text-white">Network Health History</h3>
               <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors">
                 <Download className="w-4 h-4" />
               </button>
             </div>
             <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={historicalData}>
                   <defs>
                     <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                   <XAxis dataKey="date" stroke="#71717a" tick={{fontSize: 12}} />
                   <YAxis stroke="#71717a" tick={{fontSize: 12}} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                     itemStyle={{ color: '#e4e4e7' }}
                   />
                   <Area type="monotone" dataKey="health" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </div>

           <div className="bg-[#18181b] border border-white/5 rounded-xl p-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-semibold text-white">Collapse Risk Trends</h3>
               <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors">
                 <Download className="w-4 h-4" />
               </button>
             </div>
             <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={historicalData}>
                   <defs>
                     <linearGradient id="colorCollapse" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                   <XAxis dataKey="date" stroke="#71717a" tick={{fontSize: 12}} />
                   <YAxis stroke="#71717a" tick={{fontSize: 12}} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                     itemStyle={{ color: '#e4e4e7' }}
                   />
                   <Area type="monotone" dataKey="collapse" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCollapse)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </div>
         </div>

         {/* Detailed Table */}
         <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
           <div className="px-6 py-4 border-b border-white/5">
             <h3 className="font-semibold text-white">Detailed Match Logs</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-[#09090b] text-zinc-400 uppercase text-xs font-semibold">
                 <tr>
                   <th className="px-6 py-3">Match</th>
                   <th className="px-6 py-3">Date</th>
                   <th className="px-6 py-3">Network Health</th>
                   <th className="px-6 py-3">Collapse Risk</th>
                   <th className="px-6 py-3">Lambda 2</th>
                   <th className="px-6 py-3">Result</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {historicalData.map((match, idx) => (
                   <tr key={idx} className="hover:bg-white/5 transition-colors">
                     <td className="px-6 py-3 font-medium text-white">{match.match}</td>
                     <td className="px-6 py-3 text-zinc-500">{match.date}</td>
                     <td className="px-6 py-3">
                       <div className="flex items-center gap-2">
                         <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full ${match.health > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                             style={{width: `${match.health}%`}}
                           />
                         </div>
                         <span className="text-zinc-300">{match.health}%</span>
                       </div>
                     </td>
                     <td className="px-6 py-3 text-zinc-300">{match.collapse}</td>
                     <td className="px-6 py-3 text-zinc-300">{match.lambda}</td>
                     <td className="px-6 py-3">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                         match.result === 'W' ? 'bg-green-500/10 text-green-400' :
                         match.result === 'D' ? 'bg-yellow-500/10 text-yellow-400' :
                         'bg-red-500/10 text-red-400'
                       }`}>
                         {match.result}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       </div>
    </div>
  );
}
