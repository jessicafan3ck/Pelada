import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  FileText, 
  Activity, 
  Target, 
  Download,
  MoreHorizontal
} from 'lucide-react';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState('May 2025');
  const [selectedDay, setSelectedDay] = useState<number | null>(24);

  // Mock Data for matches
  const matches = [
    {
      id: 1,
      day: 24,
      date: 'Sat 24 May',
      home: 'Man City',
      away: 'Real Madrid',
      score: '2 - 1',
      status: 'FT',
      competition: 'Champions League',
      type: 'Match Report',
      tacticsSaved: true,
      dataSaved: true
    },
    {
      id: 2,
      day: 18,
      date: 'Sun 18 May',
      home: 'Liverpool',
      away: 'Man City',
      score: '1 - 1',
      status: 'FT',
      competition: 'Premier League',
      type: 'Match Report',
      tacticsSaved: true,
      dataSaved: true
    },
    {
      id: 3,
      day: 28,
      date: 'Wed 28 May',
      home: 'Man City',
      away: 'Arsenal',
      score: null,
      status: 'Upcoming',
      competition: 'Premier League',
      type: 'Pre-Match',
      tacticsSaved: false,
      dataSaved: false
    }
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8">
      {/* Calendar Sidebar */}
      <div className="w-96 flex flex-col bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                 <CalendarIcon className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-lg">{currentMonth}</span>
           </div>
           <div className="flex gap-1">
              <button className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                 <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                 <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Calendar Grid (Simple) */}
        <div className="p-6 grid grid-cols-7 gap-2">
           {['S','M','T','W','T','F','S'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-zinc-500 py-2">{d}</div>
           ))}
           {days.map(day => {
              const hasMatch = matches.some(m => m.day === day);
              const isSelected = selectedDay === day;
              
              return (
                 <button 
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative group ${
                       isSelected
                          ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                          : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                 >
                    {day}
                    {hasMatch && (
                       <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
                    )}
                 </button>
              );
           })}
        </div>

        {/* Filter List */}
        <div className="flex-1 p-6 border-t border-white/5">
           <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Competitions</h4>
           <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    <span className="text-sm font-medium text-white">Premier League</span>
                 </div>
                 <span className="text-xs text-zinc-500">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    <span className="text-sm font-medium text-white">Champions League</span>
                 </div>
                 <span className="text-xs text-zinc-500">5</span>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content: Match List / Details */}
      <div className="flex-1 flex flex-col min-w-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-xl">
         <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
               Games & Analysis
               <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-zinc-400 font-medium border border-white/5">Archive</span>
            </h2>
            
            <div className="flex gap-3">
               <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input 
                     type="text" 
                     placeholder="Search archive..." 
                     className="bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50 w-64"
                  />
               </div>
               <button className="p-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                  <Filter className="w-5 h-5" />
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {matches.map((match) => (
               <div key={match.id} className="mb-6 bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden group hover:border-green-500/30 transition-all shadow-lg">
                  {/* Match Header */}
                  <div className="p-6 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
                     <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center min-w-[60px]">
                           <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{match.competition}</span>
                           <span className="text-sm text-zinc-300">{match.date}</span>
                        </div>
                        
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <span className="text-xl font-bold text-white block">{match.home}</span>
                              <span className="text-xs text-zinc-500 uppercase tracking-wider">Home</span>
                           </div>
                           <div className="px-4 py-2 bg-black rounded-lg border border-white/10 text-xl font-black text-white font-mono shadow-inner min-w-[80px] text-center">
                              {match.score || 'VS'}
                           </div>
                           <div>
                              <span className="text-xl font-bold text-white block">{match.away}</span>
                              <span className="text-xs text-zinc-500 uppercase tracking-wider">Away</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        {match.status === 'FT' ? (
                           <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-full">Full Time</span>
                        ) : (
                           <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full">Upcoming</span>
                        )}
                        <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                           <MoreHorizontal className="w-5 h-5" />
                        </button>
                     </div>
                  </div>

                  {/* Artifacts / Saved Data */}
                  <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex gap-4">
                     <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/card flex items-center gap-3">
                           <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover/card:bg-blue-500 group-hover/card:text-white transition-colors">
                              <FileText className="w-4 h-4" />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-zinc-200">Match Report</div>
                              <div className="text-[10px] text-zinc-500">PDF • 2.4 MB</div>
                           </div>
                           <Download className="w-4 h-4 text-zinc-600 ml-auto group-hover/card:text-white" />
                        </div>

                        <div className={`p-3 bg-white/5 rounded-xl border border-white/5 transition-all flex items-center gap-3 ${match.tacticsSaved ? 'hover:bg-white/10 cursor-pointer group/card' : 'opacity-50 cursor-not-allowed'}`}>
                           <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover/card:bg-purple-500 group-hover/card:text-white transition-colors">
                              <Target className="w-4 h-4" />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-zinc-200">Tactical Setup</div>
                              <div className="text-[10px] text-zinc-500">{match.tacticsSaved ? 'Saved in Studio' : 'Not Generated'}</div>
                           </div>
                           {match.tacticsSaved && <ArrowRight className="w-4 h-4 text-zinc-600 ml-auto group-hover/card:text-white" />}
                        </div>

                        <div className={`p-3 bg-white/5 rounded-xl border border-white/5 transition-all flex items-center gap-3 ${match.dataSaved ? 'hover:bg-white/10 cursor-pointer group/card' : 'opacity-50 cursor-not-allowed'}`}>
                           <div className="p-2 bg-green-500/10 rounded-lg text-green-400 group-hover/card:bg-green-500 group-hover/card:text-white transition-colors">
                              <Activity className="w-4 h-4" />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-zinc-200">Performance Data</div>
                              <div className="text-[10px] text-zinc-500">{match.dataSaved ? 'Dataset Available' : 'No Data'}</div>
                           </div>
                           {match.dataSaved && <Download className="w-4 h-4 text-zinc-600 ml-auto group-hover/card:text-white" />}
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
