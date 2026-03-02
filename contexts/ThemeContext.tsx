import React, { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: string;
  updatePrimaryColor: (color: string) => void;
  resetTheme: () => void;
  animationsEnabled: boolean;
  updateAnimationsEnabled: (enabled: boolean) => void;
  solidNavBg: boolean;
  updateSolidNavBg: (solid: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback to prevent crashes
    console.warn('useTheme must be used within a ThemeProvider');
    return {
        theme: 'light' as Theme,
        toggleTheme: () => {},
        primaryColor: '#984369',
        updatePrimaryColor: (c: string) => {},
        resetTheme: () => {},
        animationsEnabled: true,
        updateAnimationsEnabled: (e: boolean) => {},
        solidNavBg: false,
        updateSolidNavBg: (s: boolean) => {}
    };
  }
  return context;
};

// Helper for color manipulation
const adjustColor = (color: string, amount: number) => {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).slice(-2));
}

const hexToRgb = (hex: string) => {
    // Expand 3-digit hex to 6-digit
    let h = hex.replace(/^#/, '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light') ? 'light' : 'dark';
  });

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
      return localStorage.getItem('theme-primary') || '#984369';
  });

  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
      // Default to true
      return localStorage.getItem('theme-animations') !== 'false';
  });

  const [solidNavBg, setSolidNavBg] = useState<boolean>(() => {
      return localStorage.getItem('theme-solid-nav') === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply or remove body class for animations
  useEffect(() => {
    if (!animationsEnabled) {
      document.body.classList.add('disable-animations');
    } else {
      document.body.classList.remove('disable-animations');
    }
  }, [animationsEnabled]);

  // Apply Primary Color Variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    
    // Generate shades
    // Note: Simple darkening/lightening logic
    // We can assume primaryColor is a hex
    try {
        const dark = adjustColor(primaryColor, -40);
        const light = adjustColor(primaryColor, 130); // Significantly lighter
        
        root.style.setProperty('--color-primary-dark', dark);
        root.style.setProperty('--color-primary-light', light); 
        
        // Also potential RGB vars if needed for opacity
        // Currently sticking with hex values for CSS custom properties.
        // If opacity support is needed, switch to RGB channel variables.

        localStorage.setItem('theme-primary', primaryColor);
    } catch (e) {
        console.error("Invalid color", e);
    }

  }, [primaryColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updatePrimaryColor = (color: string) => {
      setPrimaryColor(color);
  };

  const updateAnimationsEnabled = (enabled: boolean) => {
      setAnimationsEnabled(enabled);
      localStorage.setItem('theme-animations', String(enabled));
  };

  const updateSolidNavBg = (solid: boolean) => {
      setSolidNavBg(solid);
      localStorage.setItem('theme-solid-nav', String(solid));
  };

  const resetTheme = () => {
      setPrimaryColor('#984369');
      setTheme('dark');
      updateAnimationsEnabled(true);
      updateSolidNavBg(false);
  };

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme, primaryColor, updatePrimaryColor, resetTheme,
      animationsEnabled, updateAnimationsEnabled, solidNavBg, updateSolidNavBg
    }}>
      <MotionConfig reducedMotion={animationsEnabled ? "never" : "always"}>
        {children}
      </MotionConfig>
    </ThemeContext.Provider>
  );
};
