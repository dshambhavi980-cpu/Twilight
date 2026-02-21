import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const ThisOrThatVideo: React.FC<{
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

	const optionA = "Coffee";
	const optionB = "Tea";

	const myVote = (stepIndex >= 1 ? 'A' : null) as 'A' | 'B' | null;
	const partnerVote = (stepIndex >= 2 ? 'A' : null) as 'A' | 'B' | null;
	const showResult = myVote && partnerVote;

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>This or That</h1>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px', position: 'relative', gap: '30px' }}>
				
				{/* Progress Dots */}
				<div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
					{[1,2,3,4,5].map(i => (
						<div key={i} style={{ 
							width: '12px', height: '12px', borderRadius: '50%', 
							backgroundColor: i === 1 ? primaryColor : (isDark ? '#333' : '#ddd'),
							transform: i === 1 ? 'scale(1.25)' : 'scale(1)',
							transition: 'all 0.3s'
						}} />
					))}
				</div>

				{/* Status Header */}
				<div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					{showResult ? (
						<div style={{ 
							backgroundColor: 'rgba(34,197,94,0.2)', color: '#22C55E', padding: '12px 24px', borderRadius: '99px', fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' 
						}}>
							✨ It's a Match!
						</div>
					) : (myVote && !partnerVote) ? (
						<div style={{ backgroundColor: 'rgba(234,179,8,0.2)', color: '#EAB308', padding: '10px 20px', borderRadius: '12px', fontSize: '18px', fontWeight: 500 }}>
							✅ You picked! Waiting for partner...
						</div>
					) : (
						<div style={{ color: '#666', fontSize: '18px' }}>Pick your favorite!</div>
					)}
				</div>

				{/* Option A */}
				<button style={{ 
					width: '100%', padding: '40px 20px', borderRadius: '32px', border: `3px solid ${myVote === 'A' ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
					backgroundColor: myVote === 'A' ? `${primaryColor}15` : (isDark ? 'rgba(255,255,255,0.05)' : '#fff'),
					position: 'relative', overflow: 'hidden', pointerEvents: 'none',
					color: 'inherit'
				}}>
					<span style={{ fontSize: '32px', fontWeight: 700 }}>{optionA}</span>
					{showResult && partnerVote === 'A' && (
						<div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '14px', backgroundColor: primaryColor, padding: '4px 12px', borderRadius: '99px', color: 'white' }}>Partner</div>
					)}
				</button>

				<div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '99px', fontSize: '14px', fontWeight: 'bold', color: '#666' }}>OR</div>

				{/* Option B */}
				<button style={{ 
					width: '100%', padding: '40px 20px', borderRadius: '32px', border: `3px solid ${myVote === 'B' ? '#A855F7' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
					backgroundColor: myVote === 'B' ? 'rgba(168,85,247,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : '#fff'),
					position: 'relative', overflow: 'hidden', pointerEvents: 'none',
					color: 'inherit'
				}}>
					<span style={{ fontSize: '32px', fontWeight: 700 }}>{optionB}</span>
					{showResult && partnerVote === 'B' && (
						<div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '14px', backgroundColor: '#A855F7', color: 'white', padding: '4px 12px', borderRadius: '99px' }}>Partner</div>
					)}
				</button>

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
