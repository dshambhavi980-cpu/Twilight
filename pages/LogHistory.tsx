import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const LogHistory: React.FC = () => {
  const navigate = useNavigate();
  const { logs } = useData();
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');

  // Sort logs by date descending (newest first)
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="animate-slideIn font-display flex flex-col min-h-screen bg-background-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-background-dark/95 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-[17px] font-bold text-white tracking-tight">Log History</h2>
        
        {/* View Toggle */}
        <div className="relative flex bg-surface-dark p-1 rounded-xl border border-white/5 w-[84px]">
            {/* Animated Pill */}
            <div 
                className={`absolute top-1 bottom-1 w-[38px] bg-white/10 rounded-lg shadow-sm transition-all duration-300 ease-out z-0`}
                style={{ transform: viewMode === 'list' ? 'translateX(0)' : 'translateX(100%)' }}
            ></div>

            <button 
                onClick={() => setViewMode('list')}
                className={`relative z-10 flex-1 flex items-center justify-center p-1.5 rounded-lg transition-colors duration-200 ${viewMode === 'list' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
                <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
            <button 
                onClick={() => setViewMode('grid')}
                className={`relative z-10 flex-1 flex items-center justify-center p-1.5 rounded-lg transition-colors duration-200 ${viewMode === 'grid' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
        </div>
      </header>

       <main className="flex-1 px-5 pb-6">
        {sortedLogs.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-50">
              <span className="material-symbols-outlined text-5xl mb-4 text-gray-500">history</span>
              <p className="text-gray-400 font-medium">No logs recorded yet.</p>
           </div>
        ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 gap-3" : "flex flex-col gap-4"}>
                {sortedLogs.map((log) => {
                const date = new Date(log.date);
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'short' });
                
                return (
                    <button
                    key={log.date}
                    onClick={() => navigate(`/log/details?date=${log.date}`)}
                    className={`bg-surface-dark rounded-[20px] p-4 text-left border border-white/5 hover:border-white/10 active:scale-[0.98] transition-all shadow-sm group
                        ${viewMode === 'grid' ? 'flex flex-col gap-3 min-h-[140px] justify-between' : 'flex items-center gap-4'}
                    `}
                    >
                    {/* Header: Date Badge & Arrow (Grid) */}
                    <div className={viewMode === 'grid' ? "flex justify-between items-start w-full" : ""}>
                         <div className={`flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/5 ${viewMode === 'grid' ? 'w-12 h-12' : 'w-14 h-14'}`}>
                            <span className="text-[10px] uppercase font-bold text-gray-500">{month}</span>
                            <span className={`${viewMode === 'grid' ? 'text-lg' : 'text-xl'} font-bold text-white leading-none mt-0.5`}>{day}</span>
                        </div>
                        {viewMode === 'grid' && (
                             <span className="material-symbols-outlined text-gray-600 group-hover:text-white transition-colors">arrow_outward</span>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className={`flex gap-2 mb-1 ${viewMode === 'grid' ? 'flex-wrap' : 'items-center'}`}>
                        {log.flow && (
                            <span className="bg-[#B04E75]/20 text-[#D14D72] text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border border-[#B04E75]/10 whitespace-nowrap">
                                {log.flow} Flow
                            </span>
                        )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-300 truncate">
                            {log.moods && log.moods.length > 0 && (
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px] text-teal-400">face</span>
                                    {log.moods[0]} {viewMode === 'grid' && log.moods.length > 1 ? `+${log.moods.length - 1}` : ''}
                                     {viewMode === 'list' && log.moods.length > 1 && `+${log.moods.length - 1}`}
                                </span>
                            )}
                            {viewMode === 'list' && log.symptoms && log.symptoms.length > 0 && (
                                <span className="flex items-center gap-1 text-gray-400">
                                    • {log.symptoms.length} symptoms
                                </span>
                            )}
                        </div>
                    </div>

                    {viewMode === 'list' && (
                        <span className="material-symbols-outlined text-gray-600">chevron_right</span>
                    )}
                    </button>
                );
                })}
            </div>
        )}
      </main>
    </div>
  );
};

export default LogHistory;
