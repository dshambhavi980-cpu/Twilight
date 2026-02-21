import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const BACKGROUND = '#121014'; // Dark mode background
const SECONDARY_BG = '#1e1c22';
const TEXT_COLOR = '#ffffff';

const BackIcon: React.FC<{ size: number }> = ({ size }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

interface TriviaVideoProps {
	primaryColor: string;
	isDark: boolean;
	config: any;
}

export const TriviaVideo: React.FC<TriviaVideoProps> = ({ primaryColor, isDark, config }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const numSteps = config.steps.length;
	const stepDuration = 120; // 4 seconds per step
	const currentStep = Math.min(Math.floor(frame / stepDuration), numSteps - 1);
	const stepFrame = frame % stepDuration;

	// Scale everything up to fit nicely in 720x1280
	const scale = 1.85;

	// Fake Data
	const question = "What is my favorite movie?";
	const category = "Entertainment";
	const userAns = "The Matrix";
	const partnerAns = "Inception";

	// Animations
	const btnScale = spring({ frame: stepFrame, fps, config: { damping: 12 }, durationInFrames: 15 });
	const flipRotate = interpolate(stepFrame, [0, 20], [90, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
	const flipOpacity = interpolate(stepFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
	
	const typeLen = interpolate(stepFrame, [0, 30], [0, userAns.length], { extrapolateRight: 'clamp' });
	const typingAns = userAns.slice(0, Math.floor(typeLen));

	return (
		<AbsoluteFill style={{ backgroundColor: BACKGROUND, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{
				position: 'absolute', top: 0, left: 0, right: 0,
				height: 70 * scale,
				display: 'flex', alignItems: 'center', justifyContent: 'space-between',
				padding: `0 ${20 * scale}px`,
				borderBottom: '1px solid rgba(255,255,255,0.1)',
				background: 'rgba(18, 16, 20, 0.95)',
				zIndex: 10
			}}>
				<div style={{ padding: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<BackIcon size={20 * scale} />
				</div>
				<h1 style={{ color: TEXT_COLOR, fontSize: 18 * scale, fontWeight: 'bold', margin: 0 }}>Love Trivia</h1>
				<div style={{ padding: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<BellIcon size={20 * scale} />
				</div>
			</div>

			{/* Main Game Content Area */}
			<main style={{
				position: 'absolute', top: 70 * scale, left: 0, right: 0, bottom: 0,
				display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
				padding: `${40 * scale}px ${24 * scale}px`
			}}>
				<div style={{ transform: `scale(${scale * 0.9})`, transformOrigin: 'top center', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					
					{/* Step 0: Setup Rounds */}
					{currentStep === 0 && (
						<div style={{ width: '100%', textAlign: 'center' }}>
							<h2 style={{ fontSize: 30, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>Choose rounds</h2>
							<p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>Select how many rounds you'd like to play.</p>
							<div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                                {[5, 10, 15].map((n, i) => {
                                    const isClicked = n === 10 && stepFrame > 60;
                                    const s = isClicked ? interpolate(stepFrame - 60, [0, 5, 10], [1, 0.9, 1], { extrapolateRight: 'clamp' }) : 1;
                                    return (
                                        <div key={n} style={{
                                            padding: '16px 32px',
                                            borderRadius: 16,
                                            fontWeight: 'bold',
                                            fontSize: 18,
                                            color: 'white',
                                            backgroundColor: primaryColor,
                                            transform: `scale(${s})`
                                        }}>
                                            {n}
                                        </div>
                                    )
                                })}
							</div>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>The game creator chooses the number of rounds.</p>
						</div>
					)}

					{/* Step 1: Card Reveal */}
					{currentStep === 1 && (
						<div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: i === 1 ? primaryColor : '#333' }} />
                                ))}
                            </div>
                            <div style={{
                                width: '100%',
                                aspectRatio: '3/4',
                                maxHeight: 500,
                                borderRadius: 24,
                                padding: 32,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                textAlign: 'center',
                                background: 'linear-gradient(to bottom right, #ec4899, #e11d48)',
                                color: 'white',
                                position: 'relative',
                                transform: `rotateY(${flipRotate}deg)`,
                                opacity: flipOpacity,
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: 999, fontSize: 14, fontWeight: 500, marginBottom: 24 }}>
                                    {category}
                                </span>
                                <h2 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2 }}>{question}</h2>
                                <div style={{ position: 'absolute', left: 24, top: 24, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                                    Round 1 / 10
                                </div>
                            </div>
						</div>
					)}

					{/* Step 2: Guessing / Typing */}
					{currentStep === 2 && (
						<div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             <div style={{
                                width: '100%',
                                padding: 32,
                                borderRadius: 24,
                                textAlign: 'center',
                                background: 'linear-gradient(to bottom right, #ec4899, #e11d48)',
                                color: 'white',
                                marginBottom: 32,
                            }}>
                                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{question}</h2>
                            </div>
                            
                            <div style={{ width: '100%' }}>
                                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Your Answer</div>
                                <div style={{
                                    width: '100%', padding: '12px 16px', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: 'white', marginBottom: 12, border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', fontSize: 16, minHeight: 48
                                }}>
                                    {typingAns}
                                    {stepFrame % 30 < 15 && typingAns.length < userAns.length && <span style={{ borderRight: '2px solid white', marginLeft: 2, height: 20 }} />}
                                </div>

                                {stepFrame > 45 ? (
                                    <div style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 16, textAlign: 'center', fontWeight: 'bold',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1.5px solid rgba(16, 185, 129, 0.3)', marginBottom: 12
                                    }}>
                                        ✓ Your answer submitted
                                    </div>
                                ) : (
                                    <div style={{
                                        width: '100%', padding: '12px 0', borderRadius: 16, textAlign: 'center', fontWeight: 'bold', color: 'white',
                                        backgroundColor: primaryColor, opacity: typingAns.length > 0 ? 1 : 0.5, marginBottom: 12
                                    }}>
                                        Submit Answer
                                    </div>
                                )}

                                <div style={{
                                    width: '100%', padding: '10px', borderRadius: 16, textAlign: 'center', fontSize: 14, fontWeight: 500,
                                    backgroundColor: stepFrame > 80 ? 'rgba(16, 185, 129, 0.1)' : `${primaryColor}15`,
                                    color: stepFrame > 80 ? '#10b981' : primaryColor,
                                    border: `1px solid ${stepFrame > 80 ? 'rgba(16, 185, 129, 0.2)' : `${primaryColor}30`}`
                                }}>
                                    {stepFrame > 80 ? '✓ Partner has answered' : 'Waiting for partner...'}
                                </div>
                            </div>
						</div>
					)}
					
					{/* Step 3: Win or Lose */}
					{currentStep === 3 && (
						<div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                width: '100%',
                                padding: 32,
                                borderRadius: 24,
                                textAlign: 'center',
                                background: 'linear-gradient(to bottom right, #ec4899, #e11d48)',
                                color: 'white',
                                marginBottom: 32,
                            }}>
                                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{question}</h2>
                            </div>

                            {stepFrame < 60 ? (
                                <div style={{ fontSize: 64, fontWeight: 'bold', color: 'white' }}>
                                    {3 - Math.floor(stepFrame / 20)}
                                </div>
                            ) : (
                                <div style={{ width: '100%', padding: 24, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Revealed answers</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>You</div>
                                            <div style={{ fontWeight: 'bold', color: 'white', fontSize: 18 }}>{userAns}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Partner</div>
                                            <div style={{ fontWeight: 'bold', color: 'white', fontSize: 18 }}>{partnerAns}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
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
