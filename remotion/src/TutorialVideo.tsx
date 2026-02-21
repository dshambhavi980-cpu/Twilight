import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';
import { RemotionPreviews } from './RemotionPreviews';

export const TutorialVideo: React.FC<{
	config: GameTutorialConfig;
	primaryColor: string;
	isDark: boolean;
}> = ({ config, primaryColor, isDark }) => {
	const { fps } = useVideoConfig();
	const frame = useCurrentFrame();

	return (
		<AbsoluteFill style={{ 
			backgroundColor: isDark ? '#1a181c' : '#ffffff', 
			fontFamily: 'sans-serif',
			display: 'flex',
			flexDirection: 'column',
			color: isDark ? 'white' : '#121014'
		}}>
			{/* Persistent Header */}
			<div style={{ padding: '60px 40px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
				<h1 style={{ fontSize: '48px', margin: 0, fontWeight: 900 }}>{config.title}</h1>
				<p style={{ fontSize: '24px', margin: '12px 0 0 0', opacity: 0.6 }}>{config.description}</p>
			</div>

			{/* Sequences for each step */}
			{config.steps.map((step, index) => {
				const durationInFrames = 120; // 4 seconds per step @ 30fps
				const fromFrame = index * durationInFrames;

				return (
					<Sequence key={step.id} from={fromFrame} durationInFrames={durationInFrames}>
						<StepScreen 
							step={step} 
							stepIndex={index} 
							totalSteps={config.steps.length}
							primaryColor={primaryColor}
							isDark={isDark} 
						/>
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};

const StepScreen: React.FC<{
	step: any;
	stepIndex: number;
	totalSteps: number;
	primaryColor: string;
	isDark: boolean;
}> = ({ step, stepIndex, totalSteps, primaryColor, isDark }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Enter animation
	const enterProgress = spring({
		fps,
		frame,
		config: { damping: 14, stiffness: 200 }
	});

	// Exit animation
	const isExiting = frame > 105; // last 15 frames
	const exitProgress = isExiting ? spring({
		fps,
		frame: frame - 105,
		config: { damping: 14, stiffness: 200 }
	}) : 0;

	const yOffset = interpolate(enterProgress, [0, 1], [100, 0]) + interpolate(exitProgress, [0, 1], [0, -100]);
	const opacity = interpolate(enterProgress, [0, 1], [0, 1]) - interpolate(exitProgress, [0, 1], [0, 1]);

	return (
		<AbsoluteFill style={{ top: '180px', display: 'flex', flexDirection: 'column' }}>
			{/* Preview Area (Top 60%) */}
			<div style={{ 
				flex: 6, 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center',
				backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'
			}}>
				<div style={{ transform: `translateY(${yOffset}px) scale(${enterProgress})`, opacity }}>
					<RemotionPreviews
						type={step.previewType}
						stepIndex={stepIndex}
						primaryColor={primaryColor}
						isDark={isDark}
					/>
				</div>
			</div>

			{/* Text Area (Bottom 40%) */}
			<div style={{ flex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', textAlign: 'center' }}>
				<div style={{ transform: `translateY(${yOffset * 0.5}px)`, opacity }}>
					<h2 style={{ fontSize: '42px', fontWeight: 800, margin: '0 0 20px 0' }}>{step.title}</h2>
					<p style={{ fontSize: '28px', margin: 0, opacity: 0.8, lineHeight: 1.4 }}>{step.description}</p>
				</div>

				{/* Progress Dots */}
				<div style={{ position: 'absolute', bottom: '60px', display: 'flex', gap: '12px' }}>
					{Array.from({ length: totalSteps }).map((_, i) => (
						<div key={i} style={{ 
							height: '12px', 
							borderRadius: '6px', 
							transition: 'all 0.3s',
							width: i === stepIndex ? '48px' : '12px',
							backgroundColor: i === stepIndex ? primaryColor : (isDark ? '#333' : '#ddd')
						}} />
					))}
				</div>
			</div>
		</AbsoluteFill>
	);
};
