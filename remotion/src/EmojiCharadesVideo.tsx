import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const EmojiCharadesVideo: React.FC<{
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
	const category = "Superpowers";
	const emojis = "🦸‍♂️⚡🔥";
	const answer = "Human Torch";
	const roundNumber = 1;
	const totalRounds = 5;

	const showAnswer = stepIndex >= 2;
	const showGuess = stepIndex >= 1;

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Emoji Charades</h1>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
					</div>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px', position: 'relative' }}>
				
				{/* Progress Dots */}
				<div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
					{[1,2,3,4,5].map(i => (
						<div key={i} style={{ 
							width: '12px', height: '12px', borderRadius: '50%', 
							backgroundColor: i === roundNumber ? primaryColor : (isDark ? '#333' : '#ddd'),
							transform: i === roundNumber ? 'scale(1.25)' : 'scale(1)',
							transition: 'all 0.3s'
						}} />
					))}
				</div>

				{/* Category Badge */}
				<div style={{ 
                    backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '8px 24px', borderRadius: '99px', 
                    fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' 
                }}>
					{category} — Round {roundNumber} / {totalRounds}
				</div>

				{/* Emoji Box */}
				<div style={{ 
                    width: '100%', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                    borderRadius: '40px', padding: '80px 40px', marginBottom: '40px', border: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    textAlign: 'center'
                }}>
					<div style={{ fontSize: '90px', letterSpacing: '12px' }}>{emojis}</div>
				</div>

                {/* Answer/Reveal Section */}
                <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showAnswer ? (
                        <div style={{ 
                            backgroundColor: '#22c55e', color: 'white', padding: '24px', borderRadius: '24px', 
                            width: '100%', textAlign: 'center', fontSize: '28px', fontWeight: 'bold' 
                        }}>
                            {answer}
                        </div>
                    ) : (
                        <div style={{ color: '#666', fontStyle: 'italic', fontSize: '20px' }}>
                            Tap below to reveal the answer...
                        </div>
                    )}
                </div>

                {/* Guess Input Simulation */}
                <div style={{ width: '100%', marginTop: '40px' }}>
                    <div style={{ color: '#666', fontSize: '16px', textAlign: 'left', marginBottom: '8px' }}>Your Guess</div>
                    <div style={{ 
                        width: '100%', padding: '20px 24px', borderRadius: '24px', 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        fontSize: '20px', color: showGuess ? textColor : '#666'
                    }}>
                        {showGuess ? "Human Torch" : "Type your guess..."}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        <div style={{ 
                            flex: 1, padding: '24px', borderRadius: '24px', fontWeight: 'bold', fontSize: '20px', textAlign: 'center',
                            backgroundColor: showGuess ? '#f97316' : 'rgba(249,115,22,0.3)', color: 'white'
                        }}>
                            Submit Guess
                        </div>
                        <div style={{ 
                            flex: 1, padding: '24px', borderRadius: '24px', fontWeight: 'bold', fontSize: '20px', textAlign: 'center',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: '#666'
                        }}>
                            {showGuess ? "Winner!" : "Waiting..."}
                        </div>
                    </div>
                </div>

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
