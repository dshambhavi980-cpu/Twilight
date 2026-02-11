import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouples } from '../contexts/CouplesContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';
import RelationshipWeather from '../components/RelationshipWeather';
import { motion } from 'framer-motion';

const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    couple, 
    fetchPartnerData, 
    partnerProfile, 
    partnerSettings, 
    partnerLogs, 
    toggleGhostMode 
  } = useCouples();

  useEffect(() => {
    fetchPartnerData();
  }, [couple?.id]);

  // Calculate cycle status based on partnerSettings
  const getPartnerCycleStatus = () => {
    if (!partnerSettings?.last_period_start) {
      return { phase: 'Unknown', cycleDay: 1, nextPeriodIn: 0 };
    }

    const lastStart = new Date(partnerSettings.last_period_start);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Simple phase logic (approximate)
    let phase = 'Follicular';
    if (diffDays <= 5) phase = 'Menstrual';
    else if (diffDays >= 12 && diffDays <= 16) phase = 'Ovulation';
    else if (diffDays > 16) phase = 'Luteal';

    const avgLength = partnerSettings.avg_cycle_length || 28;
    const nextPeriodIn = avgLength - (diffDays % avgLength);

    return { phase, cycleDay: diffDays, nextPeriodIn };
  };

  const cycleStatus = getPartnerCycleStatus();
  const todayLog = partnerLogs?.[0]?.date === new Date().toISOString().split('T')[0] ? partnerLogs[0] : null;

  return (
    <div className="flex flex-col font-display animate-slideIn bg-[#FDFCF8] dark:bg-background-dark min-h-screen pb-24 transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 sticky top-0 z-20 bg-[#FDFCF8]/95 dark:bg-[#121014]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
             <img 
               src={user?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
               alt="Profile"
               className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-sm"
             />
             <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-[#FDFCF8] dark:border-[#121014] rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-400">Supporting</span>
            <h2 className="text-xl font-bold text-[#121014] dark:text-white leading-tight">
              {partnerProfile?.full_name || 'Partner'} ❤️
            </h2>
          </div>
        </div>
        <NotificationBell />
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6">
        {/* Ghost Mode Status */}
        {!couple?.share_enabled && (
           <div className="bg-gray-100 dark:bg-white/10 p-4 rounded-2xl flex items-center gap-3">
             <span className="material-symbols-outlined text-gray-500">visibility_off</span>
             <div>
               <h3 className="font-bold text-gray-700 dark:text-gray-200">Ghost Mode Active</h3>
               <p className="text-xs text-gray-500">Partner has paused sharing.</p>
             </div>
           </div>
        )}

        {/* Relationship Weather Widget */}
        {couple?.share_enabled && (
          <RelationshipWeather 
            phase={cycleStatus.phase}
            cycleDay={cycleStatus.cycleDay}
            nextPeriodIn={cycleStatus.nextPeriodIn}
          />
        )}

        {/* Today's Status Card */}
        {couple?.share_enabled && (
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] shadow-soft border border-gray-100 dark:border-white/5">
            <h3 className="text-lg font-bold text-[#121014] dark:text-white mb-4">Her Status Today</h3>
            
            {todayLog ? (
              <div className="flex flex-col gap-4">
                {/* Moods */}
                {todayLog.moods && todayLog.moods.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {todayLog.moods.map((mood: string) => (
                      <span key={mood} className="px-3 py-1 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full text-sm font-medium capitalize border border-pink-100 dark:border-pink-500/20">
                        {mood}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Symptoms */}
                {todayLog.symptoms && todayLog.symptoms.length > 0 ? (
                   <div className="grid grid-cols-2 gap-2">
                      {todayLog.symptoms.map((sym: string) => (
                        <div key={sym} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                           <span className="material-symbols-outlined text-gray-400 text-lg">check_circle</span>
                           <span className="capitalize">{sym}</span>
                        </div>
                      ))}
                   </div>
                ) : (
                   <p className="text-sm text-gray-400 italic">No symptoms logged yet.</p>
                )}
                
                {todayLog.notes && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{todayLog.notes}"</p>
                  </div>
                )}
              </div>
            ) : (
               <div className="text-center py-6">
                 <p className="text-gray-400 mb-2">No logs from her today yet.</p>
                 <button 
                  onClick={() => navigate('/love-lock')}
                  className="text-primary font-bold text-sm hover:underline"
                 >
                   Ask how she's feeling?
                 </button>
               </div>
            )}
          </div>
        )}

        {/* Love Lock Section */}
        {couple && (
          <div className="bg-gradient-to-br from-[#1E1C24] to-[#121014] text-white p-6 rounded-[2rem] shadow-lg border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[50px] rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-pink-500">lock_heart</span>
                    Love Lock
                 </h3>
                 {couple.love_unlocked ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30 uppercase tracking-wider">Active</span>
                 ) : (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30 uppercase tracking-wider">Pending</span>
                 )}
              </div>

              {!couple.love_unlocked ? (
                 <div className="space-y-4">
                    <p className="text-white/60 text-sm">
                       To unlock Love Notes for her, generate a unique access code. She needs to enter this code in her Love Lock tab.
                    </p>
                    
                    {couple.love_code ? (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Her Access Code</p>
                            <div className="text-3xl font-mono font-bold text-pink-500 tracking-[0.2em]">{couple.love_code}</div>
                            <p className="text-xs text-white/40 mt-2">Waiting for her to unlock...</p>
                        </div>
                    ) : (
                        <button 
                           onClick={async () => {
                             try {
                               await useCouples().generateLoveCode();
                             } catch (e) {
                               alert('Failed to generate code');
                             }
                           }}
                           className="w-full py-3 bg-pink-500 hover:bg-pink-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/20"
                        >
                           <span className="material-symbols-outlined">key</span>
                           Generate Unlock Code
                        </button>
                    )}
                 </div>
              ) : (
                 <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                        <span className="material-symbols-outlined">favorite</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm">Love Notes Unlocked</p>
                        <p className="text-xs text-white/50">You can now share private notes.</p>
                    </div>
                     <button 
                        onClick={() => navigate('/love-lock')}
                        className="ml-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                     >
                        Open
                     </button>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
           <button 
             onClick={() => navigate('/love-lock')}
             className="p-5 bg-white dark:bg-surface-dark rounded-[24px] shadow-soft border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all"
           >
             <div className="w-12 h-12 bg-pink-100 dark:bg-pink-500/20 rounded-full flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined text-2xl">favorite</span>
             </div>
             <span className="font-bold text-[#121014] dark:text-white">Send Love</span>
           </button>
           
           <button 
             onClick={() => alert("Coming soon: Treat Shop!")}
             className="p-5 bg-white dark:bg-surface-dark rounded-[24px] shadow-soft border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all"
           >
             <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined text-2xl">redeem</span>
             </div>
             <span className="font-bold text-[#121014] dark:text-white">Send Treat</span>
           </button>
        </div>
      </main>
    </div>
  );
};

export default PartnerDashboard;
