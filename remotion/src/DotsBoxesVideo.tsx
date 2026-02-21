import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const SCORE_SCALE = 1.85;

// Constants mapping to the real Dots & Boxes implementation
const GRID = 4; // 4x4 dots = 3x3 boxes
const DOT_SIZE_BASE = 12;
const CELL_SIZE_BASE = 60;
const PADDING_BASE = 20;

// Scaled constants
const DOT_SIZE = DOT_SIZE_BASE * SCORE_SCALE;
const CELL_SIZE = CELL_SIZE_BASE * SCORE_SCALE;
const PADDING = PADDING_BASE * SCORE_SCALE;
const SVG_SIZE = PADDING * 2 + (GRID - 1) * CELL_SIZE + DOT_SIZE;

const dotX = (c: number) => PADDING + DOT_SIZE / 2 + c * CELL_SIZE;
const dotY = (r: number) => PADDING + DOT_SIZE / 2 + r * CELL_SIZE;

const PRIMARY_COLOR = '#00F0FF';
const PARTNER_COLOR = '#06B6D4';
const IS_DARK = true;

const BACKGROUND = IS_DARK ? '#121014' : '#FDFCF8';

interface DotsBoxesVideoProps {
    primaryColor?: string;
    isDark?: boolean;
}

const tutorialData = {
    'dots-boxes': {
        steps: [
            { id: 0, title: 'Your Goal', description: 'Claim the most boxes by completing the fourth side of a square.' },
            { id: 1, title: 'Draw Lines', description: 'Take turns drawing a single horizontal or vertical line between two unjoined adjacent dots.' },
            { id: 2, title: 'Claim a Box', description: 'If your line completes a 1x1 box, it becomes yours and you get another turn!' },
            { id: 3, title: 'Win', description: 'The game ends when all boxes are claimed. The player with the most boxes wins.' },
        ]
    }
};

