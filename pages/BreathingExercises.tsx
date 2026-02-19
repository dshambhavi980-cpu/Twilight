import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Exercise {
    name: string;
    description: string;
    steps: { label: string; duration: number }[]; // duration in seconds
    rounds: number;
    color: string;
    icon: string;
}

const EXERCISES: Exercise[] = [
    {
        name: 'Box Breathing',
        description: 'Equal parts inhale, hold, exhale, hold. Great for calming anxiety.',
        steps: [
            { label: 'Inhale', duration: 4 },
            { label: 'Hold', duration: 4 },
            { label: 'Exhale', duration: 4 },
            { label: 'Hold', duration: 4 },
        ],
        rounds: 4,
        color: '#6366F1',
        icon: 'crop_square',
    },
    {
        name: '4-7-8 Relaxation',
        description: 'A natural tranquilizer for the nervous system. Perfect before sleep.',
        steps: [
            { label: 'Inhale', duration: 4 },
            { label: 'Hold', duration: 7 },
            { label: 'Exhale', duration: 8 },
        ],
        rounds: 4,
        color: '#8B5CF6',
        icon: 'nights_stay',
    },
    {
        name: 'Deep Calm',
        description: 'Simple deep breathing for quick relaxation during your day.',
        steps: [
            { label: 'Inhale', duration: 5 },
            { label: 'Exhale', duration: 5 },
        ],
        rounds: 6,
        color: '#14B8A6',
        icon: 'self_improvement',
    },
];

