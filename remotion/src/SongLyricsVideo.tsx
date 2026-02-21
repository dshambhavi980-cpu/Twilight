import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, spring, useCurrentFrame, interpolate } from 'remotion';
import { GameTutorialConfig } from '../../components/tutorials/tutorialData';

export const SongLyricsVideo: React.FC<{
	config: GameTutorialConfig;
	primaryColor: string;
	isDark: boolean;
}> = ({ config, primaryColor, isDark }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = isDark ? '#121014' : '#FDFCF8';
	const textColor = isDark ? '#ffffff' : '#121014';

	const stepIndex = Math.floor(frame / 120);
	const frameInStep = frame % 120;

	return (
		<AbsoluteFill style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}` }}>
				<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				</div>
				<h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Finish the Lyrics</h1>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
					</div>
				</div>
			</div>

            {/* Score & Progress */}
            {(stepIndex === 1 || stepIndex === 2) && (
                <div style={{ padding: '8px 32px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'medium' }}>3 / 10</span>
                        <span style={{ fontWeight: 'bold', color: '#ec4899' }}>Score: 2</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '30%', height: '100%', borderRadius: '3px', background: 'linear-gradient(to right, #ec4899, #d946ef)' }} />
                    </div>
                </div>
            )}

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', position: 'relative' }}>
				
                {/* Playing Phase Simulation */}
                {stepIndex === 1 && (
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        {/* Song Info */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '99px', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                🎵 Taylor Swift — Love Story
                            </span>
                        </div>

                        {/* Lyric Card */}
                        <div style={{ 
                            width: '100%', padding: '24px', borderRadius: '32px',
                            background: 'linear-gradient(135deg, #ec4899, #d946ef)', color: 'white',
                            boxShadow: '0 16px 40px rgba(236, 72, 153, 0.3)', marginBottom: '32px',
                            position: 'relative', overflow: 'hidden'
                        }}>
                             <div style={{ position: 'absolute', top: '-32px', right: '-32px', width: '128px', height: '128px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                             <p style={{ fontSize: '18px', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                                "Romeo, take me somewhere we can be alone. I'll be waiting; all that's left to do is..."
                             </p>
                             <p style={{ fontSize: '32px', marginTop: '8px', margin: 0 }}>...</p>
                        </div>

                        {/* Choices */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['Cry', 'Run', 'Dance', 'Sing'].map((choice, i) => (
                                <div key={i} style={{ 
                                    padding: '16px', borderRadius: '20px', fontSize: '16px', fontWeight: 'medium',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    display: 'flex', alignItems: 'center'
                                }}>
                                    <span style={{ opacity: 0.4, marginRight: '8px' }}>{String.fromCharCode(65 + i)}.</span>
                                    {choice}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Result Phase Simulation */}
                {stepIndex === 2 && (
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Correct!</h2>
                        </div>

                        <div style={{ 
                            padding: '24px', borderRadius: '24px',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}>
                            <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>🎵 Taylor Swift — Love Story</p>
                            <p style={{ fontSize: '14px', fontStyle: 'italic', opacity: 0.7, marginBottom: '8px' }}>"Romeo, take me somewhere we can be alone. I'll be waiting; all that's left to do is..."</p>
                            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ade80' }}>✅ Run</p>
                        </div>

                        <div style={{ 
                            marginTop: '24px', padding: '16px', borderRadius: '20px', textAlign: 'center',
                            background: 'linear-gradient(to right, #ec4899, #d946ef)', color: 'white', fontWeight: 'bold',
                            boxShadow: '0 8px 24px rgba(236, 72, 153, 0.2)'
                        }}>
                             Next Song →
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
			backgroundColor: '#db2777', borderRadius: '40px', padding: '32px 40px', color: 'white',
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
