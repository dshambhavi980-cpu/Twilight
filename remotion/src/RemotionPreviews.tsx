import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PreviewType } from '../../components/tutorials/tutorialData';

interface Props {
    type: PreviewType;
    stepIndex: number;
    primaryColor: string;
    isDark: boolean;
}

export const RemotionPreviews: React.FC<Props> = ({ type, stepIndex, primaryColor, isDark }) => {
    switch (type) {
        case 'tictactoe': return <GridPreview step={stepIndex} primaryColor={primaryColor} isDark={isDark} />;
        case 'connectfour': return <ConnectFourPreview step={stepIndex} primaryColor={primaryColor} isDark={isDark} />;
        case 'cards':
        case 'trivia': return <CardPreview step={stepIndex} primaryColor={primaryColor} isDark={isDark} />;
        case 'chat': return <ChatPreview step={stepIndex} primaryColor={primaryColor} isDark={isDark} />;
        case 'truthdare': return <TruthDarePreview step={stepIndex} primaryColor={primaryColor} isDark={isDark} />;
        case 'drawing': return <DrawingPreview step={stepIndex} primaryColor={primaryColor} isDark={isDark} />;
        default: return <div style={{ color: 'gray' }}>Preview coming soon</div>;
    }
};

/* ───── 1. Tic Tac Toe / Grid Preview ───── */
const GridPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Scale up over 20 frames starting from frame 15
    const progress = spring({
        fps,
        frame: Math.max(0, frame - 15),
        config: { damping: 14 }
    });

    const states = [
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, 'X', null, null, null, null],
        ['O', null, null, null, 'X', null, null, null, null],
        ['O', null, 'X', null, 'X', null, 'X', null, 'O'],
    ];
    const board = states[Math.min(step, states.length - 1)];
    const showStrike = step >= 3;

    return (
        <div style={{
            position: 'relative', width: 320, height: 320, 
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16,
            borderRadius: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
        }}>
            {board.map((cell, i) => (
                <div key={i} style={{
                    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 64, fontWeight: 900, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white'
                }}>
                    {cell && (
                        <div style={{ 
                            transform: `scale(${progress})`,
                            color: cell === 'X' ? primaryColor : (isDark ? '#F472B6' : '#EC4899')
                        }}>
                            {cell}
                        </div>
                    )}
                </div>
            ))}
            
            {showStrike && (
                <div style={{
                    position: 'absolute', height: 16, top: '50%', left: 0,
                    transform: 'translateY(-50%) rotate(45deg)', transformOrigin: 'center',
                    backgroundColor: primaryColor, borderRadius: 8,
                    width: `${interpolate(progress, [0, 1], [0, 100])}%`
                }} />
            )}
        </div>
    );
};

