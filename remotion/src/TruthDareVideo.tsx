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

interface TruthDareVideoProps {
	primaryColor: string;
	isDark: boolean;
	config: any;
}

export const TruthDareVideo: React.FC<TruthDareVideoProps> = ({ primaryColor, isDark, config }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const numSteps = config.steps.length;
	const stepDuration = 120; // 4 seconds per step
	const currentStep = Math.min(Math.floor(frame / stepDuration), numSteps - 1);
	const stepFrame = frame % stepDuration;

	const scale = 1.85;

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
				<h1 style={{ color: TEXT_COLOR, fontSize: 18 * scale, fontWeight: 'bold', margin: 0 }}>Truth or Dare</h1>
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
					
					{/* Dice / Avatar Wait State */}
					{currentStep === 0 && (
						<div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{
                                fontSize: 64,
                                marginBottom: 16,
                                transform: `rotate(${Math.sin(frame / 10) * 10}deg)`
                            }}>
                                🎲
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                                It's your turn!
                            </h2>
                        </div>
					)}

					{/* Reveal Card */}
					{currentStep > 0 && (
						<div style={{
                            width: '100%',
                            padding: 32,
                            borderRadius: 24,
                            textAlign: 'center',
                            background: 'linear-gradient(to bottom right, #f43f5e, #dc2626)',
                            color: 'white',
                            marginBottom: 32,
                            position: 'relative',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                            transform: currentStep === 1 ? `scale(${interpolate(stepFrame, [0, 15], [0.9, 1], { extrapolateRight: 'clamp' })})` : 'scale(1)',
                            opacity: currentStep === 1 ? interpolate(stepFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }) : 1
                        }}>
                            <div style={{ position: 'absolute', left: 16, top: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Round 1</div>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 999, fontSize: 14, fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>
                                DARE
                            </span>
                            <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, lineHeight: 1.3 }}>Let your partner draw a mustache on your face with a washable marker or eyeliner.</h2>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Silly & Fun</p>
                        </div>
					)}

                    {/* Step 0: The Choice */}
					{currentStep === 0 && (
						<div style={{ width: '100%', display: 'flex', gap: 16 }}>
                            <div style={{
                                flex: 1, padding: '16px 0', borderRadius: 16, textAlign: 'center',
                                backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: 18,
                            }}>
                                Truth
                            </div>
                            <div style={{
                                flex: 1, padding: '16px 0', borderRadius: 16, textAlign: 'center',
                                backgroundColor: '#f43f5e', color: 'white', fontWeight: 'bold', fontSize: 18,
                                transform: stepFrame > 80 ? `scale(${interpolate(stepFrame - 80, [0, 5, 10], [1, 0.95, 1], { extrapolateRight: 'clamp' })})` : 'scale(1)'
                            }}>
                                Dare
                            </div>
                        </div>
					)}

                    {/* Step 2: Next Turn */}
                    {currentStep === 2 && (
                        <div style={{
                            width: '100%', padding: '16px 0', borderRadius: 16, textAlign: 'center',
                            backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold', fontSize: 18,
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                            transform: stepFrame > 40 ? `scale(${interpolate(stepFrame - 40, [0, 5, 10], [1, 0.95, 1], { extrapolateRight: 'clamp' })})` : 'scale(1)'
                        }}>
                            Next Turn
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
