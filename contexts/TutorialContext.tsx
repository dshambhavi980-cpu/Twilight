import React, { createContext, useContext, useState, useCallback } from 'react';

interface TutorialContextType {
    isOpen: boolean;
    activeGameId: string | null;
    openTutorial: (gameId: string) => void;
    closeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeGameId, setActiveGameId] = useState<string | null>(null);

    const openTutorial = useCallback((gameId: string) => {
        setActiveGameId(gameId);
        setIsOpen(true);
    }, []);

    const closeTutorial = useCallback(() => {
        setIsOpen(false);
        // We don't clear activeGameId immediately to avoid flash of empty modal during animation
    }, []);

    return (
        <TutorialContext.Provider value={{ isOpen, activeGameId, openTutorial, closeTutorial }}>
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
