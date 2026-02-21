import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const primaryColor = '#F43F5E';
const PARTNER_COLOR = '#06B6D4';
const BACKGROUND = '#121014';
const SCORE_SCALE = 1.85;

// Hangman SVG matching the game
const HangmanFigure: React.FC<{ wrong: number; color: string; scale?: number }> = ({ wrong, color, scale = 1 }) => (
    <svg viewBox="0 0 200 220" style={{ width: '100%', height: '100%', maxWidth: `${180 * scale}px` }}>
        {/* Gallows */}
        <line x1="40" y1="210" x2="160" y2="210" stroke={color} strokeWidth="4" strokeLinecap="round" opacity={0.3} />
        <line x1="80" y1="210" x2="80" y2="30" stroke={color} strokeWidth="4" strokeLinecap="round" opacity={0.3} />
        <line x1="80" y1="30" x2="140" y2="30" stroke={color} strokeWidth="4" strokeLinecap="round" opacity={0.3} />
        <line x1="140" y1="30" x2="140" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round" opacity={0.3} />
        {/* Head */}
        {wrong >= 1 && <circle cx="140" cy="65" r="15" stroke={color} strokeWidth="3" fill="none" />}
        {/* Body */}
        {wrong >= 2 && <line x1="140" y1="80" x2="140" y2="130" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {/* Left arm */}
        {wrong >= 3 && <line x1="140" y1="95" x2="115" y2="115" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {/* Right arm */}
        {wrong >= 4 && <line x1="140" y1="95" x2="165" y2="115" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {/* Left leg */}
        {wrong >= 5 && <line x1="140" y1="130" x2="120" y2="165" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {/* Right leg */}
        {wrong >= 6 && <line x1="140" y1="130" x2="160" y2="165" stroke={color} strokeWidth="3" strokeLinecap="round" />}
    </svg>
);

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Must match tutorial registry
const tutorialData = {
    hangman: {
        title: 'Hangman',
        steps: [
            { id: 0, title: 'The Setup', description: 'One player picks a secret word, the other tries to guess it.' },
            { id: 1, title: 'Guess Letters', description: 'Guess letters one by one. Correct letters fill in the blanks.' },
            { id: 2, title: 'Wrong Guesses', description: 'Every wrong guess adds a part to the hangman drawing.' },
            { id: 3, title: 'Win or Lose', description: 'Guess the word to survive, or let the drawing complete to lose!' },
        ]
    }
};

export const HangmanVideo: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 4 steps, 120 frames each = 480 frames
    const stepDuration = 120;
    const currentStep = Math.min(Math.floor(frame / stepDuration), 3);
    const frameInStep = frame % stepDuration;

    // Game state emulation
    let word = 'LOVE';
    let guessed: string[] = [];
    let wrongCount = 0;
    let pickerScore = 0;
    let guesserScore = 0;
    let phase: 'picking' | 'guessing' | 'finished' = 'picking';
    let result: 'win' | 'lose' | null = null;
    let activeKey: string | null = null;
    let pickerType: 'me' | 'partner' = 'me'; // We'll show "You" answering and "Partner" guessing logically

    // Logic Progression across frames
    if (currentStep === 0) {
        // Step 1: The Setup
        phase = 'picking';
        pickerType = 'me';
        // Simulating typing L O V E
        if (frameInStep > 30) word = 'L';
        if (frameInStep > 50) word = 'LO';
        if (frameInStep > 70) word = 'LOV';
        if (frameInStep > 90) word = 'LOVE';
        if (frameInStep <= 30) word = '';
    } else if (currentStep === 1) {
        // Step 2: Guess Letters
        phase = 'guessing';
        pickerType = 'partner'; // Now partner picked, I guess
        word = 'LOVE';

        // Animate pressing 'L'
        let pL = spring({ fps, frame: frameInStep - 30, config: { damping: 12 } });
        if (pL > 0) {
            guessed.push('L');
        }
        if (pL > 0 && pL < 1) activeKey = 'L';

        // Animate pressing 'E'
        let pE = spring({ fps, frame: frameInStep - 70, config: { damping: 12 } });
        if (pE > 0) {
            guessed.push('E');
        }
        if (pE > 0 && pE < 1) activeKey = 'E';

    } else if (currentStep === 2) {
        // Step 3: Wrong Guesses
        phase = 'guessing';
        pickerType = 'partner';
        word = 'LOVE';
        guessed = ['L', 'E']; // Carry over

        // Incorrect presses
        let pX = spring({ fps, frame: frameInStep - 20, config: { damping: 12 } });
        if (pX > 0) { guessed.push('X'); wrongCount++; }
        if (pX > 0 && pX < 1) activeKey = 'X';

        let pZ = spring({ fps, frame: frameInStep - 60, config: { damping: 12 } });
        if (pZ > 0) { guessed.push('Z'); wrongCount++; }
        if (pZ > 0 && pZ < 1) activeKey = 'Z';

    } else if (currentStep === 3) {
        // Step 4: Win or Lose (Demonstrate a win)
        phase = 'guessing';
        pickerType = 'partner';
        word = 'LOVE';
        guessed = ['L', 'E', 'X', 'Z']; 
        wrongCount = 2;

        let pV = spring({ fps, frame: frameInStep - 15, config: { damping: 12 } });
        if (pV > 0) { guessed.push('V'); }
        if (pV > 0 && pV < 1) activeKey = 'V';

        let pO = spring({ fps, frame: frameInStep - 50, config: { damping: 12 } });
        if (pO > 0) { guessed.push('O'); }
        if (pO > 0 && pO < 1) activeKey = 'O';

        if (frameInStep > 70) {
            phase = 'finished';
            result = 'win';
            guesserScore = 1; // You increase score
        }
    }

    const { title, description } = tutorialData.hangman.steps[currentStep];

    const myScoreDisplay = pickerType === 'me' ? pickerScore : guesserScore;
    const partnerScoreDisplay = pickerType === 'partner' ? pickerScore : guesserScore;

    const amPicker = pickerType === 'me';
    const amGuesser = !amPicker;

    return (
        <AbsoluteFill style={{ backgroundColor: BACKGROUND, fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
                
                {/* Persistent Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, color: isDark ? 'white' : 'black' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Hangman</h1>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </div>
                </div>

                <main style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    paddingTop: '20px', paddingBottom: '20px', paddingLeft: '40px', paddingRight: '40px', position: 'relative',
                    transform: 'scale(1)', transformOrigin: 'top center'
                }}>
                    {/* Scores */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: `${24 * SCORE_SCALE}px`, width: '100%', maxWidth: `${320 * SCORE_SCALE}px`, marginBottom: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ fontSize: `${24 * SCORE_SCALE}px`, fontWeight: 900, color: primaryColor }}>{myScoreDisplay}</div>
                            <span style={{ fontSize: `${12 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : 'black' }}>{amPicker ? '🎯 Picker' : '💭 Guesser'}</span>
                        </div>
                        <div style={{ fontSize: `${14 * SCORE_SCALE}px`, fontWeight: 'bold', padding: '4px 12px', borderRadius: '99px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: isDark ? '#9CA3AF' : '#6B7280' }}>VS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ fontSize: `${24 * SCORE_SCALE}px`, fontWeight: 900, color: PARTNER_COLOR }}>{partnerScoreDisplay}</div>
                            <span style={{ fontSize: `${12 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : 'black' }}>{amPicker ? '💭 Guesser' : '🎯 Picker'}</span>
                        </div>
                    </div>

                    {/* Game Content Area */}
                    <div style={{ display: 'flex', flex: 1, width: '100%', flexDirection: 'column', alignItems: 'center', position: 'relative', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                        
                        {phase === 'picking' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '16px', width: '100%', maxWidth: '384px' }}>
                                <p style={{ fontSize: '18px', fontWeight: 'bold', color: primaryColor, margin: 0 }}>Choose a word for your partner!</p>
                                <div style={{ 
                                    width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 'bold', color: 'white', backgroundColor: primaryColor,
                                    opacity: 0.5, textAlign: 'center'
                                }}>
                                    🎲 Random Word
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>or</span>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <div style={{ 
                                        flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 'medium',
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6', color: isDark ? 'white' : 'black'
                                    }}>
                                        {word || <span style={{color: '#6B7280'}}>Type your own word...</span>}
                                        {word && <div style={{display:'inline-block', width: '2px', height: '14px', backgroundColor: 'white', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s infinite'}}/>}
                                    </div>
                                    <div style={{ padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', color: 'white', backgroundColor: primaryColor }}>Set</div>
                                </div>
                            </div>
                        )}

                        {(phase === 'guessing' || phase === 'finished') && (
                            <>
                                {/* Hangman Figure */}
                                <div style={{ width: '176px', height: '176px', display: 'flex', justifyContent: 'center' }}>
                                    <HangmanFigure wrong={wrongCount} color={isDark ? '#fff' : '#333'} />
                                </div>

                                {/* Wrong Count */}
                                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '8px 0 16px 0' }}>
                                    {wrongCount} / 6 wrong
                                </p>

                                {/* Word Display */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
                                    {word.split('').map((letter, i) => {
                                        const isGuessed = guessed.includes(letter);
                                        const revealed = amPicker || isGuessed || phase === 'finished';
                                        
                                        return (
                                            <div key={i} style={{
                                                width: '36px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '18px', fontWeight: 900, 
                                                borderBottom: `3px solid ${isGuessed ? primaryColor : (isDark ? '#444' : '#ccc')}`,
                                                color: isGuessed ? primaryColor : (isDark ? '#888' : '#aaa'),
                                                backgroundColor: revealed && isGuessed ? (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6') : (isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB')
                                            }}>
                                                {revealed ? letter : ''}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Result Message */}
                                {phase === 'finished' && (
                                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                        {result === 'win' && <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#22C55E', margin: 0 }}>You guessed it! 🎉</p>}
                                    </div>
                                )}

                                {/* Keyboard */}
                                {phase === 'guessing' && amGuesser && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', maxWidth: '384px' }}>
                                        {ALPHABET.map(letter => {
                                            const used = guessed.includes(letter);
                                            const correct = used && word.includes(letter);
                                            const wrong = used && !word.includes(letter);
                                            const isActive = activeKey === letter;

                                            return (
                                                <div key={letter} style={{
                                                    width: '36px', height: '40px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: correct ? primaryColor : isActive ? 'rgba(255,255,255,0.3)' : (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6'),
                                                    color: correct ? 'white' : (isDark ? 'white' : 'black'),
                                                    opacity: wrong ? 0.2 : 1,
                                                    transform: isActive ? 'scale(0.85)' : 'scale(1)'
                                                }}>
                                                    {letter}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
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
                                Step {currentStep + 1} of 4
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
