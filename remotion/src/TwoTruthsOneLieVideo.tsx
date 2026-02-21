import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const TwoTruthsOneLieVideo: React.FC<{
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

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Two Truths & a Lie</h1>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
					</div>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', position: 'relative' }}>
				
                {/* Score Bar Simulation */}
                <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'black', color: primaryColor }}>2</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>✍️ Writer</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', opacity: 0.3 }}>VS</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'black', color: '#ec4899' }}>1</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>🔍 Guesser</div>
                    </div>
                </div>

                {/* Round Dots Simulation */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
                    {[0,1,2,3,4,5].map(i => (
                        <div key={i} style={{ 
                            width: '12px', height: '12px', borderRadius: '50%',
                            backgroundColor: i <= stepIndex ? primaryColor : isDark ? '#333' : '#ccc',
                            opacity: i === stepIndex ? 1 : 0.4,
                            transform: i === stepIndex ? 'scale(1.2)' : 'scale(1)'
                        }} />
                    ))}
                </div>

                {/* Writing Phase Simulation */}
                {stepIndex === 0 && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         <p style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: primaryColor }}>Write 2 truths and 1 lie!</p>
                         {[1, 2, 3].map(i => {
                             const isLie = i === 2;
                             return (
                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: isLie ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                                        color: isLie ? 'white' : textColor
                                    }}>
                                        {isLie ? '🤥' : i}
                                    </div>
                                    <div style={{ 
                                        flex: 1, padding: '16px', borderRadius: '16px', fontSize: '14px',
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        border: isLie ? '2px solid #f87171' : 'none'
                                    }}>
                                        {i === 1 ? 'I have jumped out of a plane' : i === 2 ? 'I can speak seven languages' : 'I own a vintage record collection'}
                                    </div>
                                </div>
                             )
                         })}
                    </div>
                )}

                {/* Guessing Phase Simulation */}
                {stepIndex === 1 && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         <p style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>Which one is the lie?</p>
                         {[
                             'I have jumped out of a plane',
                             'I can speak seven languages',
                             'I own a vintage record collection'
                         ].map((text, i) => (
                             <div key={i} style={{ 
                                 padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 'medium',
                                 backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                                 border: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                 transform: i === 1 && frameInStep > 60 ? 'scale(0.95)' : 'scale(1)',
                                 transition: 'transform 0.1s'
                             }}>
                                 <span style={{ 
                                     display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                     width: '24px', height: '24px', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold',
                                     marginRight: '12px', backgroundColor: `${primaryColor}20`, color: primaryColor
                                 }}>{i + 1}</span>
                                 {text}
                             </div>
                         ))}
                    </div>
                )}

                {/* Revealed Phase Simulation */}
                {stepIndex === 2 && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         <p style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>Correct! 🎉</p>
                         {[
                             { text: 'I have jumped out of a plane', lie: false },
                             { text: 'I can speak seven languages', lie: true, picked: true },
                             { text: 'I own a vintage record collection', lie: false }
                         ].map((stmt, i) => (
                             <div key={i} style={{ 
                                 padding: '16px', borderRadius: '16px', fontSize: '14px',
                                 backgroundColor: stmt.lie ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                 border: stmt.lie ? '2px solid #f87171' : '2px solid rgba(16, 185, 129, 0.3)',
                                 position: 'relative'
                             }}>
                                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                     <span style={{ fontSize: '18px' }}>{stmt.lie ? '🤥' : '✅'}</span>
                                     <span style={{ flex: 1 }}>{stmt.text}</span>
                                     {stmt.picked && (
                                         <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}>
                                            👆 picked
                                         </span>
                                     )}
                                 </div>
                                 <p style={{ fontSize: '10px', fontWeight: 'bold', marginLeft: '30px', marginTop: '4px', color: stmt.lie ? '#f87171' : '#10b981' }}>
                                     {stmt.lie ? 'THE LIE' : 'TRUTH'}
                                 </p>
                             </div>
                         ))}
                         <div style={{ 
                            marginTop: '12px', padding: '20px', borderRadius: '20px', textAlign: 'center',
                            background: primaryColor, color: 'white', fontWeight: 'bold', fontSize: '18px'
                        }}>
                             Next Round ➡️
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
