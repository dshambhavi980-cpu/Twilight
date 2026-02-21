import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

const CATEGORY_EMOJI: Record<string, string> = {
    Preferences: '⚡',
    Personal: '💭',
    Hypothetical: '🔮',
    Couple: '💕',
    Wild: '🔥',
    Deep: '🌊',
    Speed: '⏱️',
};

export const RapidFireVideo: React.FC<{
	config: GameTutorialConfig;
	primaryColor: string;
	isDark: boolean;
}> = ({ config, primaryColor, isDark }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = isDark ? '#121014' : '#FDFCF8';
	const textColor = isDark ? '#ffffff' : '#121014';

	// 120 frames per step (4 seconds)
	const stepIndex = Math.floor(frame / 120);
	const frameInStep = frame % 120;

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Rapid Fire</h1>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
					</div>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', position: 'relative' }}>
				
                {/* Playing Phase Simulation */}
                {(stepIndex === 0 || stepIndex === 1) && (
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                            <div style={{ width: '30%', height: '100%', borderRadius: '3px', backgroundColor: '#f97316' }} />
                        </div>

                        {/* Timer Bar */}
                        <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '24px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${interpolate(frameInStep, [0, 120], [100, 0])}%`, 
                                height: '100%', 
                                backgroundColor: frameInStep > 80 ? '#ef4444' : '#22c55e'
                            }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', opacity: 0.5 }}>
                            <span>3 / 10</span>
                            <span style={{ fontWeight: 'bold' }}>{Math.ceil((120 - frameInStep) / 30)}s</span>
                        </div>

                        {/* Category */}
                        <div style={{ marginBottom: '16px' }}>
                            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                {CATEGORY_EMOJI['Preferences']} Preferences
                            </span>
                        </div>

                        {/* Question Card */}
                        <div style={{ 
                            padding: '24px', borderRadius: '24px', marginBottom: '24px',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>
                                Coffee or Tea?
                            </h2>
                        </div>

                        {/* Input Simulation */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ 
                                flex: 1, padding: '16px', borderRadius: '16px', fontSize: '16px',
                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                                color: textColor, border: `2px solid ${primaryColor}40`
                            }}>
                                {frameInStep > 40 ? 'Coffee' : ''}
                                <span style={{ opacity: Math.sin(frame / 5) > 0 ? 1 : 0 }}>|</span>
                            </div>
                            <div style={{ 
                                width: '56px', height: '56px', borderRadius: '16px', 
                                backgroundColor: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 'bold', fontSize: '20px'
                            }}>
                                →
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Phase Simulation */}
                {stepIndex === 2 && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         <h2 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px' }}>🎉 Your Answers!</h2>
                         {[
                             { q: 'Beach or Mountains?', a: 'Mountains', cat: 'Preferences' },
                             { q: 'Pizza or Burger?', a: 'Pizza', cat: 'Preferences' },
                             { q: 'Coffee or Tea?', a: 'Coffee', cat: 'Preferences' }
                         ].map((item, i) => (
                             <div key={i} style={{ 
                                 padding: '16px', borderRadius: '16px',
                                 backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                 boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                             }}>
                                 <p style={{ fontSize: '10px', opacity: 0.5, marginBottom: '4px' }}>{CATEGORY_EMOJI[item.cat]} {item.cat}</p>
                                 <p style={{ fontSize: '14px', fontWeight: 'medium', marginBottom: '4px' }}>{item.q}</p>
                                 <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#f97316', margin: 0 }}>{item.a}</p>
                             </div>
                         ))}
                         <div style={{ 
                            marginTop: '12px', padding: '16px', borderRadius: '16px', textAlign: 'center',
                            background: `linear-gradient(to r, #8b5cf6, #d946ef)`, color: 'white', fontWeight: 'bold'
                        }}>
                             ✨ Partner's Turn
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
