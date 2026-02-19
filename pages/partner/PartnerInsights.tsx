import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useCouples } from '../../contexts/CouplesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, differenceInDays, parseISO } from 'date-fns';

const PartnerInsights: React.FC = () => {
  const { partnerData } = useCouples();
  const { theme, primaryColor } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'analytics' | 'logs'>('analytics');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Default data
  const logs = partnerData?.logs || [];
  const profile = partnerData?.profile;

  // --- Calculations for Charts ---
  const getCycleHistory = () => {
    const periodLogs = logs
        .filter(l => l.flow && l.flow !== 'spotting')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (periodLogs.length === 0) return [];

    const cycles: { start: string; length: number }[] = [];
    let currentCycleStart = periodLogs[0].date;
    let lastLogDate = periodLogs[0].date;

    for (let i = 1; i < periodLogs.length; i++) {
        const currentLogDate = periodLogs[i].date;
        const diff = differenceInDays(parseISO(currentLogDate), parseISO(lastLogDate));
        
        if (diff > 10) {
            const length = differenceInDays(parseISO(currentLogDate), parseISO(currentCycleStart));
            cycles.push({ start: currentCycleStart, length });
            currentCycleStart = currentLogDate;
        }
        lastLogDate = currentLogDate;
    }
    
    return cycles.slice(-6).map(c => ({
        month: format(parseISO(c.start), 'MMM'),
        length: c.length
    }));
  };

  const chartData = getCycleHistory();

  // Symptom Analysis
  const topSymptoms = useMemo(() => {
      const counts: Record<string, number> = {};
      logs.forEach(log => {
          log.symptoms?.forEach(s => {
              counts[s] = (counts[s] || 0) + 1;
          });
      });
      
      return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([name, count]) => ({
              name: name.replace('-', ' '),
              level: `${count} times`,
              width: `${Math.min((count / logs.length) * 100 * 5, 100)}%`,
              color: 'bg-purple-500'
          }));
  }, [logs]);

  // AI Insights Generator
  const aiSummary = useMemo(() => {
      if (logs.length === 0) return "No data available yet to generate insights.";
      
      const recentLogs = logs.slice(0, 7);
      const moodCounts: Record<string, number> = {};
      recentLogs.forEach(l => l.moods?.forEach(m => moodCounts[m] = (moodCounts[m] || 0) + 1));
      const topMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]?.[0];
      
      const symptomCounts: Record<string, number> = {};
      recentLogs.forEach(l => l.symptoms?.forEach(s => symptomCounts[s] = (symptomCounts[s] || 0) + 1));
      const topSymptom = Object.entries(symptomCounts).sort(([,a], [,b]) => b - a)[0]?.[0];

      let summary = `${profile?.full_name || 'Partner'} has logged ${logs.length} entries. `;
      if (topMood) summary += `Recently, ' ${topMood}' has been a dominant mood. `;
      if (topSymptom) summary += `Frequent reports of '${topSymptom}' suggest keeping an eye on comfort levels. `;
      else summary += "No significant symptoms reported recently. ";
      
      return summary;
  }, [logs, profile]);

  return (
    <div className={`pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#121014]' : 'bg-[#FDFCF8]'}`}>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-[#121014]'}`}>
            Insights
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
             for {profile?.full_name || 'Partner'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 rounded-2xl mb-8 ${isDark ? 'bg-[#1E1E1E]' : 'bg-gray-100'}`}>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative ${
                activeTab === 'analytics' 
                ? 'text-white' 
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {activeTab === 'analytics' && (
                <motion.div
                    layoutId="activeTabInsights"
                    className="absolute inset-0 rounded-xl shadow-md bg-[#984369]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className="relative z-10">Analytics & AI</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative ${
                activeTab === 'logs' 
                ? 'text-white' 
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
             {activeTab === 'logs' && (
                <motion.div
                    layoutId="activeTabInsights"
                    className="absolute inset-0 rounded-xl shadow-md bg-[#984369]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className="relative z-10">Log History</span>
          </button>
      </div>

      <AnimatePresence mode="wait">
      {activeTab === 'analytics' ? (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6"
          >
            {/* AI Summary Card */}
            <div className="rounded-[2rem] bg-gradient-to-br from-[#984369] to-[#5C2E42] p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
                        <span className="material-symbols-outlined text-white">auto_awesome</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1">AI Insights</h3>
                        <p className="text-white/90 text-sm leading-relaxed font-medium">
                            {aiSummary}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cycle History Chart */}
            <section className={`rounded-[2rem] p-6 shadow-xl transition-all ${isDark ? 'bg-[#1E1E1E] shadow-none border border-white/5' : 'bg-white shadow-gray-200/50 border border-gray-100'}`}>
                 <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cycle Histroy</h2>
                 <div className="h-48 w-full">
                     {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#E5E7EB"} opacity={0.3} />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                                    dy={10}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1E1E1E' : '#FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                />
                                <Bar 
                                    dataKey="length" 
                                    fill="#984369" 
                                    radius={[6, 6, 6, 6]} 
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                     ) : (
                         <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                             Not enough data for chart
                         </div>
                     )}
                 </div>
            </section>

            {/* Symptoms Analysis */}
            <section className={`rounded-[2rem] p-6 shadow-xl transition-all ${isDark ? 'bg-[#1E1E1E] shadow-none border border-white/5' : 'bg-white shadow-gray-200/50 border border-gray-100'}`}>
                 <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>Common Symptoms</h3>
                 {topSymptoms.length > 0 ? (
                     <div className="flex flex-col gap-5">
                        {topSymptoms.map((s) => (
                            <div key={s.name} className="flex flex-col gap-2">
                                 <div className="flex justify-between text-sm font-semibold">
                                     <span className={`capitalize ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{s.name}</span>
                                     <span className="text-gray-400">{s.level}</span>
                                 </div>
                                 <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: s.width }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full rounded-full ${s.color}`} 
                                     />
                                 </div>
                            </div>
                        ))}
                     </div>
                 ) : (
                     <p className="text-gray-400 text-sm">No symptoms recorded yet.</p>
                 )}
            </section>
          </motion.div>
      ) : (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col"
          >
             {/* View Toggle */}
             <div className="flex justify-end mb-4">
                 <div className={`flex p-1 rounded-xl border gap-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all relative ${viewMode === 'list' ? (isDark ? 'text-white' : 'text-black') : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        {viewMode === 'list' && (
                            <motion.div
                                layoutId="viewModeToggle"
                                className={`absolute inset-0 rounded-lg shadow-sm ${isDark ? 'bg-white/10' : 'bg-white'}`}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="material-symbols-outlined text-[20px] relative z-10">view_list</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all relative ${viewMode === 'grid' ? (isDark ? 'text-white' : 'text-black') : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        {viewMode === 'grid' && (
                            <motion.div
                                layoutId="viewModeToggle"
                                className={`absolute inset-0 rounded-lg shadow-sm ${isDark ? 'bg-white/10' : 'bg-white'}`}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="material-symbols-outlined text-[20px] relative z-10">grid_view</span>
                    </button>
                 </div>
             </div>

             {/* Log List/Grid */}
             {logs.length === 0 ? (
                 <div className="text-center py-12 text-gray-400">
                     <span className="material-symbols-outlined text-4xl mb-2 opacity-30">description</span>
                     <p>No logs found.</p>
                 </div>
             ) : (
                 <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-3"}>
                    {logs.map((log, index) => {
                        const date = new Date(log.date);
                        const day = date.getDate();
                        const month = date.toLocaleString('default', { month: 'short' });

                        return (
                        <motion.div 
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-2xl shadow-soft border transition-colors ${
                                isDark ? 'bg-[#1E1E1E] border-white/5 shadow-none' : 'bg-white border-gray-100'
                            } ${viewMode === 'grid' ? 'p-4 flex flex-col justify-between min-h-[140px]' : 'p-4'}`}
                        >
                            {viewMode === 'list' ? (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#121014]'}`}>
                                            {date.toLocaleDateString('en-US', { 
                                                weekday: 'short', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                        {log.flow && (
                                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                                                {log.flow}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {(log.moods || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {log.moods.map((m, i) => (
                                                <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {(log.symptoms || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {log.symptoms.map((s, i) => (
                                                <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${
                                                    isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {log.notes && (
                                        <p className={`text-xs mt-3 italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>"{log.notes}"</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start w-full">
                                        <div className={`flex flex-col items-center justify-center rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'} w-12 h-12`}>
                                            <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{month}</span>
                                            <span className={`text-lg font-bold leading-none mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{day}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 mt-3">
                                        {log.flow && (
                                            <div className="flex gap-2 mb-1 flex-wrap">
                                                <span className="bg-[#B04E75]/20 text-[#D14D72] text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border border-[#B04E75]/10 whitespace-nowrap">
                                                    {log.flow} Flow
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className={`flex items-center gap-3 text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {(log.moods || []).length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px] text-teal-500">face</span>
                                                    {log.moods[0]} {(log.moods || []).length > 1 ? `+${(log.moods || []).length - 1}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                        );
                    })}
                 </div>
             )}
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerInsights;