/* ───── 2. Connect Four Preview ───── */
const ConnectFourPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    const progress = spring({ fps, frame: Math.max(0, frame - 15), config: { damping: 14 } });
    const yOffset = interpolate(progress, [0, 1], [-200, 0]);
    const opacity = interpolate(progress, [0, 1], [0, 1]);

    const grid = Array.from({ length: 6 }).map(() => Array(7).fill(null));
    if (step >= 1) grid[5][3] = 'p1';
    if (step >= 2) { grid[5][3] = 'p1'; grid[5][2] = 'p2'; }
    if (step >= 3) {
        grid[5][3] = 'p1'; grid[4][3] = 'p1'; grid[3][3] = 'p1'; grid[2][3] = 'p1';
    }

    return (
        <div style={{
            width: 400, padding: 16, borderRadius: 24, 
            display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: 8,
            backgroundColor: isDark ? 'rgba(30,58,138,0.4)' : '#DBEAFE'
        }}>
            {grid.map((row, rIdx) => (
                <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                    {row.map((cell, cIdx) => (
                        <div key={cIdx} style={{
                            width: '100%', aspectRatio: '1', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: isDark ? '#121014' : 'white'
                        }}>
                            {cell && (
                                <div style={{
                                    width: '80%', height: '80%', borderRadius: '50%',
                                    backgroundColor: cell === 'p1' ? primaryColor : '#EC4899',
                                    transform: `translateY(${yOffset}px)`, opacity
                                }} />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

/* ───── 3. Card/Trivia Preview ───── */
const CardPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Rotate 180 over 20 frames for step 2+
    const rotation = step >= 2 ? spring({ fps, frame: Math.max(0, frame - 15), config: { damping: 16 } }) * 180 : 0;

    return (
        <div style={{ position: 'relative', width: 240, height: 320, perspective: 1000 }}>
            <div style={{
                width: '100%', height: '100%', borderRadius: 32,
                transformStyle: 'preserve-3d', transform: `rotateY(${rotation}deg)`
            }}>
                {/* Front */}
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', padding: 24,
                    backfaceVisibility: 'hidden', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                    borderRadius: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}>
                    <span style={{ fontSize: 64, marginBottom: 16 }}>❓</span>
                    <div style={{ width: 100, height: 12, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB' }} />
                    <div style={{ width: 60, height: 12, borderRadius: 6, marginTop: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB' }} />
                </div>
                {/* Back */}
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', padding: 24,
                    backfaceVisibility: 'hidden', backgroundColor: primaryColor, color: 'white',
                    borderRadius: 32, transform: 'rotateY(180deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}>
                    <span style={{ fontSize: 48, fontWeight: 900, backgroundColor: 'rgba(255,255,255,0.2)', width: 80, height: 80, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>!</span>
                    <div style={{ width: 120, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                </div>
            </div>
        </div>
    );
};

/* ───── 4. Chat Preview ───── */
const ChatPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const messages = [
        { id: 1, text: 'Once upon a time...', sender: 'p1' },
        { id: 2, text: 'A giant cat appeared!', sender: 'p2' },
        { id: 3, text: 'It demanded treats...', sender: 'p1' },
    ];
    const visibleMsgs = messages.slice(0, step + 1);

    return (
        <div style={{
            width: 400, height: 320, borderRadius: 32, padding: 24,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB'
        }}>
            {visibleMsgs.map((msg, i) => {
                const isLast = i === visibleMsgs.length - 1;
                const progress = isLast ? spring({ fps, frame: Math.max(0, frame - 10), config: { damping: 14 } }) : 1;
                const yOffset = interpolate(progress, [0, 1], [40, 0]);
                const opacity = progress;

                return (
                    <div key={msg.id} style={{
                        fontSize: 24, padding: '16px 24px', borderRadius: 24, maxWidth: '80%', marginBottom: 12,
                        transform: `translateY(${yOffset}px) scale(${interpolate(progress, [0, 1], [0.9, 1])})`, opacity,
                        ...(msg.sender === 'p1' 
                            ? { alignSelf: 'flex-end', color: 'white', backgroundColor: primaryColor, borderBottomRightRadius: 4 } 
                            : { alignSelf: 'flex-start', color: isDark ? 'white' : '#374151', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white', borderBottomLeftRadius: 4, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
                        )
                    }}>
                        {msg.text}
                    </div>
                );
            })}
        </div>
    );
};

/* ───── 5. Truth or Dare Preview ───── */
const TruthDarePreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Scale pump for selected item
    const scaleT = step === 1 ? spring({ fps, frame, config: { damping: 12 } }) : 1;
    const scaleD = step === 2 ? spring({ fps, frame, config: { damping: 12 } }) : 1;
    
    const opT = step === 2 ? 0.3 : 1;
    const opD = step === 1 ? 0.3 : 1;

    return (
        <div style={{ width: 400, display: 'flex', gap: 24 }}>
            <div style={{
                flex: 1, aspectRatio: '1', borderRadius: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 900, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white', color: isDark ? 'white' : '#1F2937', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transform: `scale(${interpolate(scaleT, [0, 1], [1, 1.1])})`, opacity: opT
            }}>
                <span style={{ fontSize: 64, marginBottom: 8 }}>😇</span>
                Truth
            </div>
            <div style={{
                flex: 1, aspectRatio: '1', borderRadius: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 900, backgroundColor: primaryColor, color: 'white',
                transform: `scale(${interpolate(scaleD, [0, 1], [1, 1.1])})`, opacity: opD
            }}>
                <span style={{ fontSize: 64, marginBottom: 8 }}>🔥</span>
                Dare
            </div>
        </div>
    );
};

/* ───── 6. Drawing Preview ───── */
const DrawingPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const progress = spring({ fps, frame: Math.max(0, frame - 15), config: { damping: 14 } });
    const dashOffset = interpolate(progress, [0, 1], [1000, 0]);

    return (
        <div style={{ width: 320, height: 320, position: 'relative' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', stroke: isDark ? 'white' : 'black', opacity: 0.2 }} fill="none" strokeWidth="4">
                <path d="M 20 90 L 80 90 M 40 90 L 40 10 L 70 10 L 70 20" />
            </svg>
            
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', stroke: primaryColor }} fill="none" strokeWidth="4">
                {step >= 1 && <circle strokeDasharray={1000} strokeDashoffset={step === 1 ? dashOffset : 0} cx="70" cy="30" r="10" />}
                {step >= 2 && <line strokeDasharray={1000} strokeDashoffset={step === 2 ? dashOffset : 0} x1="70" y1="40" x2="70" y2="60" />}
                {step >= 3 && (
                    <>
                        <line strokeDasharray={1000} strokeDashoffset={step === 3 ? dashOffset : 0} x1="70" y1="45" x2="55" y2="55" />
                        <line strokeDasharray={1000} strokeDashoffset={step === 3 ? dashOffset : 0} x1="70" y1="45" x2="85" y2="55" />
                    </>
                )}
            </svg>
        </div>
    );
};
