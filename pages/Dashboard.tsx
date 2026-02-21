import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCouples } from '../contexts/CouplesContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from '../components/NotificationBell';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCyclePhase, cycleSettings, getLog } = useData();
  const { primaryColor } = useTheme();
  const { partnerProfile } = useCouples();
  
  // Initialize from cache for instant load
  const [profile, setProfile] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('twilight_profile');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (user) {
        fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
      try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();
          
          if (data) {
              setProfile(data);
              // Cache for instant load next time
              localStorage.setItem('twilight_profile', JSON.stringify(data));
          }
      } catch (error) {
          console.error("Error fetching profile", error);
      }
  };
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const cycleData = getCyclePhase(dateStr);
  
  // Calculate Progress for the wheel (Day X of Y)
  const progressPercent = (cycleData.currentDay / cycleSettings.avgCycleLength) * 100;
  
  // Calculate stroke dash offset
  // Circumference 2 * pi * 130 ≈ 816.8
  const circumference = 816.8;
  const strokeOffset = circumference - (circumference * (progressPercent / 100));

  // Determine next period date display
  const nextPeriodDate = new Date();
  nextPeriodDate.setDate(today.getDate() + cycleData.nextPeriodIn);
  const nextPeriodStr = nextPeriodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col font-display animate-slideIn bg-[#FDFCF8] dark:bg-background-dark min-h-screen pb-24 transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 sticky top-0 z-20 bg-[#FDFCF8]/95 dark:bg-[#121014]/95 backdrop-blur-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={profile?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
              alt="My Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-sm"
            />
            {/* Status Dot: Border matches background for cutout effect */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4ADE80] border-2 border-[#FDFCF8] dark:border-[#121014] rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-400 dark:text-gray-400">Good Morning,</span>
            <h2 className="text-xl font-bold text-[#121014] dark:text-white leading-tight">{profile?.full_name?.split(' ')[0] || 'User'}</h2>
          </div>
        </div>
        {/* Notification Button: White in Light Mode, Translucent in Dark Mode */}
        <NotificationBell />
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6">
        {/* Cycle Wheel */}
        <div className="relative flex flex-col items-center justify-center py-2">
          {/* Increased size for better visual balance */}
          <div className="relative w-[300px] h-[300px]">
             {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
              {/* Track */}
              <circle
                cx="150"
                cy="150"
                r="130"
                stroke="currentColor"
                strokeWidth="24"
                fill="transparent"
                className="text-[#F2F2F2] dark:text-white/5 transition-colors"
              />
              {/* Progress Segment */}
              <motion.circle
                cx="150"
                cy="150"
                r="130"
                stroke={primaryColor || "#984369"}
                strokeWidth="24"
                fill="transparent"
                strokeDasharray={816} /* 2 * pi * 130 ≈ 816.8 */
                strokeLinecap="round"
                className="drop-shadow-sm"
                initial={{ strokeDashoffset: 816.8 }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            
            {/* Inner Content - Perfectly centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
               <span className="text-[11px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: primaryColor || '#984369' }}>Cycle Day</span>
               <span className="text-[5.5rem] leading-none font-bold text-[#121014] dark:text-white tracking-tighter mb-3">{cycleData.currentDay}</span>
               {/* Divider Pill */}
               <div className="w-8 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mb-4"></div>
               
               <span className="text-[17px] font-bold text-[#121014] dark:text-white mb-1">{cycleData.phase} Phase</span>
               <span className="text-xs font-medium text-gray-400 dark:text-gray-400 max-w-[140px] leading-relaxed">
                 {cycleData.phase === 'Follicular' ? 'Estrogen rising, energy levels up' : 
                  cycleData.phase === 'Ovulation' ? 'Peak fertility, high energy' :
                  cycleData.phase === 'Luteal' ? 'Progesterone rising, wind down' :
                  'Rest and recharge'}
               </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
            {/* Next Period */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-[24px] shadow-soft dark:shadow-none border border-gray-100 dark:border-white/5 group hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-filled text-[#984369] text-lg">water_drop</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Next Period</span>
                </div>
                <div className="flex flex-col">
                    {cycleSettings.irregularCycle ? (
                      <>
                        <span className="text-lg font-bold text-[#121014] dark:text-white mb-0.5">Not Tracked</span>
                        <span className="text-xs font-medium text-gray-400">Irregular cycle mode</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-[#121014] dark:text-white mb-0.5">{nextPeriodStr}</span>
                        <span className="text-xs font-medium text-gray-400">in {cycleData.nextPeriodIn} Days</span>
                      </>
                    )}
                </div>
            </div>

            {/* Fertility */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-[24px] shadow-soft dark:shadow-none border border-gray-100 dark:border-white/5 group hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[#4ECDC4] text-lg">egg_alt</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Fertility</span>
                </div>
                <div className="flex flex-col">
                    {cycleSettings.irregularCycle ? (
                      <>
                        <span className="text-lg font-bold text-[#121014] dark:text-white mb-1.5 leading-tight">Not Tracked</span>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                            <span className="text-xs font-medium text-gray-400">Irregular cycle mode</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Calculate Fertile Window: Ovulation is approx 14 days before next period. Window is O-5 to O+1 */}
                        {(() => {
                            const ovulationDate = new Date(nextPeriodDate);
                            ovulationDate.setDate(nextPeriodDate.getDate() - 14);
                            
                            const fertileStart = new Date(ovulationDate);
                            fertileStart.setDate(ovulationDate.getDate() - 5);
                            
                            const fertileEnd = new Date(ovulationDate);
                            fertileEnd.setDate(ovulationDate.getDate() + 1);

                            const startStr = fertileStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const endStr = fertileEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            
                            return (
                                 <span className="text-lg font-bold text-[#121014] dark:text-white mb-1.5 leading-tight">
                                    {startStr} - {endStr}
                                 </span>
                            );
                        })()}
                        <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${cycleData.isFertile ? 'bg-[#4ECDC4]' : 'bg-gray-400'}`}></div>
                            <span className={`text-xs font-medium ${cycleData.isFertile ? 'text-[#4ECDC4]' : 'text-gray-400'}`}>
                              {cycleData.isFertile ? 'High Chance' : 'Low Chance'}
                            </span>
                        </div>
                      </>
                    )}
                </div>
            </div>
        </div>

        {/* Symptom Banner */}
        <button 
            onClick={() => navigate('/log/details')}
            className="w-full bg-[#FF5A78] hover:bg-[#E04F6B] text-white p-6 rounded-[24px] shadow-lg shadow-[#FF5A78]/20 flex items-center justify-between group transition-all active:scale-[0.98]"
        >
            <div className="flex flex-col items-start gap-1">
                <span className="text-lg font-bold">How are you feeling?</span>
                <span className="text-sm text-white/80 font-medium">Log today's symptoms</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-2xl">add</span>
            </div>
        </button>

        {/* Yesterday's Logs */}
        {(() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const yesterdayLog = getLog(yesterdayStr);
            
            // Combine all logged items
            const items: { emoji?: string; icon?: string; label: string; color: string; bgColor: string }[] = [];
            
            if (yesterdayLog?.flow) {
                const flowLabels: Record<string, string> = { spotting: 'Spotting', light: 'Light Flow', medium: 'Medium Flow', heavy: 'Heavy Flow' };
                const flowEmojis: Record<string, string> = { spotting: '🫧', light: '💧', medium: '🩸', heavy: '🩸🩸' };
                items.push({ 
                    emoji: flowEmojis[yesterdayLog.flow] || '🩸', 
                    label: flowLabels[yesterdayLog.flow] || 'Flow', 
                    color: 'text-blue-400', 
                    bgColor: 'bg-blue-50 dark:bg-blue-500/10' 
                });
            }
            if (yesterdayLog?.moods?.length) {
                const moodEmojis: Record<string, string> = {
                    calm: '😌', happy: '😊', energetic: '🤩', frisky: '🥰',
                    swings: '🎢', anxious: '😰', sad: '😢', irritated: '😠'
                };
                yesterdayLog.moods.forEach((mood: string) => {
                    items.push({ 
                        emoji: moodEmojis[mood.toLowerCase()] || '🙂', 
                        label: mood, 
                        color: 'text-purple-400', 
                        bgColor: 'bg-purple-50 dark:bg-purple-500/10' 
                    });
                });
            }
            if (yesterdayLog?.symptoms?.length) {
                const symptomEmojis: Record<string, string> = {
                    cramps: '😖', 'tender breasts': '🍈', headache: '🤕', acne: '🎭',
                    backache: '🧘', fatigue: '🥱', bloating: '🎈', insomnia: '👁️',
                    nausea: '🤢', dizziness: '😵', 'hot flashes': '🚒', chills: '🥶',
                    'pelvic pain': '⚡', 'joint pain': '🦴', 'sensory sensitivity': '🎧'
                };
                yesterdayLog.symptoms.forEach((symptom: string) => {
                    items.push({ 
                        emoji: symptomEmojis[symptom.toLowerCase()] || '🩺', 
                        label: symptom, 
                        color: 'text-red-400', 
                        bgColor: 'bg-red-50 dark:bg-red-500/10' 
                    });
                });
            }
            
            if (items.length === 0) {
                return (
                    <div className="bg-white dark:bg-surface-dark p-5 rounded-[24px] border border-gray-100 dark:border-white/5 text-center">
                        <span className="text-sm text-gray-400">No logs from yesterday</span>
                    </div>
                );
            }
            
            return (
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-sm font-bold text-[#121014] dark:text-white">Yesterday's Logs</h3>
                        <button 
                            onClick={() => navigate('/calendar')}
                            className="text-xs font-semibold text-[#984369] hover:text-[#984369]/80 transition-colors"
                        >
                            View Calendar
                        </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                        {items.map((item, index) => (
                            <div key={index} className="shrink-0 flex items-center gap-2.5 bg-white dark:bg-surface-dark pl-2 pr-4 py-2 rounded-full border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className={`w-7 h-7 rounded-full ${item.bgColor} flex items-center justify-center text-sm`}>
                                    {item.emoji ? (
                                        <span>{item.emoji}</span>
                                    ) : (
                                        <span className={`material-symbols-outlined ${item.color} text-sm`}>{item.icon}</span>
                                    )}
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })()}

        {/* Daily Insight Card - Updated Style */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-orange-50/50 dark:bg-[#18181b] border border-orange-100 dark:border-white/5 shadow-sm transition-colors mb-2">
            {/* Yellow accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400 dark:bg-[#FDE047] z-10 shadow-[0_0_8px_rgba(253,224,71,0.2)]"></div>
            
            <div className="relative z-10 p-5 pl-7 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-full bg-white dark:bg-[#2A272E] border border-orange-100 dark:border-white/5 shadow-sm transition-colors">
                        <span className="material-symbols-filled text-[18px] text-yellow-500 dark:text-[#FDE047]">lightbulb</span>
                </div>
                <span className="text-[11px] font-bold text-yellow-600 dark:text-[#FDE047] uppercase tracking-widest transition-colors">Daily Insight</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed font-medium transition-colors">
                During the follicular phase, your metabolism slows down slightly. Consider complex carbs for sustained energy.
                </p>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;