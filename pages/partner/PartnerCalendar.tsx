import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { useCouples } from '../../contexts/CouplesContext';
import { useTheme } from '../../contexts/ThemeContext';
import LogDetailsModal from '../../components/LogDetailsModal';
import { calculateCyclePhase } from '../../lib/cycleUtils';

const PartnerCalendar: React.FC = () => {
    const { couple, partnerData } = useCouples();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // If not connected, show a placeholder
    if (!couple) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDark ? 'bg-[#121014]' : 'bg-[#FDFCF8]'}`}>
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">event_busy</span>
                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No Partner Connected</h2>
                <p className="text-gray-500 text-sm">Connect with a partner to view their cycle calendar.</p>
            </div>
        );
    }

    // Default values if partner data is missing
    const logs = partnerData?.logs || [];
    const cycleSettings = partnerData?.settings || {
        avgCycleLength: 28,
        avgPeriodLength: 5,
        lastPeriodStart: '',
        onboardingCompleted: false,
        irregularCycle: false
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    // Generate strict grid (including padding days)
    const startDay = startOfMonth(currentDate).getDay(); // 0 is Sunday
    const paddingDays = Array(startDay).fill(null);
    
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Cycle Phase Helper using shared utility - ensure mapping from snake_case to camelCase
    const getDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const log = logs.find(l => l.date === dateStr);
        
        // Fix key mapping: partnerSettings from supabase has snake_case
        const mappedSettings = {
            avgCycleLength: cycleSettings.avg_cycle_length || 28,
            avgPeriodLength: cycleSettings.avg_period_length || 5,
            lastPeriodStart: cycleSettings.last_period_start || '',
            onboardingCompleted: true,
            irregularCycle: false
        };

        const phase = calculateCyclePhase(dateStr, mappedSettings);

        return {
            isPeriod: !!(log?.flow && log.flow !== 'spotting'),
            isFertile: phase.isFertile,
            isOvulation: phase.isOvulation,
            isPredicted: phase.phase === 'Menstrual' && !log // predicted but not logged
        };
    };

    // Calculate Today's Phase for the header
    const todayPhase = calculateCyclePhase(new Date().toISOString().split('T')[0], {
        avgCycleLength: cycleSettings.avg_cycle_length || 28,
        avgPeriodLength: cycleSettings.avg_period_length || 5,
        lastPeriodStart: cycleSettings.last_period_start || '',
        onboardingCompleted: true,
        irregularCycle: false
    });

    const handleDayClick = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        setSelectedDate(dateStr);
        setIsModalOpen(true);
    };

    const selectedLog = selectedDate ? logs.find(l => l.date === selectedDate) || null : null;

    return (
        <div className={`pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#121014]' : 'bg-[#FDFCF8]'} font-display`}>
             {/* Header */}
             <div className="mb-8 pl-2">
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-[#121014]'}`}>
                    Calendar
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Viewing {partnerData?.profile?.full_name || 'Partner'}'s cycle
                </p>
            </div>

            {/* Calendar Card */}
            <div className={`rounded-[32px] overflow-hidden shadow-soft transition-all relative ${
                isDark 
                    ? 'bg-[#1E1B24] border border-white/5 shadow-none' 
                    : 'bg-white border border-gray-100 shadow-xl shadow-gray-200/50'
            }`}>
                {/* Month Navigator & Cycle Day */}
                <div className="p-6 pb-2 text-center relative z-20">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-gray-600'}`}>
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <div className="flex flex-col items-center">
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {format(currentDate, 'MMMM yyyy')}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFE66D]"></div>
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                                    Cycle Day {todayPhase.currentDay}
                                </span>
                            </div>
                        </div>
                        <button onClick={nextMonth} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-gray-600'}`}>
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-4 px-4 relative z-20">
                    {weekDays.map((day, i) => (
                        <div key={`${day}-${i}`} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 px-5 pb-8 gap-y-3 relative z-20">
                    {paddingDays.map((_, i) => (
                        <div key={`padding-${i}`} className="h-10" />
                    ))}
                    
                    {days.map((day) => {
                         const status = getDayStatus(day);
                         const isTodayDate = isToday(day);
                         const dateStr = format(day, 'yyyy-MM-dd');
                         const hasLog = logs.some(l => l.date === dateStr);

                         return (
                            <button
                                key={day.toString()}
                                onClick={() => handleDayClick(day)}
                                className="h-10 w-full flex flex-col items-center justify-center relative group rounded-xl transition-all active:scale-95 hover:bg-white/5"
                            >
                                {status.isPeriod ? (
                                    <div className="w-8 h-8 rounded-full bg-[#984369] flex items-center justify-center shadow-lg shadow-pink-900/20 relative z-10">
                                        <span className="text-sm font-bold text-white">{format(day, 'd')}</span>
                                    </div>
                                ) : status.isOvulation ? (
                                    <>
                                        <div className="absolute w-9 h-9 border-2 border-[#FFE66D] rounded-full shadow-[0_0_10px_rgba(255,230,109,0.3)]"></div>
                                        <span className="material-symbols-filled absolute text-[#FFE66D] text-[28px] opacity-20 top-0.5">
                                            brightness_high
                                        </span>
                                        <span className={`text-sm font-bold z-10 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            {format(day, 'd')}
                                        </span>
                                        <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#FFE66D]"></div>
                                    </>
                                ) : status.isPredicted ? (
                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#984369]/60 flex items-center justify-center">
                                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <span className={`text-sm font-medium ${isTodayDate ? (isDark ? 'text-white underline underline-offset-4 decoration-primary' : 'text-gray-900 font-bold') : (status.isFertile ? (isDark ? 'text-white' : 'text-gray-800') : (isDark ? 'text-gray-500' : 'text-gray-400'))}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {status.isFertile && (
                                            <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#4ECDC4] shadow-[0_0_8px_rgba(78,205,196,0.8)]"></div>
                                        )}
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
                
                {/* Legend */}
                <div className={`mt-4 pt-5 pb-6 border-t ${isDark ? 'border-white/5' : 'border-gray-100'} flex justify-center gap-6 relative z-20`}>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#984369] shadow-[0_0_8px_rgba(152,67,105,0.4)]"></div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Period</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full bg-[#4ECDC4] shadow-[0_0_8px_rgba(78,205,196,0.4)]"></div>
                         <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Fertile</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full bg-[#FFE66D] shadow-[0_0_8px_rgba(255,230,109,0.4)]"></div>
                         <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Ovulation</span>
                    </div>
                </div>

                {/* Bg Blobs */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#984369]/5 rounded-full blur-3xl pointer-events-none z-0"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#4ECDC4]/5 rounded-full blur-3xl pointer-events-none z-0"></div>
            </div>

             {/* Log Details Modal - Read Only */}
             {selectedDate && (
                 <LogDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    log={selectedLog}
                    date={selectedDate}
                    readOnly={true}
                 />
             )}
        </div>
    );
};

export default PartnerCalendar;
