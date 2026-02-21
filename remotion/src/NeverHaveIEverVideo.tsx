import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

const CATEGORY_COLORS: Record<string, string> = {
    Fun: 'linear-gradient(to bottom right, #f59e0b, #eab308)',
    Romantic: 'linear-gradient(to bottom right, #ec4899, #e11d48)',
    Spicy: 'linear-gradient(to bottom right, #ef4444, #f97316)',
    Deep: 'linear-gradient(to bottom right, #6366f1, #3b82f6)',
};

export const NeverHaveIEverVideo: React.FC<{
	config: GameTutorialConfig;
	primaryColor: string;
	isDark: boolean;
}> = ({ config, primaryColor, isDark }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = isDark ? '#121014' : '#FDFCF8';
	const textColor = isDark ? '#ffffff' : '#121014';

	// 120 frames per step
	const stepIndex = Math.floor(frame / 120);
	const frameInStep = frame % 120;

    const currentCard = useMemo(() => ({
        category: 'Spicy',
        statement: 'Never have I ever... dated a coworker.'
    }), []);

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Never Have I Ever</h1>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
					</div>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', position: 'relative', justifyContent: 'center' }}>
				
                {/* Score Bar Simulation */}
                {stepIndex >= 1 && (
                    <div style={{ 
                        position: 'absolute', top: '20px', 
                        padding: '8px 24px', borderRadius: '99px',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        fontSize: '18px', fontWeight: 'bold'
                    }}>
                        Round 1 / 10
                    </div>
                )}

                {/* Card Simulation */}
                {stepIndex >= 1 && (
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <div style={{ 
                            padding: '40px 32px', borderRadius: '32px', textAlign: 'center',
                            background: CATEGORY_COLORS[currentCard.category],
                            color: 'white', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                        }}>
                             <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: '99px', display: 'inline-block', fontSize: '14px', marginBottom: '20px' }}>
                                {currentCard.category}
                            </div>
                            <h2 style={{ fontSize: '28px', margin: 0, fontWeight: 'bold', lineHeight: 1.4 }}>
                                {currentCard.statement}
                            </h2>
                        </div>

                        {/* Buttons Simulation */}
                        {stepIndex === 1 && (
                            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                <div style={{ 
                                    flex: 1, padding: '20px', borderRadius: '20px', textAlign: 'center',
                                    background: 'linear-gradient(to right, #10b981, #059669)', color: 'white', fontWeight: 'bold',
                                    transform: frameInStep > 60 ? 'scale(0.95)' : 'scale(1)', transition: 'transform 0.1s'
                                }}>
                                    ✋ I Have
                                </div>
                                <div style={{ 
                                     flex: 1, padding: '20px', borderRadius: '20px', textAlign: 'center',
                                     background: 'linear-gradient(to right, #6366f1, #4f46e5)', color: 'white', fontWeight: 'bold'
                                }}>
                                    😇 Never
                                </div>
                            </div>
                        )}

                        {/* Match Result Simulation */}
                        {stepIndex === 2 && (
                            <div style={{ marginTop: '32px' }}>
                                <div style={{ 
                                    padding: '24px', borderRadius: '24px', 
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ opacity: 0.6, fontSize: '14px', margin: '0 0 8px 0' }}>You</p>
                                            <span style={{ fontSize: '32px' }}>✋</span>
                                            <p style={{ fontWeight: 'bold', margin: '8px 0 0 0' }}>I Have</p>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ opacity: 0.6, fontSize: '14px', margin: '0 0 8px 0' }}>Partner</p>
                                            <span style={{ fontSize: '32px' }}>✋</span>
                                            <p style={{ fontWeight: 'bold', margin: '8px 0 0 0' }}>I Have</p>
                                        </div>
                                    </div>
                                    <div style={{ 
                                        padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'
                                    }}>
                                        🎉 You matched!
                                    </div>
                                </div>
                                
                                <div style={{ 
                                    marginTop: '20px', padding: '20px', borderRadius: '20px', textAlign: 'center',
                                    background: primaryColor, color: 'white', fontWeight: 'bold', fontSize: '18px'
                                }}>
                                    Next Statement →
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State / Start */}
                {stepIndex === 0 && (
                    <div style={{ textAlign: 'center' }}>
                         <span style={{ fontSize: '80px', display: 'block', marginBottom: '24px' }}>🙅</span>
                         <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>Never Have I Ever</h2>
                         <p style={{ opacity: 0.6, fontSize: '18px', marginBottom: '40px' }}>Someone draw a statement!</p>
                         <div style={{ 
                            padding: '20px 40px', borderRadius: '20px', color: 'white', fontWeight: 'bold',
                            background: `linear-gradient(to right, ${primaryColor}, #4f46e5)`,
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                         }}>
                            Draw Statement
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
			boxShadow: '0 40px 80px rgba(0,0,0,0.3)'
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
