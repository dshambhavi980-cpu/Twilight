import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from '../components/NotificationBell';
import {
    generateWellnessTips,
    generateEmpathyAlerts,
    analyzeSleepEnergyCorrelations,
    WellnessContext,
} from '../lib/wellnessAI';

type Tab = 'tips' | 'sleep' | 'empathy';

const Wellness: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { logs, getCyclePhase, cycleSettings } = useData();
    const cycleData = getCyclePhase();

    const [activeTab, setActiveTab] = useState<Tab>('tips');
    const [tipsText, setTipsText] = useState('');
    const [empathyText, setEmpathyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Build context for AI
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = logs.find(l => l.date === todayStr);

    const ctx: WellnessContext = {
        phase: cycleData.phase,
        cycleDay: cycleData.currentDay,
        moods: todayLog?.moods || [],
        symptoms: todayLog?.symptoms || [],
        sleepQuality: todayLog?.sleepQuality,
        energyLevel: todayLog?.energyLevel,
    };

    // Sleep/Energy correlations (client-side)
    const sleepData = useMemo(() => analyzeSleepEnergyCorrelations(logs), [logs]);

    // Fetch AI tips
    const fetchTips = async () => {
        setLoading(true);
        setError('');
        const result = await generateWellnessTips(ctx);
        if (result.error) setError(result.error);
        else setTipsText(result.text);
        setLoading(false);
    };

    const fetchEmpathy = async () => {
        setLoading(true);
        setError('');
        const result = await generateEmpathyAlerts(ctx);
        if (result.error) setError(result.error);
        else setEmpathyText(result.text);
        setLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'tips' && !tipsText) fetchTips();
        if (activeTab === 'empathy' && !empathyText) fetchEmpathy();
    }, [activeTab]);

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'tips', label: 'Tips', icon: 'spa' },
        { key: 'sleep', label: 'Sleep & Energy', icon: 'bedtime' },
        { key: 'empathy', label: 'Empathy', icon: 'favorite' },
    ];

    const renderTipsContent = () => {
        if (loading) return <LoadingSkeleton />;
        if (error) return <ErrorCard message={error} onRetry={fetchTips} isDark={isDark} />;

        return (
            <div className="flex flex-col gap-4">
                {/* Phase Context Header */}
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/30' : 'bg-purple-100'}`}>
                            <span className="material-symbols-filled text-purple-400 text-xl">cycle</span>
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{cycleData.phase} Phase</p>
                            <p className={`text-xs ${isDark ? 'text-purple-400/70' : 'text-purple-500'}`}>Day {cycleData.currentDay} of {cycleSettings.avgCycleLength}</p>
                        </div>
                    </div>
                    {todayLog?.moods && todayLog.moods.length > 0 && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                            Today's mood: {todayLog.moods.join(', ')}
                        </p>
                    )}
                </div>

                {/* AI Tips */}
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-dark border border-white/5' : 'bg-white border border-gray-100'} shadow-soft`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <span className="material-symbols-filled text-primary mr-2 align-middle">auto_awesome</span>
                            Your Personalized Tips
                        </h3>
                        <button onClick={fetchTips} className="text-primary text-xs font-semibold flex items-center gap-1 hover:opacity-80">
                            <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                        </button>
                    </div>
                    <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''} leading-relaxed whitespace-pre-line`}>
                        {tipsText ? <FormattedText text={tipsText} /> : 'Generating your personalized tips...'}
                    </div>
                </div>
            </div>
        );
    };

    const renderSleepContent = () => {
        const { sleepCounts, energyCounts, insights, totalLogs } = sleepData;
        const sleepTotal = sleepCounts.good + sleepCounts.fair + sleepCounts.poor;
        const energyTotal = energyCounts.high + energyCounts.medium + energyCounts.low;

        return (
            <div className="flex flex-col gap-4">
                {/* Sleep Distribution */}
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-dark border border-white/5' : 'bg-white border border-gray-100'} shadow-soft`}>
                    <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <span className="material-symbols-filled text-indigo-400 mr-2 align-middle">bedtime</span>
                        Sleep Quality
                    </h3>
                    {sleepTotal === 0 ? (
                        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>No sleep data logged yet. Start logging to see trends!</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <SleepBar label="Good" count={sleepCounts.good} total={sleepTotal} color="bg-emerald-500" isDark={isDark} />
                            <SleepBar label="Fair" count={sleepCounts.fair} total={sleepTotal} color="bg-amber-500" isDark={isDark} />
                            <SleepBar label="Poor" count={sleepCounts.poor} total={sleepTotal} color="bg-red-400" isDark={isDark} />
                        </div>
                    )}
                </div>

                {/* Energy Distribution */}
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-dark border border-white/5' : 'bg-white border border-gray-100'} shadow-soft`}>
                    <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <span className="material-symbols-filled text-amber-400 mr-2 align-middle">bolt</span>
                        Energy Levels
                    </h3>
                    {energyTotal === 0 ? (
                        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>No energy data logged yet. Start logging to see trends!</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <SleepBar label="High" count={energyCounts.high} total={energyTotal} color="bg-emerald-500" isDark={isDark} />
                            <SleepBar label="Medium" count={energyCounts.medium} total={energyTotal} color="bg-amber-500" isDark={isDark} />
                            <SleepBar label="Low" count={energyCounts.low} total={energyTotal} color="bg-red-400" isDark={isDark} />
                        </div>
                    )}
                </div>

                {/* Correlation Insights */}
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-cyan-50 border border-indigo-100'}`}>
                    <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <span className="material-symbols-filled text-cyan-400 mr-2 align-middle">insights</span>
                        Correlations
                    </h3>
                    <div className="flex flex-col gap-2">
                        {insights.map((insight, i) => (
                            <p key={i} className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{insight}</p>
                        ))}
                    </div>
                    <p className={`text-xs mt-3 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                        Based on {totalLogs} logged day{totalLogs !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        );
    };

    const renderEmpathyContent = () => {
        if (loading) return <LoadingSkeleton />;
        if (error) return <ErrorCard message={error} onRetry={fetchEmpathy} isDark={isDark} />;

        return (
            <div className="flex flex-col gap-4">
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-500/20' : 'bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100'}`}>
                    <p className={`text-sm ${isDark ? 'text-pink-300/80' : 'text-pink-700'}`}>
                        <span className="material-symbols-filled text-sm mr-1 align-middle">info</span>
                        This is what your partner will see as care suggestions. Share it with them!
                    </p>
                </div>

                <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-dark border border-white/5' : 'bg-white border border-gray-100'} shadow-soft`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <span className="material-symbols-filled text-pink-400 mr-2 align-middle">favorite</span>
                            Partner Care Guide
                        </h3>
                        <button onClick={fetchEmpathy} className="text-primary text-xs font-semibold flex items-center gap-1 hover:opacity-80">
                            <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                        </button>
                    </div>
                    <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''} leading-relaxed whitespace-pre-line`}>
                        {empathyText ? <FormattedText text={empathyText} /> : 'Generating empathy insights...'}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`animate-slideIn font-display flex flex-col pb-24 min-h-screen transition-colors ${isDark ? 'bg-background-dark' : 'bg-[#FDFCF8]'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-10 flex items-center justify-between backdrop-blur-md px-6 py-4 border-b ${isDark ? 'bg-[#121014] border-white/5' : 'bg-[#FDFCF8] border-gray-100'}`}>
                <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#121014]'}`}>Wellness</h1>
                <NotificationBell />
            </header>

            {/* Tabs */}
            <div className={`w-full overflow-x-auto no-scrollbar py-2 px-6 mb-4 ${isDark ? 'bg-background-dark' : 'bg-[#FDFCF8]'}`}>
                <div className="flex gap-2 min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex h-10 items-center gap-2 px-5 rounded-full text-sm font-semibold transition-all ${activeTab === tab.key
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="flex flex-col gap-4 px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'tips' && renderTipsContent()}
                        {activeTab === 'sleep' && renderSleepContent()}
                        {activeTab === 'empathy' && renderEmpathyContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

// --- Sub-components ---

const FormattedText = ({ text }: { text: string }) => {
    // Split text by ** bold syntax, including potential newlines inside
    const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <strong key={i} className="font-bold text-white dark:text-white" style={{ fontWeight: 800 }}>
                            {part.slice(2, -2).trim()}
                        </strong>
                    );
                }
                return part;
            })}
        </>
    );
};

const SleepBar = ({ label, count, total, color, isDark }: { label: string; count: number; total: number; color: string; isDark: boolean }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold">
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>{label}</span>
                <span className={isDark ? 'text-white/40' : 'text-gray-400'}>{count} days ({pct}%)</span>
            </div>
            <div className={`h-2.5 w-full rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 2)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-white/5 p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/5 rounded w-full mb-2" />
                <div className="h-3 bg-white/5 rounded w-5/6" />
            </div>
        ))}
    </div>
);

const ErrorCard = ({ message, onRetry, isDark }: { message: string; onRetry: () => void; isDark: boolean }) => (
    <div className={`rounded-2xl p-6 text-center ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
        <span className="material-symbols-outlined text-3xl text-red-400 mb-2">error</span>
        <p className={`text-sm mb-3 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{message}</p>
        <button onClick={onRetry} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-full">
            Try Again
        </button>
    </div>
);

export default Wellness;
