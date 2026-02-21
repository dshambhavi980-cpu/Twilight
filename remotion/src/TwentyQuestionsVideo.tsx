import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const TwentyQuestionsVideo: React.FC<{
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

	// Simulation states
	const myScore = 1;
	const partnerScore = 0;
	const category = "Animal";
	const thing = "Lion";
    const questionsLeft = 18;

    const questions = [
        { text: "Is it a mammal?", answer: "yes" as const },
        { text: "Does it live in water?", answer: "no" as const },
    ];

    const showSetup = stepIndex === 0;
    const showPlaying = stepIndex === 1 || stepIndex === 2;
    const showGuessing = stepIndex === 3;

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>20 Questions</h1>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
					</div>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', position: 'relative', gap: '20px' }}>
				
                {/* Scores */}
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', width: '100%', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 900, color: primaryColor }}>{myScore}</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Thinker</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '99px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: '#666' }}>VS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 900, color: '#f472b6' }}>{partnerScore}</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Asker</div>
                    </div>
                </div>

                {showSetup && (
                    <div style={{ width: '100%', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: primaryColor, marginBottom: '8px' }}>Think of something!</p>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>Pick a category and describe what you're thinking of.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                            {['Animal', 'Person', 'Place', 'Object'].map(cat => (
                                <div key={cat} style={{ 
                                    padding: '8px 16px', borderRadius: '99px', fontSize: '14px', fontWeight: 'bold',
                                    backgroundColor: cat === category ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                                    color: cat === category ? 'white' : '#666'
                                }}>{cat}</div>
                            ))}
                        </div>
                        <div style={{ width: '100%', padding: '20px', borderRadius: '20px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', textAlign: 'left', color: textColor, fontSize: '16px' }}>
                            Lion
                        </div>
                    </div>
                )}

                {(showPlaying || showGuessing) && (
                    <>
                        <div style={{ padding: '8px 24px', borderRadius: '99px', fontSize: '14px', fontWeight: 'bold', backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                            Category: {category}
                        </div>
                        <p style={{ fontSize: '12px', color: '#666' }}>{questionsLeft} questions remaining</p>
                        <p style={{ fontSize: '12px', color: '#666' }}>Your thing: <span style={{ fontWeight: 'bold', color: primaryColor }}>{thing}</span></p>

                        <div style={{ width: '100%', flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                            {questions.map((q, i) => (
                                <div key={i} style={{ padding: '12px', borderRadius: '16px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: `${primaryColor}20`, color: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{i + 1}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{q.text}</div>
                                    </div>
                                    <div style={{ marginTop: '8px', marginLeft: '32px', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', backgroundColor: q.answer === 'yes' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: q.answer === 'yes' ? '#22c55e' : '#ef4444' }}>
                                        {q.answer === 'yes' ? '✅ Yes' : '❌ No'}
                                    </div>
                                </div>
                            ))}
                            {stepIndex === 2 && (
                                <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white', opacity: 0.6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: `${primaryColor}20`, color: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>3</div>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>Is it the king of the jungle?</div>
                                    </div>
                                    <div style={{ marginTop: '8px', marginLeft: '32px', display: 'flex', gap: '8px' }}>
                                        <div style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>✅ Yes</div>
                                        <div style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>❌ No</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {showGuessing && (
                    <div style={{ width: '100%', textAlign: 'center', padding: '20px', borderRadius: '24px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Final guess:</p>
                        <p style={{ fontSize: '28px', fontWeight: 900, color: primaryColor, marginBottom: '20px' }}>"Lion"</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <div style={{ padding: '12px 24px', borderRadius: '16px', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold' }}>✅ Correct!</div>
                            <div style={{ padding: '12px 24px', borderRadius: '16px', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold' }}>❌ Wrong!</div>
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
