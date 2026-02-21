import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const TicTacToeVideo: React.FC<{
	config: GameTutorialConfig;
	primaryColor: string;
	isDark: boolean;
}> = ({ config, primaryColor, isDark }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = isDark ? '#121014' : '#FDFCF8';
	const textColor = isDark ? '#ffffff' : '#121014';

	// DERIVE BOARD STATE FROM GLOBAL FRAME
	// Every 120 frames is a new step
	const stepIndex = Math.floor(frame / 120);
	const frameInStep = frame % 120;

	let board = Array(9).fill(null);
	
	// Progressive board builder with logical moves
	if (stepIndex >= 1) { 
		board[4] = 'X'; // Step 1: Place middle
		if (stepIndex === 1 && frameInStep > 60) board[0] = 'O'; // O responds
		if (stepIndex > 1) board[0] = 'O';
	}
	if (stepIndex >= 2) {
		board[2] = 'X';
		if (stepIndex === 2 && frameInStep > 40) board[6] = 'O'; // O blocks X's diagonal!
		if (stepIndex > 2) board[6] = 'O';
	}
	if (stepIndex >= 3) {
		board[5] = 'X'; // X threatens 3
		board[8] = 'O'; // O plays random
		if (frameInStep > 20) board[3] = 'X'; // X wins!
	}

	const isWinLine = stepIndex === 3 && frameInStep > 40;

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Persistent Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Tic Tac Toe</h1>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', paddingBottom: '20px', paddingLeft: '40px', paddingRight: '40px', position: 'relative' }}>
				
				{/* Players Badge */}
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '32px' }}>
					<PlayerBadge 
						symbol="X" 
						label="You" 
						isActive={stepIndex % 2 === 0} 
						color={primaryColor} 
						isDark={isDark} 
					/>
					<div style={{ fontSize: '24px', fontWeight: 'bold', color: '#666', padding: '8px 20px', borderRadius: '99px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>VS</div>
					<PlayerBadge 
						symbol="O" 
						label="Partner" 
						isActive={stepIndex % 2 !== 0} 
						color={isDark ? '#F472B6' : '#EC4899'} 
						isDark={isDark} 
						secondary 
					/>
				</div>

				<h2 style={{ color: primaryColor, margin: '0 0 24px 0', fontSize: '32px', fontWeight: 'bold' }}>
					{stepIndex % 2 === 0 ? 'Your turn' : "Partner's turn"}
				</h2>

				{/* Board Area */}
				<div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 'auto' }}>
					<div style={{ 
						width: '460px', 
						height: '460px', 
						padding: '20px', 
						borderRadius: '40px', 
						backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
						boxShadow: isDark ? 'none' : '0 40px 80px rgba(0,0,0,0.05)',
						border: isDark ? '2px solid rgba(255,255,255,0.05)' : '2px solid rgba(0,0,0,0.05)',
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gridTemplateRows: 'repeat(3, 1fr)',
						gap: '16px',
						position: 'relative'
					}}>
						{board.map((cell, i) => (
							<Cell 
								key={i} 
								value={cell} 
								isWinning={isWinLine && [3,4,5].includes(i)} 
								primaryColor={primaryColor} 
								isDark={isDark}
							/>
						))}
						
						{/* Winning Line SVG - perfectly centered on the middle row (indices 3,4,5) */}
						{isWinLine && (
							<div style={{ position: 'absolute', top: '50%', left: '20px', right: '20px', height: '0', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
								<svg viewBox="0 0 100 10" style={{ width: '100%', height: '20px', overflow: 'visible', transform: 'translateY(-50%)' }}>
									<line x1="-5" y1="5" x2="105" y2="5" stroke={primaryColor} strokeWidth="6" strokeLinecap="round" />
								</svg>
							</div>
						)}
					</div>
				</div>

				{/* Instructions - Controlled by Sequence */}
				{config.steps.map((step, i) => (
					<Sequence key={step.id} from={i * 120} durationInFrames={120} layout="none">
						<InstructionBox step={step} index={i} total={config.steps.length} color={primaryColor} />
					</Sequence>
				))}
			</div>
		</AbsoluteFill>
	);
};

const PlayerBadge: React.FC<{ symbol: string; label: string; isActive: boolean; color: string; isDark: boolean; secondary?: boolean }> = ({ symbol, label, isActive, color, isDark, secondary }) => (
	<div style={{ 
		display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', borderRadius: '24px', width: '140px',
		backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)') : 'transparent',
		border: isActive ? `3px solid ${color}` : '3px solid transparent',
		transition: 'all 0.3s'
	}}>
		<div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900 }}>
			{symbol}
		</div>
		<span style={{ fontSize: '20px', fontWeight: 700, opacity: isActive ? 1 : 0.5 }}>{label}</span>
	</div>
);

const Cell: React.FC<{ value: string | null; isWinning: boolean; primaryColor: string; isDark: boolean }> = ({ value, isWinning, primaryColor, isDark }) => (
	<div style={{ 
		borderRadius: '20px', backgroundColor: isWinning ? `${primaryColor}20` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
		display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', fontWeight: 900,
		transition: 'all 0.3s'
	}}>
		{value && (
			<span style={{ color: value === 'X' ? primaryColor : '#ec4899', transform: 'scale(1)', animation: 'pop 0.3s ease-out' }}>
				{value}
			</span>
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
