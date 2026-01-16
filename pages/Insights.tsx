import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';
import TodayReportModal from '../components/TodayReportModal';

const Insights: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { cycleSettings, getCyclePhase, logs } = useData();
  const cycleData = getCyclePhase();
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [showTodayReport, setShowTodayReport] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [profile, setProfile] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('twilight_profile');
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });

  // Get today's log for the report card
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === todayStr) || null;

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Share functionality
  const handleShare = async () => {
    if (!user) {
      alert('Please log in to share');
      return;
    }

    setIsSharing(true);
    setCopied(false);
    try {
      // Check if user already has a shared card
      const { data: existingCard } = await supabase
        .from('shared_cards')
        .select('share_code')
        .eq('user_id', user.id)
        .maybeSingle();

      let shareCode: string;

      // Create card data snapshot (always update with latest data)
      const cardData = {
        userName: profile?.full_name || 'Anonymous',
        avatarUrl: profile?.avatar_url || '',
        cycleDay: cycleData.currentDay,
        phase: cycleData.phase,
        nextPeriodIn: cycleData.nextPeriodIn,
        moods: todayLog?.moods || [],
        symptoms: todayLog?.symptoms || [],
        flow: todayLog?.flow || null,
        date: todayStr
      };

      if (existingCard?.share_code) {
        // Reuse existing share code, but update card data
        shareCode = existingCard.share_code;
        await supabase
          .from('shared_cards')
          .update({ card_data: cardData } as any)
          .eq('user_id', user.id);
      } else {
        // Generate a new unique code
        shareCode = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        
        const { error } = await supabase.from('shared_cards').insert({
          user_id: user.id,
          share_code: shareCode,
          card_data: cardData
        } as any);

        if (error) throw error;
      }

      // Generate share URL and show modal
      const url = `${window.location.origin}/#/share/${shareCode}`;
      setShareUrl(url);
      setShowShareModal(true);
    } catch (err: any) {
      console.error('Share error:', err);
      alert('Failed to create share link: ' + err.message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      // Reset after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };
  
  // 1. Calculate History & Real Averages
  const { historyData, stats } = React.useMemo(() => {
     if (!logs.length) return { 
         historyData: [{ value: cycleSettings.avgCycleLength, label: 'Avg' }],
         stats: { avgCycle: cycleSettings.avgCycleLength, avgPeriod: cycleSettings.avgPeriodLength }
     };
     
     // A. Group logs into distinct "periods" (flows separated by >7 days gap)
     const periods: { start: Date, end: Date, length: number }[] = [];
     const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     
     let currentPeriodStart: Date | null = null;
     let currentPeriodEnd: Date | null = null;

     sortedLogs.forEach((log, index) => {
         if (log.flow) {
             const logDate = new Date(log.date);
             
             if (!currentPeriodStart) {
                 // Start first period
                 currentPeriodStart = logDate;
                 currentPeriodEnd = logDate;
             } else {
                 const diffDays = (logDate.getTime() - currentPeriodEnd!.getTime()) / (1000 * 3600 * 24);
                 
                 if (diffDays > 7) { 
                     // Gap found -> close previous period and start new one
                     const length = Math.ceil((currentPeriodEnd!.getTime() - currentPeriodStart.getTime()) / (1000 * 3600 * 24)) + 1;
                     periods.push({ start: currentPeriodStart, end: currentPeriodEnd!, length });
                     
                     currentPeriodStart = logDate;
                     currentPeriodEnd = logDate;
                 } else {
                     // Continue current period
                     currentPeriodEnd = logDate;
                 }
             }
         }
     });
     
     // Close final period
     if (currentPeriodStart && currentPeriodEnd) {
         const length = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 3600 * 24)) + 1;
         periods.push({ start: currentPeriodStart, end: currentPeriodEnd, length });
     }

     // B. Calculate Cycle Lengths (days between starts)
     const cycleLengths: { value: number, label: string }[] = [];
     for (let i = 0; i < periods.length - 1; i++) {
         const current = periods[i];
         const next = periods[i+1];
         const diffTime = Math.abs(next.start.getTime() - current.start.getTime());
         // Cycle length is usually defined as Start to Next Start
         const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
         
         if (diffDays > 15 && diffDays < 60) {
            cycleLengths.push({
                value: diffDays,
                label: current.start.toLocaleString('default', { month: 'short' })
            });
         }
     }
     
     // C. Calculate Averages
     const totalPeriodLength = periods.reduce((sum, p) => sum + p.length, 0);
     const calculatedAvgPeriod = periods.length ? Math.round(totalPeriodLength / periods.length) : cycleSettings.avgPeriodLength;
     
     const totalCycleLength = cycleLengths.reduce((sum, c) => sum + c.value, 0);
     const calculatedAvgCycle = cycleLengths.length ? Math.round(totalCycleLength / cycleLengths.length) : cycleSettings.avgCycleLength;

     const finalHistory = cycleLengths.length > 0 ? cycleLengths.slice(-6) : [{ value: calculatedAvgCycle, label: 'Avg' }];

     return { 
         historyData: finalHistory, 
         stats: { avgCycle: calculatedAvgCycle, avgPeriod: calculatedAvgPeriod }
     };
  }, [logs, cycleSettings]);

  // 2. Calculate Top Symptoms
  const topSymptoms = React.useMemo(() => {
     const counts: Record<string, number> = {};
     logs.forEach(log => {
         log.symptoms?.forEach(sym => {
             counts[sym] = (counts[sym] || 0) + 1;
         });
     });
     
     const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
     if (sorted.length === 0) return [
        { name: 'No Data', level: '-', width: '0%', color: 'bg-gray-200' }
     ];
     
     const max = sorted[0][1];
     
     return sorted.map(([name, count], i) => {
         // Normalize against at least 5 logs so that 1 count isn't 100% width
         // If max is high, it uses max. If max is low (e.g. 1 or 2), it uses 5 as the denominator.
         // This scales the visual bar to be relative to a "meaningful" frequency.
         const baseline = Math.max(max, 5); 
         const pct = (count / baseline) * 100;
         
         // Assign colors based on rank
         const color = i === 0 ? 'bg-primary' : i === 1 ? 'bg-[#E7D6A7]' : 'bg-[#2DD4BF]';
         const level = count > 5 ? 'High' : count > 2 ? 'Med' : 'Low';
         
         return { name, level, width: `${Math.max(pct, 5)}%`, color };
     });
  }, [logs]);

  return (
    <div className="animate-slideIn font-display flex flex-col pb-24 bg-[#FDFCF8] dark:bg-background-dark min-h-screen transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#FDFCF8] dark:bg-[#121014] backdrop-blur-md px-6 py-4 transition-all duration-200 border-b border-gray-100 dark:border-white/5">
        <h1 className="text-3xl font-bold tracking-tight text-[#121014] dark:text-white">Insights</h1>
        <div className="flex items-center gap-2">
            <NotificationBell />
            <button 
              onClick={handleShare}
              disabled={isSharing}
              aria-label="Share Profile Card" 
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[#121014] dark:text-white disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-2xl">{isSharing ? 'hourglass_empty' : 'ios_share'}</span>
            </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="w-full overflow-x-auto no-scrollbar py-2 px-6 bg-[#FDFCF8] dark:bg-background-dark mb-4 transition-colors">
        <div className="flex gap-3 min-w-max">
          <button className="flex h-10 items-center justify-center px-6 rounded-full bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20">
            History
          </button>
        </div>
      </div>

      <main className="flex flex-col gap-6 px-6">
        {/* Prediction Card */}
        <section className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-surface-dark p-6 shadow-soft border border-gray-100 dark:border-white/5 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Prediction</p>
              <h2 className="text-2xl font-bold text-[#121014] dark:text-white mb-1">Period in {cycleData.nextPeriodIn} days</h2>
              <p className="text-sm text-gray-400">based on {cycleSettings.avgCycleLength}d cycle</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-500/20 text-primary">
              <span className="material-symbols-filled text-2xl">water_drop</span>
            </div>
          </div>
          
          <div className="flex justify-between text-xs font-medium text-gray-400 mb-2">
            <span>Day {cycleData.currentDay}</span>
            <span>{cycleSettings.avgCycleLength} Days Cycle</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min((cycleData.currentDay / cycleSettings.avgCycleLength) * 100, 100)}%` }}
            ></div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-white dark:bg-surface-dark p-6 shadow-soft border border-gray-100 dark:border-white/5 text-center aspect-square transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400">
              <span className="material-symbols-outlined text-2xl">refresh</span>
            </div>
            <h3 className="text-3xl font-bold text-[#121014] dark:text-white">{stats.avgCycle}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Cycle Length</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-white dark:bg-surface-dark p-6 shadow-soft border border-gray-100 dark:border-white/5 text-center aspect-square transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-2xl">bar_chart</span>
            </div>
            <h3 className="text-3xl font-bold text-[#121014] dark:text-white">{stats.avgPeriod}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Duration</p>
          </div>
        </section>

        {/* Cycle History Chart */}
        <section className="rounded-[2rem] bg-white dark:bg-surface-dark p-6 shadow-soft border border-gray-100 dark:border-white/5 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#121014] dark:text-white">Cycle History</h3>
              <p className="text-sm text-gray-400">Length variation over time</p>
            </div>
            
            {/* Chart Toggle */}
            <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1 relative">
                {/* Active Background Pill */}
                <div className="absolute inset-0 p-1 pointer-events-none">
                     <div className={`h-full w-1/2 rounded-lg bg-primary shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${chartType === 'line' ? 'translate-x-full' : 'translate-x-0'}`}></div>
                </div>

                <button 
                  onClick={() => setChartType('bar')}
                  className={`relative z-10 flex-1 p-2 rounded-lg transition-colors duration-300 ${chartType === 'bar' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <span className="material-symbols-outlined text-lg block text-center">bar_chart</span>
                </button>
                <button 
                  onClick={() => setChartType('line')}
                  className={`relative z-10 flex-1 p-2 rounded-lg transition-colors duration-300 ${chartType === 'line' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <span className="material-symbols-outlined text-lg block text-center">show_chart</span>
                </button>
            </div>
          </div>
          
          <div className="relative h-48 mt-4 w-full">
            {/* Dashed Average Line */}
            {/* Chart Content */}
            <div className="h-full w-full relative z-10 pl-[-10px]">
                <AnimatePresence mode="wait">
                {chartType === 'bar' ? (
                  <motion.div 
                    key="bar"
                    className="w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historyData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barCategoryGap="20%">
                           <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                           <ReferenceLine 
                              y={stats.avgCycle} 
                              stroke={theme === 'dark' ? 'rgba(255,255,255,0.2)' : '#E5E7EB'} 
                              strokeDasharray="3 3"
                              label={{ 
                                value: `Avg ${stats.avgCycle}d`, 
                                position: 'right', 
                                fill: theme === 'dark' ? '#9CA3AF' : '#9CA3AF', 
                                fontSize: 10 
                              }} 
                           />
                           <Tooltip 
                              cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                              contentStyle={{ 
                                backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF', 
                                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E7EB', 
                                borderRadius: '8px', 
                                color: theme === 'dark' ? '#fff' : '#121014',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              itemStyle={{ color: theme === 'dark' ? '#fff' : '#121014' }}
                              labelStyle={{ display: 'none' }}
                           />
                           <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1500} animationEasing="ease-out" maxBarSize={40}>
                              {historyData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index >= historyData.length - 1 ? '#984369' : (theme === 'dark' ? '#ffffff1a' : '#E5E7EB')} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <motion.div
                    key="line"
                    className="w-full h-full relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#984369" stopOpacity={0.6}/>
                                 <stop offset="95%" stopColor="#984369" stopOpacity={0}/>
                              </linearGradient>
                              {/* Clip Path for Left-to-Right Wipe Animation */}
                              <clipPath id="wipe-animation">
                                <rect x="0" y="0" width="0" height="100%">
                                  <animate attributeName="width" from="0" to="100%" dur="1.5s" fill="freeze" calcMode="spline" keyTimes="0; 1" keySplines="0.16 1 0.3 1" />
                                </rect>
                              </clipPath>
                           </defs>
                           <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                           <ReferenceLine 
                              y={stats.avgCycle} 
                              stroke={theme === 'dark' ? 'rgba(255,255,255,0.2)' : '#E5E7EB'} 
                              strokeDasharray="3 3"
                              label={{ 
                                value: `Avg ${stats.avgCycle}d`, 
                                position: 'right', 
                                fill: theme === 'dark' ? '#9CA3AF' : '#9CA3AF', 
                                fontSize: 10 
                              }} 
                           />
                           <Tooltip 
                              contentStyle={{ 
                                backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF', 
                                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E7EB', 
                                borderRadius: '8px', 
                                color: theme === 'dark' ? '#fff' : '#121014',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              itemStyle={{ color: theme === 'dark' ? '#fff' : '#121014' }}
                              labelStyle={{ display: 'none' }}
                           />
                           <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#984369" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorValue)" 
                              clipPath="url(#wipe-animation)"
                              isAnimationActive={false} // Disable default up-grow animation
                              dot={{ r: 4, fill: "#984369", stroke: theme === 'dark' ? "#121014" : "#fff", strokeWidth: 2 }}
                              activeDot={{ r: 6, fill: "#984369", stroke: theme === 'dark' ? "#fff" : "#121014", strokeWidth: 2 }}
                           />
                        </AreaChart>
                     </ResponsiveContainer>
                  </motion.div>
                )}
                </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Symptoms */}
        <section className="rounded-[2rem] bg-white dark:bg-surface-dark p-6 shadow-soft border border-gray-100 dark:border-white/5 transition-colors">
          <h3 className="text-lg font-bold text-[#121014] dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-filled text-primary text-xl">Auto_Awesome</span>
            Common Symptoms
          </h3>
          <div className="flex flex-col gap-5">
            {topSymptoms.map((s) => (
              <div key={s.name} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="capitalize text-gray-200">{s.name}</span>
                  <span className="text-gray-400">{s.level}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-white/5">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: s.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Did You Know */}
        <section className="rounded-[2rem] bg-[#F9F7F2] dark:bg-[#2C2A24] p-6 shadow-sm border border-transparent">
          <div className="flex items-start gap-4">
            <div className="text-orange-300 dark:text-orange-400 mt-1">
              <span className="material-symbols-filled text-2xl">lightbulb</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Did you know?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                Your cycle tends to be <span className="font-bold text-primary">2 days shorter</span> when you report higher sleep quality during the luteal phase.
              </p>
              <button className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                View Sleep Trends <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
        
        <div className="mt-2 text-center pb-24 px-6">
            <button 
                onClick={() => setShowTodayReport(true)}
                className="w-full bg-[#984369] hover:bg-[#984369]/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#984369]/20 transition-all flex items-center justify-center gap-2 mb-3"
            >
                <span className="material-symbols-outlined">today</span>
                Generate Today's Report Card
            </button>
            <p className="text-xs text-gray-400 px-4 leading-relaxed">
                Creates a shareable card of your today's symptoms and cycle status.
            </p>
        </div>
      </main>

      {/* Today's Report Modal */}
      <TodayReportModal
        isOpen={showTodayReport}
        onClose={() => setShowTodayReport(false)}
        todayLog={todayLog}
        cycleSettings={cycleSettings}
        profile={profile}
      />

      {/* Share Link Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">share</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#121014] dark:text-white">Share Your Card</h3>
                </div>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-gray-400">close</span>
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Anyone with this link can view your profile card.
              </p>

              {/* Link Input */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                <input 
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-[#121014] dark:text-white truncate outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>

              {/* Success Message */}
              {copied && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-green-500 font-medium mt-3"
                >
                  ✓ Link copied to clipboard!
                </motion.p>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Insights;