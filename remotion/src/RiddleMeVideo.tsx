import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const RiddleMeVideo: React.FC<{
	config: GameTutorialConfig;
	primaryColor: string;
	isDark: boolean;
}> = ({ config, primaryColor, isDark }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = isDark ? '#121014' : '#FDFCF8';
	const textColor = isDark ? '#ffffff' : '#121014';

	const stepIndex = Math.floor(frame / 120);
	const frameInStep = frame % 120;

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Riddle Me</h1>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
					</div>
				</div>
			</div>

            {/* Scores Sim */}
            {(stepIndex === 1 || stepIndex === 2) && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', padding: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'black', color: primaryColor }}>3</div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>You</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', opacity: 0.3, fontSize: '12px', fontWeight: 'bold' }}>VS</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'black', color: '#f472b6' }}>2</div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Partner</div>
                    </div>
                </div>
            )}

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', position: 'relative' }}>
				
                {/* Setup Phase Simulation */}
                {stepIndex === 0 && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                         <p style={{ fontSize: '18px', fontWeight: 'bold', color: primaryColor }}>Pick difficulty & rounds!</p>
                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                            {[
                                { t: 'Easy', emoji: '😊' },
                                { t: 'Medium', emoji: '🤔' },
                                { t: 'Hard', emoji: '🔥' },
                                { t: 'Mixed', emoji: '🎲' }
                            ].map((d, i) => (
                                <div key={i} style={{ 
                                    padding: '12px 20px', borderRadius: '16px', backgroundColor: primaryColor,
                                    color: 'white', fontWeight: 'bold', fontSize: '14px',
                                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)',
                                    transform: i === 3 ? `scale(${interpolate(frameInStep, [40, 60], [1, 0.95], { extrapolateRight: 'clamp' })})` : 'scale(1)'
                                }}>
                                    {d.emoji} {d.t}
                                </div>
                            ))}
                         </div>
                         <p style={{ fontSize: '12px', opacity: 0.5 }}>10 rounds • Both guess simultaneously</p>
                    </div>
                )}

                {/* Playing Phase Simulation */}
                {stepIndex === 1 && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        {/* Round Dots */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[0,1,2,3,4,5,6,7,8,9].map(i => (
                                <div key={i} style={{ 
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    backgroundColor: i === 4 ? primaryColor : isDark ? '#333' : '#ddd',
                                    transform: i === 4 ? 'scale(1.2)' : 'scale(1)'
                                }} />
                            ))}
                        </div>

                        <span style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '99px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontWeight: 'bold' }}>
                            medium
                        </span>

                        <div style={{ 
                            padding: '24px', borderRadius: '24px', textAlign: 'center',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}>
                            <p style={{ fontSize: '16px', fontWeight: 'medium', lineHeight: 1.6, margin: 0 }}>
                                What has keys but can't open locks?
                            </p>
                        </div>

                        {frameInStep > 60 ? (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', marginBottom: '8px' }}>Your answer: <span style={{ color: primaryColor, fontWeight: 'bold' }}>Piano</span></p>
                                <div style={{ 
                                    width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${primaryColor}`,
                                    borderTopColor: 'transparent', margin: '0 auto',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px' }}>Waiting for partner...</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                <div style={{ 
                                    flex: 1, padding: '16px', borderRadius: '16px', fontSize: '14px',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', color: textColor
                                }}>
                                    Type your answer...
                                </div>
                                <div style={{ 
                                    width: '56px', height: '56px', borderRadius: '16px', 
                                    backgroundColor: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 'bold'
                                }}>Go</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Reveal Phase Simulation */}
                {stepIndex === 2 && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                            Answer: <span style={{ fontSize: '18px', color: primaryColor }}>Piano</span>
                        </p>

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <div style={{ 
                                flex: 1, padding: '16px', borderRadius: '24px', textAlign: 'center',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '2px solid #22c55e'
                            }}>
                                <p style={{ fontSize: '10px', opacity: 0.5, marginBottom: '4px' }}>You</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Piano</p>
                                <p style={{ fontSize: '20px', margin: 0 }}>✅</p>
                            </div>
                            <div style={{ 
                                flex: 1, padding: '16px', borderRadius: '24px', textAlign: 'center',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444'
                            }}>
                                <p style={{ fontSize: '10px', opacity: 0.5, marginBottom: '4px' }}>Partner</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Map</p>
                                <p style={{ fontSize: '20px', margin: 0 }}>❌</p>
                            </div>
                        </div>

                        <div style={{ 
                            width: '100%', padding: '20px', borderRadius: '20px', textAlign: 'center',
                            background: primaryColor, color: 'white', fontWeight: 'bold', fontSize: '18px',
                            boxShadow: '0 8px 32px rgba(225, 29, 72, 0.2)'
                        }}>
                             Next Riddle ➡️
                        </div>
                    </div>
                )}

				{/* Instructions */}
				{config.steps.map((step, i) => (
					<Sequence key={step.id} from={i * 120} durationInFrames={120} layout="none">
						<InstructionBox step={step} index={i} total={config.steps.length} color={primaryColor} />
					</Sequence>
				))}
			</div>
		</AbsoluteFill>
	);
};

const InstructionBox: React.FC<{ step: any; index: number; total: number; color: string }> = ({ step, index, total, color }) => {
	const frame = useCurrentFrame();
	const enter = spring({ fps: 30, frame, config: { damping: 14 } });
	const exit = frame > 105 ? spring({ fps: 30, frame: frame - 105, config: { damping: 14 } }) : 0;
	
	const y = interpolate(enter, [0, 1], [60, 0]) + interpolate(exit, [0, 1], [0, 60]);
	const opacity = interpolate(enter, [0, 1], [0, 1]) - interpolate(exit, [0, 1], [0, 1]);

	return (
		<div style={{ 
			position: 'absolute', bottom: '60px', left: '0px', right: '0px',
			backgroundColor: color, borderRadius: '40px', padding: '32px 40px', color: 'white',
			transform: `translateY(${y}px)`, opacity,
			boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
            zIndex: 100
		}}>
			<h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px 0' }}>{step.title}</h2>
			<p style={{ fontSize: '28px', opacity: 0.9, lineHeight: 1.4, margin: 0 }}>{step.description}</p>
			
			<div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
				{Array.from({ length: total }).map((_, i) => (
					<div key={i} style={{ 
						height: '8px', borderRadius: '4px', flex: i === index ? 2 : 1,
						backgroundColor: 'white', opacity: i === index ? 1 : 0.3
					}} />
				))}
			</div>
		</div>
	);
};
