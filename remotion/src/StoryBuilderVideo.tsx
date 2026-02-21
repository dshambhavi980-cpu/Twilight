import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const StoryBuilderVideo: React.FC<{
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

    const GENRES = [
        { key: 'romance', icon: '💕', label: 'Romance' },
        { key: 'mystery', icon: '🔍', label: 'Mystery' },
        { key: 'adventure', icon: '⚔️', label: 'Adventure' },
        { key: 'funny', icon: '😂', label: 'Funny' },
    ];

    const entries = useMemo(() => {
        const list = [
            { id: 0, playerId: '__system__', text: 'Once upon a time, in a neon-lit city...', delay: 0 },
            { id: 1, playerId: 'you', text: 'A mysterious cat found a glowing orb.', delay: 140 },
            { id: 2, playerId: 'partner', text: 'The orb whispered secrets of the stars.', delay: 260 },
            { id: 3, playerId: 'you', text: 'Suddenly, the cat began to float up!', delay: 380 },
        ];
        return list;
    }, []);

    const visibleEntries = entries.filter(e => frame > e.delay);

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Story Builder ✍️</h1>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
					</div>
				</div>
			</div>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', position: 'relative' }}>
				
                {/* Genre Pick Simulation */}
                {stepIndex === 0 && (
                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: primaryColor, textAlign: 'center' }}>Pick a genre!</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            {GENRES.map((g, i) => {
                                const isSelected = i === 1 && frameInStep > 40; // Selecting Mystery
                                return (
                                    <div key={g.key} style={{ 
                                        padding: '24px', borderRadius: '24px', textAlign: 'center',
                                        backgroundColor: isSelected ? primaryColor : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        color: isSelected ? 'white' : textColor,
                                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.2s'
                                    }}>
                                        <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{g.icon}</span>
                                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{g.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Writing Phase Simulation */}
                {stepIndex >= 1 && stepIndex <= 2 && (
                    <div style={{ width: '100%', maxWidth: '440px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '99px', backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                                🔍 Mystery
                            </span>
                            <span style={{ fontSize: '12px', color: '#666' }}>{visibleEntries.length - 1}/12 turns</span>
                        </div>

                        <div style={{ flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '24px', padding: '24px', overflow: 'hidden' }}>
                            {visibleEntries.map((e, i) => (
                                <div key={i} style={{ marginBottom: '16px', fontSize: '20px', lineHeight: 1.5, fontStyle: e.playerId === '__system__' ? 'italic' : 'normal', opacity: e.playerId === '__system__' ? 0.6 : 1 }}>
                                    {e.playerId !== '__system__' && (
                                        <span style={{ fontWeight: 'bold', marginRight: '8px', color: e.playerId === 'you' ? primaryColor : '#EC4899' }}>
                                            {e.playerId === 'you' ? 'You:' : 'Partner:'}
                                        </span>
                                    )}
                                    {e.text}
                                </div>
                            ))}
                        </div>

                        {/* Input Simulation */}
                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1, padding: '16px 24px', borderRadius: '16px', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#999', fontSize: '18px' }}>
                                {stepIndex === 1 ? 'Typing continuation...' : 'Partner is writing...'}
                            </div>
                            <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Final Story Summary */}
                {stepIndex === 3 && (
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                         <p style={{ fontSize: '32px', fontWeight: 900, color: primaryColor }}>Story Complete! 📖</p>
                         <p style={{ fontSize: '16px', color: '#666', marginBottom: '40px' }}>4 lines • Mystery</p>
                         
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '320px', margin: '0 auto' }}>
                            <div style={{ padding: '20px', borderRadius: '24px', backgroundColor: primaryColor, color: 'white', fontWeight: 'bold', fontSize: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                New Story 🔄
                            </div>
                            <div style={{ padding: '16px', borderRadius: '24px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', fontWeight: 'bold', color: '#666' }}>
                                Exit Game
                            </div>
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
