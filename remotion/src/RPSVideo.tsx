import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const SCORE_SCALE = 1.85;

const PRIMARY_COLOR = '#00F0FF';
const PARTNER_COLOR = '#06B6D4';
const IS_DARK = true;
const BACKGROUND = IS_DARK ? '#121014' : '#FDFCF8';

type Choice = 'rock' | 'paper' | 'scissors' | null;

const CHOICES: { id: Choice; label: string; emoji: string }[] = [
    { id: 'rock', label: 'Rock', emoji: '🪨' },
    { id: 'paper', label: 'Paper', emoji: '📄' },
    { id: 'scissors', label: 'Scissors', emoji: '✂️' },
];

const tutorialData = {
    'rps': {
        steps: [
            { id: 0, title: 'Make Your Choice', description: 'Quickly select Rock, Paper, or Scissors before the timer runs out.' },
            { id: 1, title: 'The Rules', description: 'Rock crushes Scissors, Scissors cuts Paper, Paper covers Rock.' },
            { id: 2, title: 'Best of 5', description: 'The first person to win 3 rounds wins the match!' },
        ]
    }
};

interface RPSVideoProps {
    primaryColor?: string;
    isDark?: boolean;
}

export const RPSVideo: React.FC<RPSVideoProps> = ({
    primaryColor = PRIMARY_COLOR,
    isDark = IS_DARK,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const currentStep = Math.min(Math.floor(frame / 120), 2);
    const frameInStep = frame % 120;

    let myScore = 0;
    let partnerScore = 0;
    let currentRound = 1;
    let rounds: { winner: string | null }[] = [];
    
    let isChoosing = false;
    let myChoice: Choice = null;
    let partnerChoice: Choice = null;
    let showResult = false;
    let countdown: number | null = null;
    let isFinished = false;

    // Logic for Step 0: Make Your Choice
    if (currentStep === 0) {
        myScore = 0;
        partnerScore = 0;
        currentRound = 1;
        isChoosing = true;
        
        let choiceAnim = spring({ fps, frame: frameInStep - 30, config: { damping: 14 } });
        if (choiceAnim > 0) {
            myChoice = 'rock';
        }

    } 
    // Logic for Step 1: The Rules (Reveal Rock vs Scissors)
    else if (currentStep === 1) {
        myScore = 0;
        partnerScore = 0;
        currentRound = 1;

        if (frameInStep < 30) {
            countdown = 3;
        } else if (frameInStep < 60) {
            countdown = 2;
        } else if (frameInStep < 90) {
            countdown = 1;
        } else {
            showResult = true;
            myChoice = 'rock';
            partnerChoice = 'scissors';
            // score updates slightly after reveal
            let scoreUpdateAnim = spring({ fps, frame: frameInStep - 100, config: { damping: 14 } });
            if (scoreUpdateAnim > 0) {
                myScore = 1;
                rounds.push({ winner: 'me' });
            }
        }
    } 
    // Logic for Step 2: Best of 5 (Final Round reveal)
    else if (currentStep === 2) {
        currentRound = 5;
        myScore = 2;
        partnerScore = 2;
        rounds = [{ winner: 'me' }, { winner: 'partner' }, { winner: 'partner' }, { winner: 'me' }];

        if (frameInStep < 20) {
            countdown = 3;
        } else if (frameInStep < 40) {
            countdown = 2;
        } else if (frameInStep < 60) {
            countdown = 1;
        } else {
            showResult = true;
            myChoice = 'paper';
            partnerChoice = 'rock';
            
            let scoreUpdateAnim = spring({ fps, frame: frameInStep - 75, config: { damping: 14 } });
            if (scoreUpdateAnim > 0) {
                myScore = 3;
                rounds = [{ winner: 'me' }, { winner: 'partner' }, { winner: 'partner' }, { winner: 'me' }, { winner: 'me' }];
                isFinished = true;
            }
        }
    }

    const { title, description } = tutorialData['rps'].steps[currentStep];

    return (
        <AbsoluteFill style={{ backgroundColor: BACKGROUND, fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
                
                {/* Persistent Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, color: isDark ? 'white' : 'black' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Rock Paper Scissors</h1>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </div>
                </div>

                <main style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    paddingTop: '40px', paddingBottom: '20px', paddingLeft: '40px', paddingRight: '40px', position: 'relative'
                }}>
                    {/* Scores & Best of 5 indicator */}
                    {!isFinished && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${32 * SCORE_SCALE}px`, width: '100%', maxWidth: `${320 * SCORE_SCALE}px`, marginBottom: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${4 * SCORE_SCALE}px` }}>
                                    <div style={{ fontSize: `${48 * SCORE_SCALE}px`, fontWeight: 900, color: primaryColor }}>{myScore}</div>
                                    <span style={{ fontSize: `${14 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : '#121014' }}>You</span>
                                </div>
                                <div style={{
                                    fontSize: `${16 * SCORE_SCALE}px`, fontWeight: '500', padding: `${8 * SCORE_SCALE}px ${16 * SCORE_SCALE}px`,
                                    borderRadius: `${50 * SCORE_SCALE}px`,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                                    color: isDark ? '#9CA3AF' : '#6B7280'
                                }}>
                                    Best of 5
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${4 * SCORE_SCALE}px` }}>
                                    <div style={{ fontSize: `${48 * SCORE_SCALE}px`, fontWeight: 900, color: '#F472B6' }}>{partnerScore}</div>
                                    <span style={{ fontSize: `${14 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : '#121014' }}>Partner</span>
                                </div>
                            </div>

                            {/* Round Progress Dots */}
                            <div style={{ display: 'flex', gap: `${6 * SCORE_SCALE}px`, marginBottom: '48px' }}>
                                {Array.from({ length: 5 }, (_, i) => {
                                    const round = rounds[i];
                                    let bg = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';
                                    if (round) {
                                        if (round.winner === 'me') bg = '#22C55E';
                                        else if (round.winner === 'partner') bg = '#F87171';
                                    }
                                    
                                    const isCurrent = i === currentRound - 1 && !round;
                                    
                                    return (
                                        <div key={i} style={{
                                            width: `${12 * SCORE_SCALE}px`, height: `${12 * SCORE_SCALE}px`, borderRadius: '50%',
                                            backgroundColor: bg,
                                            boxShadow: isCurrent ? `0 0 0 ${2 * SCORE_SCALE}px ${BACKGROUND}, 0 0 0 ${4 * SCORE_SCALE}px ${primaryColor}` : 'none'
                                        }} />
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Main Interaction Area */}
                    <div style={{ display: 'flex', flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 'auto', transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                        
                        {/* Countdown */}
                        {countdown !== null && !showResult && (
                            <div style={{
                                fontSize: `${96 * SCORE_SCALE}px`, fontWeight: 900, color: primaryColor,
                                transform: `scale(${interpolate(frameInStep % 30, [0, 10], [2, 1], { extrapolateRight: 'clamp' })})`,
                                opacity: interpolate(frameInStep % 30, [0, 10, 20, 30], [0, 1, 1, 0], { extrapolateRight: 'clamp' })
                            }}>
                                {countdown}
                            </div>
                        )}

                        {/* Reveal */}
                        {showResult && !isFinished && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: `${32 * SCORE_SCALE}px` }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${8 * SCORE_SCALE}px` }}>
                                    <div style={{ fontSize: `${96 * SCORE_SCALE}px` }}>{CHOICES.find(c => c.id === myChoice)?.emoji}</div>
                                    <span style={{ fontSize: `${14 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : '#121014' }}>You</span>
                                </div>
                                <span style={{ fontSize: `${32 * SCORE_SCALE}px`, fontWeight: 900, color: isDark ? '#9CA3AF' : '#9CA3AF' }}>VS</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${8 * SCORE_SCALE}px` }}>
                                    <div style={{ fontSize: `${96 * SCORE_SCALE}px` }}>{CHOICES.find(c => c.id === partnerChoice)?.emoji}</div>
                                    <span style={{ fontSize: `${14 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : '#121014' }}>Partner</span>
                                </div>
                            </div>
                        )}

                        {/* Choice Buttons */}
                        {isChoosing && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${24 * SCORE_SCALE}px` }}>
                                <p style={{
                                    fontWeight: 'bold', fontSize: `${20 * SCORE_SCALE}px`, margin: 0,
                                    color: myChoice ? '#22C55E' : primaryColor
                                }}>
                                    {myChoice ? `You chose ${CHOICES.find(c => c.id === myChoice)?.label}` : `Round ${currentRound} — Pick!`}
                                </p>

                                <div style={{ display: 'flex', gap: `${16 * SCORE_SCALE}px` }}>
                                    {CHOICES.map(c => {
                                        const isSelected = myChoice === c.id;
                                        const isFaded = myChoice && !isSelected;
                                        
                                        return (
                                            <div key={c.id} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${8 * SCORE_SCALE}px`,
                                                padding: `${20 * SCORE_SCALE}px`, borderRadius: `${32 * SCORE_SCALE}px`,
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                                border: isDark ? 'none' : '1px solid #F3F4F6',
                                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                                opacity: isFaded ? 0.3 : 1,
                                                boxShadow: isSelected ? `0 0 0 ${3 * SCORE_SCALE}px ${primaryColor}` : (isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
                                            }}>
                                                <span style={{ fontSize: `${64 * SCORE_SCALE}px` }}>{c.emoji}</span>
                                                <span style={{ fontSize: `${16 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : '#121014' }}>{c.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {myChoice && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * SCORE_SCALE}px`, color: '#9CA3AF', fontSize: `${16 * SCORE_SCALE}px` }}>
                                        <div style={{
                                            width: `${20 * SCORE_SCALE}px`, height: `${20 * SCORE_SCALE}px`, borderRadius: '50%',
                                            border: `${3 * SCORE_SCALE}px solid ${primaryColor}`, borderTopColor: 'transparent',
                                            transform: `rotate(${frame * 10}deg)`
                                        }} />
                                        Waiting for partner...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Game Over */}
                        {isFinished && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${16 * SCORE_SCALE}px` }}>
                                <div style={{ fontSize: `${80 * SCORE_SCALE}px` }}>🏆</div>
                                <p style={{ fontSize: `${32 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : '#121014', margin: 0 }}>You won!</p>
                                <p style={{ fontSize: `${20 * SCORE_SCALE}px`, color: '#9CA3AF', margin: 0 }}>{myScore} – {partnerScore}</p>
                                
                                <div style={{
                                    width: `${300 * SCORE_SCALE}px`, padding: `${20 * SCORE_SCALE}px`, marginTop: `${16 * SCORE_SCALE}px`,
                                    borderRadius: `${24 * SCORE_SCALE}px`, fontWeight: 'bold', color: 'white',
                                    backgroundColor: primaryColor, textAlign: 'center', fontSize: `${18 * SCORE_SCALE}px`,
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                }}>
                                    Play Again 🔄
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Tutorial Instruction Box (Fixed at Bottom with exact dimensions of TicTacToe) */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 64px)',
                    zIndex: 20
                }}>
                    <div style={{
                        backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '32px',
                        padding: '32px 40px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{
                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                color: isDark ? 'white' : 'black',
                                padding: '8px 16px',
                                borderRadius: '99px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}>
                                Step {currentStep + 1} of 3
                            </div>
                        </div>
                        
                        <h2 style={{
                            margin: 0,
                            fontSize: '36px',
                            fontWeight: 'bold',
                            color: isDark ? 'white' : 'black'
                        }}>
                            {title}
                        </h2>
                        
                        <p style={{
                            margin: 0,
                            fontSize: '24px',
                            color: isDark ? '#A1A1AA' : '#52525B',
                            lineHeight: 1.5,
                        }}>
                            {description}
                        </p>
                    </div>
                </div>

            </div>
        </AbsoluteFill>
    );
};
