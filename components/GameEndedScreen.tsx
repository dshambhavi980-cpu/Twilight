import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameEndedScreen: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-lg font-semibold mb-6 text-gray-300">Game ended. Your partner may have left.</h2>
            <button
                onClick={() => navigate('/games')}
                className="px-8 py-3 rounded-2xl bg-[#b85b7a] text-white font-bold shadow-lg hover:brightness-105 active:scale-95 transition-transform"
            >
                Back to Games
            </button>
        </div>
    );
};

export default GameEndedScreen;