export const DotsBoxesVideo: React.FC<DotsBoxesVideoProps> = ({
    primaryColor = PRIMARY_COLOR,
    isDark = IS_DARK,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const currentStep = Math.min(Math.floor(frame / 120), 3);
    const frameInStep = frame % 120;

    // Helper interpolations for animations
    const smoothProgress = spring({ fps, frame: frameInStep - 30, config: { damping: 14 } });
    
    // Derived state based on the current step
    let boardState = { lines: {} as Record<string, string>, boxes: {} as Record<string, string> };
    let myScore = 0;
    let partnerScore = 0;
    let statusText = '';
    let isFinished = false;

    // Line drawing animations
    let animatedLineKey: string | null = null;
    let animatedLineProgress = 0;

    if (currentStep === 0) {
        statusText = 'Your turn — draw a line!';
        animatedLineKey = 'h_0_0';
        animatedLineProgress = spring({ fps, frame: frameInStep - 40, config: { damping: 16 } });
        
        if (animatedLineProgress > 0) {
            boardState.lines['h_0_0'] = 'me';
        }
    } else if (currentStep === 1) {
        statusText = frameInStep < 60 ? 'Partner\'s turn' : 'Your turn — draw a line!';
        boardState.lines['h_0_0'] = 'me';
        
        // Partner draws vertical
        let partnerLineProg = spring({ fps, frame: frameInStep - 15, config: { damping: 16 } });
        if (partnerLineProg > 0) {
            boardState.lines['v_0_0'] = 'partner';
        }

        // You draw horizontal
        let myLineProg = spring({ fps, frame: frameInStep - 75, config: { damping: 16 } });
        if (myLineProg > 0) {
            boardState.lines['h_1_0'] = 'me';
        }

        if (partnerLineProg > 0 && partnerLineProg < 1) {
            animatedLineKey = 'v_0_0';
            animatedLineProgress = partnerLineProg;
        } else if (myLineProg > 0 && myLineProg < 1) {
            animatedLineKey = 'h_1_0';
            animatedLineProgress = myLineProg;
        }
    } else if (currentStep === 2) {
        statusText = 'Partner\'s turn';
        boardState.lines['h_0_0'] = 'me';
        boardState.lines['v_0_0'] = 'partner';
        boardState.lines['h_1_0'] = 'me';
        
        // Partner draws completing line
        let partnerLineProg = spring({ fps, frame: frameInStep - 20, config: { damping: 16 } });
        if (partnerLineProg > 0) {
            boardState.lines['v_0_1'] = 'partner';
        }

        // Box completion pop
        let boxPop = spring({ fps, frame: frameInStep - 40, config: { damping: 12 } });
        if (boxPop > 0) {
            boardState.boxes['0_0'] = 'partner';
            partnerScore = 1;
        }

        if (partnerLineProg > 0 && partnerLineProg < 1) {
            animatedLineKey = 'v_0_1';
            animatedLineProgress = partnerLineProg;
        }

    } else if (currentStep === 3) {
        // Almost finished board
        boardState.lines = {
            'h_0_0': 'me', 'h_0_1': 'me', 'h_0_2': 'partner',
            'h_1_0': 'me', 'h_1_1': 'me', 'h_1_2': 'partner',
            'h_2_0': 'partner', 'h_2_1': 'partner', 'h_2_2': 'partner',
            'h_3_0': 'partner', 'h_3_1': 'partner', 
            
            'v_0_0': 'partner', 'v_0_1': 'partner', 'v_0_2': 'partner', 'v_0_3': 'partner',
            'v_1_0': 'partner', 'v_1_1': 'me', 'v_1_2': 'partner', 'v_1_3': 'me',
            'v_2_0': 'me', 'v_2_1': 'me', 'v_2_2': 'partner', 'v_2_3': 'me',
        };
        boardState.boxes = {
            '0_0': 'partner', '0_1': 'me', '0_2': 'partner',
            '1_0': 'me', '1_1': 'me', '1_2': 'partner',
            '2_0': 'partner', '2_1': 'me', '2_2': 'me',
        };
        myScore = 5;
        partnerScore = 4;
        
        statusText = frameInStep > 40 ? 'You won! 🎉' : 'Your turn — draw a line!';
        isFinished = frameInStep > 40;

        // Draw the last line to win
        let myLineProg = spring({ fps, frame: frameInStep - 20, config: { damping: 16 } });
        if (myLineProg > 0) {
            boardState.lines['h_3_2'] = 'me';
        }

        let boxPop = spring({ fps, frame: frameInStep - 30, config: { damping: 12 } });
        if (boxPop > 0) {
            // Need to change one of the boxes to me so i win by 5 to 4
        }
        
         if (myLineProg > 0 && myLineProg < 1) {
            animatedLineKey = 'h_3_2';
            animatedLineProgress = myLineProg;
        }
    }

    const { title, description } = tutorialData['dots-boxes'].steps[currentStep];

    let isMyTurn = true;
    if (currentStep === 1 && frameInStep < 60) isMyTurn = false;
    if (currentStep === 2) isMyTurn = false;
    
    const myScoreDisplay = myScore;
    const partnerScoreDisplay = partnerScore;
    const myInitial = 'Y';
    const partnerInitial = 'P';

    return (
        <AbsoluteFill style={{ backgroundColor: BACKGROUND, fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
                
                {/* Persistent Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, color: isDark ? 'white' : 'black' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Dots & Boxes</h1>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </div>
                </div>

                <main style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    paddingTop: '40px', paddingBottom: '20px', paddingLeft: '40px', paddingRight: '40px', position: 'relative'
                }}>
                    {/* Scores Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${24 * SCORE_SCALE}px`, width: '100%', maxWidth: `${320 * SCORE_SCALE}px`, marginBottom: '32px' }}>
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${4 * SCORE_SCALE}px`, flex: 1,
                            padding: `${12 * SCORE_SCALE}px`, borderRadius: `${24 * SCORE_SCALE}px`,
                            backgroundColor: isMyTurn && !isFinished ? (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6') : 'transparent',
                            boxShadow: isMyTurn && !isFinished ? `0 0 0 ${2 * SCORE_SCALE}px ${primaryColor}` : 'none'
                        }}>
                            <div style={{
                                width: `${40 * SCORE_SCALE}px`, height: `${40 * SCORE_SCALE}px`, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: `${20 * SCORE_SCALE}px`, fontWeight: 900,
                                backgroundColor: `${primaryColor}20`, color: primaryColor
                            }}>{myScoreDisplay}</div>
                            <span style={{ fontSize: `${12 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : '#121014' }}>{myInitial} · You</span>
                        </div>

                        <div style={{
                            fontSize: `${14 * SCORE_SCALE}px`, fontWeight: 'bold', padding: `${4 * SCORE_SCALE}px ${12 * SCORE_SCALE}px`,
                            borderRadius: `${16 * SCORE_SCALE}px`,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                            color: isDark ? '#9CA3AF' : '#6B7280'
                        }}>VS</div>

                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${4 * SCORE_SCALE}px`, flex: 1,
                            padding: `${12 * SCORE_SCALE}px`, borderRadius: `${24 * SCORE_SCALE}px`,
                            backgroundColor: !isMyTurn && !isFinished ? (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6') : 'transparent',
                            boxShadow: !isMyTurn && !isFinished ? `0 0 0 ${2 * SCORE_SCALE}px ${PARTNER_COLOR}` : 'none'
                        }}>
                            <div style={{
                                width: `${40 * SCORE_SCALE}px`, height: `${40 * SCORE_SCALE}px`, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: `${20 * SCORE_SCALE}px`, fontWeight: 900,
                                backgroundColor: `${PARTNER_COLOR}20`, color: PARTNER_COLOR
                            }}>{partnerScoreDisplay}</div>
                            <span style={{ fontSize: `${12 * SCORE_SCALE}px`, fontWeight: 'bold', color: isDark ? 'white' : '#121014' }}>{partnerInitial} · Partner</span>
                        </div>
                    </div>

                    {/* Status Text */}
                    <p style={{
                        textAlign: 'center', fontWeight: 'bold', fontSize: `${18 * SCORE_SCALE}px`,
                        color: isFinished ? (currentStep === 3 ? '#22C55E' : '#F87171') : (isMyTurn ? primaryColor : PARTNER_COLOR),
                        margin: '0 0 24px 0'
                    }}>
                        {statusText}
                    </p>

                    {/* Board */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 'auto' }}>
                        <div style={{
                            borderRadius: `${24 * SCORE_SCALE}px`, padding: `${8 * SCORE_SCALE}px`,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                            boxShadow: isDark ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            border: isDark ? 'none' : '1px solid #F3F4F6',
                            transform: 'scale(0.85)',
                            transformOrigin: 'top center'
                        }}>
                        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
                            {/* Boxes */}
                            {Object.entries(boardState.boxes).map(([key, owner]) => {
                                const [r, c] = key.split('_').map(Number);
                                const color = owner === 'me' ? primaryColor : PARTNER_COLOR;
                                const initial = owner === 'me' ? myInitial : partnerInitial;
                                const cx = dotX(c) + CELL_SIZE / 2;
                                const cy = dotY(r) + CELL_SIZE / 2;
                                
                                let scale = 1;
                                if (currentStep === 2 && key === '0_0') {
                                    const boxPop = spring({ fps, frame: frameInStep - 40, config: { damping: 12 } });
                                    scale = boxPop;
                                }

                                if (scale > 0) {
                                    return (
                                        <g key={`box_${key}`} style={{ transformOrigin: `${cx}px ${cy}px`, transform: `scale(${scale})` }}>
                                            <rect x={dotX(c)} y={dotY(r)} width={CELL_SIZE} height={CELL_SIZE} rx={8 * SCORE_SCALE} fill={color} opacity={0.25} />
                                            <rect x={dotX(c) + 1} y={dotY(r) + 1} width={CELL_SIZE - 2} height={CELL_SIZE - 2} rx={7 * SCORE_SCALE} fill="none" stroke={color} strokeWidth={1.5 * SCORE_SCALE} opacity={0.5} />
                                            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={20 * SCORE_SCALE} fontWeight="900" fill={color} opacity={0.75}>{initial}</text>
                                        </g>
                                    );
                                }
                                return null;
                            })}

                            {/* Horizontal lines */}
                            {Array.from({ length: GRID }, (_, r) =>
                                Array.from({ length: GRID - 1 }, (_, c) => {
                                    const key = `h_${r}_${c}`;
                                    const owner = boardState.lines[key];
                                    
                                    let x1 = dotX(c) + DOT_SIZE / 2 + (2 * SCORE_SCALE);
                                    let x2 = dotX(c + 1) - DOT_SIZE / 2 - (2 * SCORE_SCALE);
                                    let actualX2 = x2;
                                    
                                    if (key === animatedLineKey && owner) {
                                        actualX2 = interpolate(animatedLineProgress, [0, 1], [x1, x2]);
                                    }

                                    return (
                                        owner ? (
                                            <line key={key}
                                                x1={x1} y1={dotY(r)} x2={actualX2} y2={dotY(r)}
                                                stroke={owner === 'me' ? primaryColor : PARTNER_COLOR}
                                                strokeWidth={5 * SCORE_SCALE} strokeLinecap="round"
                                            />
                                        ) : (
                                            <line key={`empty_${key}`}
                                                x1={x1} y1={dotY(r)} x2={x2} y2={dotY(r)}
                                                stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                                                strokeWidth={4 * SCORE_SCALE} strokeLinecap="round"
                                            />
                                        )
                                    );
                                })
                            )}

                            {/* Vertical lines */}
                            {Array.from({ length: GRID - 1 }, (_, r) =>
                                Array.from({ length: GRID }, (_, c) => {
                                    const key = `v_${r}_${c}`;
                                    const owner = boardState.lines[key];
                                    
                                    let y1 = dotY(r) + DOT_SIZE / 2 + (2 * SCORE_SCALE);
                                    let y2 = dotY(r + 1) - DOT_SIZE / 2 - (2 * SCORE_SCALE);
                                    let actualY2 = y2;
                                    
                                    if (key === animatedLineKey && owner) {
                                        actualY2 = interpolate(animatedLineProgress, [0, 1], [y1, y2]);
                                    }

                                    return (
                                        owner ? (
                                            <line key={key}
                                                x1={dotX(c)} y1={y1} x2={dotX(c)} y2={actualY2}
                                                stroke={owner === 'me' ? primaryColor : PARTNER_COLOR}
                                                strokeWidth={5 * SCORE_SCALE} strokeLinecap="round"
                                            />
                                        ) : (
                                            <line key={`empty_${key}`}
                                                x1={dotX(c)} y1={y1} x2={dotX(c)} y2={y2}
                                                stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                                                strokeWidth={4 * SCORE_SCALE} strokeLinecap="round"
                                            />
                                        )
                                    );
                                })
                            )}

                            {/* Dots */}
                            {Array.from({ length: GRID }, (_, r) =>
                                Array.from({ length: GRID }, (_, c) => (
                                    <circle key={`dot_${r}_${c}`} cx={dotX(c)} cy={dotY(r)} r={DOT_SIZE / 2} fill={isDark ? '#888' : '#555'} />
                                ))
                            )}
                        </svg>
                        </div>
                    </div>
                </main>

                {/* Tutorial Instruction Box (Fixed at Bottom with exact dimensions of TicTacToe) */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 64px)',
                    zIndex: 20
                }}>
                    <div style={{
                        backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '32px',
                        padding: '32px 40px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{
                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                color: isDark ? 'white' : 'black',
                                padding: '8px 16px',
                                borderRadius: '99px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}>
                                Step {currentStep + 1} of 4
                            </div>
                        </div>
                        
                        <h2 style={{
                            margin: 0,
                            fontSize: '36px',
                            fontWeight: 'bold',
                            color: isDark ? 'white' : 'black'
                        }}>
                            {title}
                        </h2>
                        
                        <p style={{
                            margin: 0,
                            fontSize: '24px',
                            color: isDark ? '#A1A1AA' : '#52525B',
                            lineHeight: 1.5,
                        }}>
                            {description}
                        </p>
                    </div>
                </div>

            </div>
        </AbsoluteFill>
    );
};
