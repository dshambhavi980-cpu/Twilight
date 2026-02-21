import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const ConnectFourVideo: React.FC<{
	config: GameTutorialConfig;
	primaryColor: string;
	isDark: boolean;
}> = ({ config, primaryColor, isDark }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = isDark ? '#121014' : '#FDFCF8';
	const textColor = isDark ? '#ffffff' : '#121014';

	// DERIVE BOARD STATE
	const stepIndex = Math.floor(frame / 120);
	const frameInStep = frame % 120;
	
	const dropProgress = spring({ 
		fps, 
		frame: Math.max(0, frameInStep - 15), 
		config: { damping: 14 } 
	});

	let board = Array.from({ length: 6 }, () => Array(7).fill(null));

	// Precalculate states for each step to ensure perfect synchronization
	let targetRow = -1;
	let targetCol = -1;
	let activeColor = 'R';
	let isAnimating = false;

	if (stepIndex === 0) {
		// Just a starter piece
		board[5][3] = 'R';
	} else if (stepIndex === 1) {
		// "Drop Discs" - drop a red disc into column 4
		board[5][3] = 'R'; 
		targetRow = 5; targetCol = 4; activeColor = 'R'; isAnimating = true;
		if (dropProgress >= 1) board[targetRow][targetCol] = 'R';
	} else if (stepIndex === 2) {
		// "Block" - partner (Yellow) is about to win, we drop Red to block
		board[5][2] = 'Y'; board[5][3] = 'Y'; board[5][4] = 'Y';
		targetRow = 5; targetCol = 5; activeColor = 'R'; isAnimating = true;
		if (dropProgress >= 1) board[targetRow][targetCol] = 'R';
	} else if (stepIndex === 3) {
		// "Connect Four" - we drop the winning Red piece
		board[5][2] = 'R'; board[5][3] = 'R'; board[5][4] = 'R';
		// Add some random yellow pieces to make it look like a game
		board[4][2] = 'Y'; board[4][3] = 'Y'; board[5][1] = 'Y';
		
		targetRow = 5; targetCol = 5; activeColor = 'R'; isAnimating = true;
		if (dropProgress >= 1) board[targetRow][targetCol] = 'R';
	}

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Persistent Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Connect Four</h1>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', paddingBottom: '20px', paddingLeft: '24px', paddingRight: '24px', position: 'relative' }}>
				
				{/* Players Badge */}
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '32px' }}>
					<PlayerBadge color="#ef4444" label="You" isActive={stepIndex % 2 === 0} isDark={isDark} />
					<div style={{ fontSize: '24px', fontWeight: 'bold', color: '#666', padding: '8px 20px', borderRadius: '99px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>VS</div>
					<PlayerBadge color="#facc15" label="Partner" isActive={stepIndex % 2 !== 0} isDark={isDark} />
				</div>

				<h2 style={{ color: primaryColor, margin: '0 0 24px 0', fontSize: '32px', fontWeight: 'bold' }}>
					{stepIndex % 2 === 0 ? 'Your turn' : "Partner's turn"}
				</h2>

				{/* Board */}
				<div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 'auto' }}>
				<div style={{ 
					backgroundColor: isDark ? 'rgba(30, 58, 138, 0.4)' : '#2563eb', 
					borderRadius: '40px', 
					padding: '20px',
					boxShadow: '0 40px 80px rgba(0,0,0,0.2)'
				}}>
					<div style={{ display: 'grid', gap: '12px' }}>
						{board.map((row, r) => (
							<div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
								{row.map((cell, c) => {
									const isThisCellAnimating = isAnimating && r === targetRow && c === targetCol;
									const content = (isThisCellAnimating && dropProgress > 0 && dropProgress < 1) ? activeColor : cell;
									const y = isThisCellAnimating ? interpolate(dropProgress, [0, 1], [-800, 0]) : 0;
									
									// Check if it's part of the winning line in step 3
									const isWin = stepIndex === 3 && frameInStep > 60 && r === 5 && c >= 2 && c <= 5;

									return (
										<div key={c} style={{ 
											width: '56px', height: '56px', borderRadius: '50%',
											backgroundColor: isDark ? '#121014' : '#ffffff',
											border: isWin ? `4px solid white` : 'none',
											boxShadow: isWin ? `0 0 30px white` : 'none',
											display: 'flex', alignItems: 'center', justifyContent: 'center',
											overflow: 'hidden', position: 'relative'
										}}>
											{content && (
												<div style={{ 
													width: '100%', height: '100%', borderRadius: '50%',
													backgroundColor: content === 'R' ? '#ef4444' : '#facc15',
													transform: `translateY(${y}px)`
												}} />
											)}
										</div>
									);
								})}
							</div>
						))}
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

const PlayerBadge: React.FC<{ color: string; label: string; isActive: boolean; isDark: boolean }> = ({ color, label, isActive, isDark }) => (
	<div style={{ 
		display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', borderRadius: '24px', width: '120px',
		backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)') : 'transparent',
		border: isActive ? `3px solid ${color}` : '3px solid transparent'
	}}>
		<div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: color }} />
		<span style={{ fontSize: '20px', fontWeight: 700, opacity: isActive ? 1 : 0.5 }}>{label}</span>
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
			position: 'absolute', bottom: '60px', left: '40px', right: '40px',
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