const BreathingExercises: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cleanup = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    const startExercise = (exercise: Exercise) => {
        setSelectedExercise(exercise);
        setCurrentStepIdx(0);
        setCurrentRound(1);
        setTimeLeft(exercise.steps[0].duration);
        setIsRunning(false);
        setIsComplete(false);
    };

    const toggleRunning = () => {
        if (!selectedExercise) return;

        if (isRunning) {
            cleanup();
            setIsRunning(false);
        } else {
            setIsRunning(true);
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Move to next step
                        setCurrentStepIdx(prevStep => {
                            const nextStep = prevStep + 1;
                            if (nextStep >= selectedExercise.steps.length) {
                                // Next round
                                setCurrentRound(prevRound => {
                                    if (prevRound >= selectedExercise.rounds) {
                                        // Complete!
                                        cleanup();
                                        setIsRunning(false);
                                        setIsComplete(true);
                                        return prevRound;
                                    }
                                    return prevRound + 1;
                                });
                                return 0; // Reset to first step
                            }
                            return nextStep;
                        });
                        return 0; // Will be set by the step change effect
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    // Update timeLeft when step changes
    useEffect(() => {
        if (selectedExercise && isRunning && !isComplete) {
            setTimeLeft(selectedExercise.steps[currentStepIdx].duration);
        }
    }, [currentStepIdx, currentRound]);

    const resetExercise = () => {
        cleanup();
        setSelectedExercise(null);
        setIsRunning(false);
        setIsComplete(false);
    };

    const currentStep = selectedExercise?.steps[currentStepIdx];
    const totalStepDuration = currentStep?.duration || 1;
    const progress = totalStepDuration > 0 ? (totalStepDuration - timeLeft) / totalStepDuration : 0;

    // Circle animation scale: expand on inhale, contract on exhale
    const getCircleScale = () => {
        if (!currentStep || !isRunning) return 1;
        if (currentStep.label === 'Inhale') return 1 + progress * 0.4;
        if (currentStep.label === 'Exhale') return 1.4 - progress * 0.4;
        return 1.2; // Hold
    };

    return (
        <div className={`animate-slideIn font-display flex flex-col pb-24 min-h-screen transition-colors ${isDark ? 'bg-background-dark' : 'bg-[#FDFCF8]'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-10 flex items-center gap-3 backdrop-blur-md px-6 py-4 border-b ${isDark ? 'bg-[#121014] border-white/5' : 'bg-[#FDFCF8] border-gray-100'}`}>
                <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                    <span className={`material-symbols-outlined ${isDark ? 'text-white' : 'text-[#121014]'}`}>arrow_back</span>
                </button>
                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#121014]'}`}>Breathing Exercises</h1>
            </header>

            <main className="flex flex-col gap-6 px-6 pt-4">
                <AnimatePresence mode="wait">
                    {!selectedExercise ? (
                        // Exercise Selection
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col gap-4"
                        >
                            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                Choose a breathing technique to help you relax, focus, or wind down.
                            </p>
                            {EXERCISES.map((ex, i) => (
                                <motion.button
                                    key={ex.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => startExercise(ex)}
                                    className={`rounded-2xl p-5 text-left transition-all ${isDark ? 'bg-surface-dark border border-white/5 hover:border-white/15' : 'bg-white border border-gray-100 hover:border-gray-200 shadow-soft'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${ex.color}20` }}
                                        >
                                            <span className="material-symbols-filled text-2xl" style={{ color: ex.color }}>{ex.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{ex.name}</h3>
                                            <p className={`text-xs mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{ex.description}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                                                <span className={isDark ? 'text-white/30' : 'text-gray-300'}>
                                                    {ex.steps.map(s => `${s.duration}s`).join(' · ')}
                                                </span>
                                                <span className={isDark ? 'text-white/30' : 'text-gray-300'}>
                                                    {ex.rounds} rounds
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`material-symbols-outlined ${isDark ? 'text-white/20' : 'text-gray-300'}`}>chevron_right</span>
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    ) : isComplete ? (
                        // Completion screen
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center pt-16 gap-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center"
                            >
                                <span className="material-symbols-filled text-5xl text-emerald-500">check_circle</span>
                            </motion.div>
                            <div className="text-center">
                                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Well Done! 🎉</h2>
                                <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                    You completed {selectedExercise.rounds} rounds of {selectedExercise.name}
                                </p>
                            </div>
                            <button
                                onClick={resetExercise}
                                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20"
                            >
                                Back to Exercises
                            </button>
                        </motion.div>
                    ) : (
                        // Active Exercise
                        <motion.div
                            key="active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center pt-8 gap-8"
                        >
                            {/* Round indicator */}
                            <div className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                Round {currentRound} of {selectedExercise.rounds}
                            </div>

                            {/* Breathing Circle */}
                            <div className="relative w-56 h-56 flex items-center justify-center">
                                {/* Background rings */}
                                <div className="absolute inset-0 rounded-full border-2 opacity-10" style={{ borderColor: selectedExercise.color }} />
                                <div className="absolute inset-4 rounded-full border opacity-10" style={{ borderColor: selectedExercise.color }} />

                                {/* Animated circle */}
                                <motion.div
                                    className="rounded-full flex items-center justify-center"
                                    style={{
                                        backgroundColor: `${selectedExercise.color}20`,
                                        border: `3px solid ${selectedExercise.color}`,
                                        width: 160,
                                        height: 160,
                                    }}
                                    animate={{
                                        scale: getCircleScale(),
                                    }}
                                    transition={{
                                        duration: isRunning ? 1 : 0.3,
                                        ease: 'easeInOut',
                                    }}
                                >
                                    <div className="text-center">
                                        <p className="text-4xl font-bold" style={{ color: selectedExercise.color }}>
                                            {timeLeft}
                                        </p>
                                        <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                            {currentStep?.label}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Step indicators */}
                            <div className="flex items-center gap-2">
                                {selectedExercise.steps.map((step, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${i === currentStepIdx
                                                ? 'text-white shadow-md'
                                                : isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'
                                            }`}
                                        style={i === currentStepIdx ? { backgroundColor: selectedExercise.color } : {}}
                                    >
                                        {step.label}
                                    </div>
                                ))}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={resetExercise}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    <span className={`material-symbols-outlined ${isDark ? 'text-white/70' : 'text-gray-600'}`}>close</span>
                                </button>
                                <button
                                    onClick={toggleRunning}
                                    className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg"
                                    style={{ backgroundColor: selectedExercise.color }}
                                >
                                    <span className="material-symbols-filled text-3xl">
                                        {isRunning ? 'pause' : 'play_arrow'}
                                    </span>
                                </button>
                                <div className="w-14" /> {/* Spacer for centering */}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default BreathingExercises;
