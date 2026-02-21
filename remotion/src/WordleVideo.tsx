import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const BACKGROUND = '#FDFCF8';
const BACKGROUND_DARK = '#121014';

const BackIcon: React.FC<{ size: number, color: string }> = ({ size, color }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<line x1="19" y1="12" x2="5" y2="12" />
		<polyline points="12 19 5 12 12 5" />
	</svg>
);

const BellIcon: React.FC<{ size: number }> = ({ size }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
		<path d="M13.73 21a2 2 0 0 1-3.46 0" />
	</svg>
);

interface WordleVideoProps {
	primaryColor: string;
	isDark: boolean;
	config: any;
}

export const WordleVideo: React.FC<WordleVideoProps> = ({ primaryColor, isDark, config }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const numSteps = config.steps.length;
	const stepDuration = 120; // 4 seconds per step
	const currentStep = Math.min(Math.floor(frame / stepDuration), numSteps - 1);
	const stepFrame = frame % stepDuration;

	const scale = 1.35; // slightly smaller scale to fit the 6x5 board and keyboard

    const bg = isDark ? BACKGROUND_DARK : BACKGROUND;
    const textColor = isDark ? '#ffffff' : '#121014';
    const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // State emulation
    const word = "HEART";
    // For visual progression:
    // Step 0: Picking - Word is empty or being typed "H E A R T"
    const typingWord = currentStep === 0 ? "HEART".slice(0, Math.floor(interpolate(stepFrame, [0, 40], [0, 5], { extrapolateRight: 'clamp' }))) : "HEART";
    
    // Step 1: Guessing - "BEARS" typed
    // Step 2: Hints revealed - "BEARS" colored, typing "HEART"
    // Step 3: Win! - confetti / result
    const guess1TypedLength = currentStep === 1 ? Math.floor(interpolate(stepFrame, [0, 40], [0, 5], { extrapolateRight: 'clamp' })) : 5;
    const guess1Str = "BEARX".slice(0, guess1TypedLength);
    
    // In step 2, guess1 is locked in and colored. Guesser types guess2 "HEART"
    const guess2TypedLength = currentStep === 2 ? Math.floor(interpolate(stepFrame, [30, 70], [0, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) : (currentStep > 2 ? 5 : 0);
    const guess2Str = "HEART".slice(0, guess2TypedLength);

    // Helpers
    const getCellColor = (letter: string, col: number, guessRow: number) => {
        if (!letter) return { bg: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', border: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', text: textColor };
        
        // Coloring applies immediately in step 2 for guess1, step 3 for guess2
        const isSubmitted = (guessRow === 0 && currentStep > 1) || (guessRow === 1 && currentStep > 2);
        
        if (!isSubmitted) return { bg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', border: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af', text: textColor };

        // Evaluated
        if (word[col] === letter) return { bg: primaryColor, border: primaryColor, text: '#fff' };
        if (word.includes(letter)) return { bg: '#EAB308', border: '#CA8A04', text: '#fff' };
        return { bg: isDark ? '#333' : '#ddd', border: isDark ? '#555' : '#bbb', text: isDark ? '#888' : '#666' };
    };

	return (
		<AbsoluteFill style={{ backgroundColor: bg, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{
				position: 'absolute', top: 0, left: 0, right: 0,
				height: 70 * scale,
				display: 'flex', alignItems: 'center', justifyContent: 'space-between',
				padding: `0 ${20 * scale}px`,
				borderBottom: `1px solid ${borderColor}`,
				background: isDark ? 'rgba(18, 16, 20, 0.95)' : 'rgba(253, 252, 248, 0.95)',
				zIndex: 10
			}}>
				<div style={{ padding: 6, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<BackIcon size={20 * scale} color={textColor} />
				</div>
				<h1 style={{ color: textColor, fontSize: 18 * scale, fontWeight: 'bold', margin: 0 }}>Word Guess</h1>
				<div style={{ padding: 6, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<BellIcon size={20 * scale} />
				</div>
			</div>

			{/* Main Game Content Area */}
			<main style={{
				position: 'absolute', top: 70 * scale, left: 0, right: 0, bottom: 0,
				display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
				paddingTop: 30 * scale
			}}>
				<div style={{ transform: `scale(${scale * 0.9})`, transformOrigin: 'top center', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    
                    {/* Scores */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 900, color: primaryColor }}>3</div>
                            <span style={{ fontSize: 12, fontWeight: 'bold', color: textColor }}>🎯 Picker</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 'bold', padding: '4px 12px', borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: isDark ? '#9ca3af' : '#6b7280' }}>VS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 900, color: isDark ? '#f472b6' : '#ec4899' }}>2</div>
                            <span style={{ fontSize: 12, fontWeight: 'bold', color: textColor }}>💭 Guesser</span>
                        </div>
                    </div>

                    {/* Step 0: Picking Phase UI */}
                    {currentStep === 0 && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 30 }}>
                            <p style={{ fontSize: 18, fontWeight: 'bold', color: primaryColor, marginBottom: 16 }}>Pick a word for your partner!</p>
                            <button style={{
                                width: '100%', padding: 16, borderRadius: 16, fontWeight: 'bold', color: 'white', backgroundColor: primaryColor,
                                border: 'none', marginBottom: 16, fontSize: 16
                            }}>
                                🎲 Random Easy Word
                            </button>
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <div style={{ flex: 1, height: 1, backgroundColor: isDark ? '#374151' : '#d1d5db' }} />
                                <span style={{ fontSize: 12, color: '#9ca3af' }}>or</span>
                                <div style={{ flex: 1, height: 1, backgroundColor: isDark ? '#374151' : '#d1d5db' }} />
                            </div>
                            <div style={{ display: 'flex', width: '100%', gap: 8 }}>
                                <input readOnly value={typingWord} placeholder="Type your own (3-8 letters)..." style={{
                                    flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 'bold',
                                    border: 'none', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', color: textColor
                                }} />
                                <button style={{
                                    padding: '12px 20px', borderRadius: 12, fontWeight: 'bold', color: 'white', backgroundColor: primaryColor, border: 'none'
                                }}>Set</button>
                            </div>
                        </div>
                    )}

                    {/* Step 1-3: Guessing Phase UI (Board & Keyboard) */}
                    {currentStep > 0 && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {/* Board */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                {Array.from({ length: 6 }).map((_, row) => {
                                    let rowStr = "";
                                    if (row === 0) rowStr = guess1Str;
                                    else if (row === 1) rowStr = guess2Str;
                                    
                                    return (
                                        <div key={row} style={{ display: 'flex', gap: 6 }}>
                                            {Array.from({ length: 5 }).map((_, col) => {
                                                const letter = rowStr[col] || "";
                                                const colors = getCellColor(letter, col, row);
                                                
                                                // Shake animation for Row 0 at step1 -> step2 transition
                                                const isShaking = currentStep === 1 && stepFrame > 100 && row === 0;
                                                const offsetX = isShaking ? Math.sin(frame * 2) * 4 : 0;
                                                
                                                // Flip animation for Row 0 at start of step 2
                                                const isFlipping = currentStep === 2 && stepFrame < 30 && row === 0;
                                                const flipY = isFlipping ? interpolate(stepFrame - (col * 2), [0, 15], [90, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;

                                                // Flip animation for Row 1 at start of step 3
                                                const isFlippingRow1 = currentStep === 3 && stepFrame < 30 && row === 1;
                                                const flipY1 = isFlippingRow1 ? interpolate(stepFrame - (col * 2), [0, 15], [90, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;

                                                const currentFlipY = row === 0 ? flipY : (row === 1 ? flipY1 : 0);

                                                return (
                                                    <div key={col} style={{
                                                        width: 44, height: 44, borderRadius: 8,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 20, fontWeight: 900,
                                                        backgroundColor: colors.bg,
                                                        border: `2px solid ${colors.border}`,
                                                        color: colors.text,
                                                        transform: `translateX(${offsetX}px) rotateX(${currentFlipY}deg)`,
                                                        transition: 'all 0.1s'
                                                    }}>
                                                        {letter}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Result Text */}
                            {currentStep === 3 && stepFrame > 30 && (
                                <div style={{ textAlign: 'center', marginBottom: 16, opacity: interpolate(stepFrame, [30, 45], [0, 1], { extrapolateLeft: 'clamp' }) }}>
                                    <p style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981', margin: 0 }}>You got it! 🎉</p>
                                </div>
                            )}

                            {/* Keyboard */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 350, marginTop: currentStep === 3 ? 0 : 20 }}>
                                {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((kRow, ri) => (
                                    <div key={ri} style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                        {ri === 2 && (
                                            <div style={{ padding: '0 12px', height: 40, borderRadius: 8, fontSize: 12, fontWeight: 'bold', backgroundColor: primaryColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                ENTER
                                            </div>
                                        )}
                                        {kRow.split('').map(letter => {
                                            // Determine key color based on evaluated guesses
                                            let status = 'unused';
                                            if (currentStep > 1) {
                                                // Evaluate guess1 (BEARX)
                                                if ("BEARX"[word.indexOf(letter)] === letter && word.includes(letter)) status = 'correct';
                                                else if ("BEARX".includes(letter) && word.includes(letter)) status = 'present';
                                                else if ("BEARX".includes(letter)) status = 'absent';
                                            }
                                            if (currentStep > 2) {
                                                // Evaluate guess2 (HEART)
                                                if (word.includes(letter)) status = 'correct';
                                            }

                                            const kBg = status === 'correct' ? primaryColor : status === 'present' ? '#EAB308' : status === 'absent' ? (isDark ? '#333' : '#bbb') : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb');
                                            const kText = status === 'correct' || status === 'present' ? '#fff' : status === 'absent' ? (isDark ? '#666' : '#999') : (isDark ? '#fff' : '#333');
                                            
                                            const isPressed = (currentStep === 1 && letter === guess1Str[guess1TypedLength - 1] && stepFrame % 8 < 4) ||
                                                              (currentStep === 2 && letter === guess2Str[guess2TypedLength - 1] && stepFrame % 8 < 4);

                                            return (
                                                <div key={letter} style={{
                                                    width: 30, height: 40, borderRadius: 8, fontSize: 14, fontWeight: 'bold',
                                                    backgroundColor: kBg, color: kText,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transform: isPressed ? 'scale(0.85)' : 'scale(1)',
                                                }}>
                                                    {letter}
                                                </div>
                                            )
                                        })}
                                        {ri === 2 && (
                                            <div style={{ padding: '0 12px', height: 40, borderRadius: 8, fontSize: 12, fontWeight: 'bold', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                ⌫
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

				{/* Instruction Box at the bottom */}
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
						border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
						boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)'
					}}>
						<div style={{
							color: primaryColor,
							fontSize: '18px',
							fontWeight: '800',
							textTransform: 'uppercase',
							letterSpacing: '0.1em',
							marginBottom: '8px',
							display: 'flex',
							alignItems: 'center',
							gap: '12px'
						}}>
							<span style={{ 
								display: 'inline-block', 
								width: '8px', 
								height: '8px', 
								borderRadius: '50%', 
								backgroundColor: primaryColor,
								boxShadow: `0 0 10px ${primaryColor}`
							}} />
							STEP {currentStep + 1} OF {numSteps}
						</div>
						<h1 style={{
							fontSize: '36px',
							fontWeight: '800',
							color: isDark ? '#fff' : '#111',
							margin: '0 0 16px 0',
							lineHeight: 1.1
						}}>
							{config.steps[currentStep].title}
						</h1>
						<p style={{
							fontSize: '22px',
							color: isDark ? '#aaa' : '#666',
							margin: 0,
							lineHeight: 1.4,
							fontWeight: 500
						}}>
							{config.steps[currentStep].description}
						</p>
					</div>
				</div>
			</main>
		</AbsoluteFill>
	);
};
