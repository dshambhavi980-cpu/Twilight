import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const WouldYouRatherVideo: React.FC<{
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

	// Game State Simulation
	const phase = stepIndex === 0 ? 'dilemma' : stepIndex === 1 ? 'choice' : 'compare';
	
	const question = "Would you rather...";
	const optionA = "Always have to sing rather than speak";
	const optionB = "Always have to dance rather than walk";

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Would You Rather</h1>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px', position: 'relative' }}>
				
				{/* Match Info */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', opacity: stepIndex >= 2 ? 1 : 0.5 }}>
					<span style={{ fontSize: '24px' }}>💕</span>
					<span style={{ fontSize: '24px', fontWeight: 'bold', color: primaryColor }}>100% match</span>
					<span style={{ color: '#666' }}>•</span>
					<span style={{ color: '#666', fontSize: '20px' }}>1/5</span>
				</div>

				{/* Question Text */}
				<div style={{ textAlign: 'center', marginBottom: '40px' }}>
					<span style={{ 
						fontSize: '18px', fontWeight: 'bold', padding: '6px 16px', borderRadius: '99px', 
						backgroundColor: `${primaryColor}20`, color: primaryColor, marginBottom: '16px', display: 'inline-block' 
					}}>
						Superpowers
					</span>
					<p style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1.4, margin: '16px 0' }}>{question}</p>
				</div>

				{/* Options */}
				<div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
					<Option 
						label="A" 
						text={optionA} 
						isActive={stepIndex >= 1} 
						isPartner={stepIndex >= 2}
						primaryColor={primaryColor} 
						isDark={isDark} 
					/>
					<Option 
						label="B" 
						text={optionB} 
						isActive={false} 
						isPartner={false}
						primaryColor={primaryColor} 
						isDark={isDark} 
					/>
				</div>

				{/* Match Result Overlay */}
				{stepIndex >= 2 && (
					<div style={{ marginTop: '40px', textAlign: 'center', animation: 'pop 0.5s ease-out' }}>
						<div style={{ fontSize: '48px', marginBottom: '10px' }}>💕</div>
						<div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22C55E' }}>You both agree!</div>
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

const Option: React.FC<{ label: string; text: string; isActive: boolean; isPartner: boolean; primaryColor: string; isDark: boolean }> = ({ label, text, isActive, isPartner, primaryColor, isDark }) => (
	<div style={{ 
		padding: '24px', borderRadius: '24px', border: `3px solid ${isActive ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
		backgroundColor: isActive ? `${primaryColor}15` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
		display: 'flex', alignItems: 'center', gap: '16px', position: 'relative'
	}}>
		<div style={{ 
			width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isActive ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
			color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px'
		}}>
			{label}
		</div>
		<p style={{ flex: 1, fontSize: '20px', fontWeight: 500, margin: 0 }}>{text}</p>
		
		{isActive && !isPartner && (
			<div style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '14px', fontWeight: 'bold', color: primaryColor, backgroundColor: `${primaryColor}30`, padding: '2px 8px', borderRadius: '6px' }}>You</div>
		)}
		
		{isPartner && (
			<div style={{ position: 'absolute', top: '8px', right: '12px', display: 'flex', gap: '4px' }}>
				<span style={{ fontSize: '14px', fontWeight: 'bold', color: primaryColor, backgroundColor: `${primaryColor}30`, padding: '2px 8px', borderRadius: '6px' }}>You</span>
				<span style={{ fontSize: '14px', fontWeight: 'bold', color: '#F472B6', backgroundColor: '#F472B630', padding: '2px 8px', borderRadius: '6px' }}>Partner</span>
			</div>
		)}
	</div>
);

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
