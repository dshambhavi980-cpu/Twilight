import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: string;
  updatePrimaryColor: (color: string) => void;
  resetTheme: () => void;
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
        resetTheme: () => {}
    };
  }
  return context;
};

// Helper for color manipulation
const adjustColor = (color: string, amount: number) => {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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
        const rgb = hexToRgb(primaryColor);
        if(rgb) {
             // If you use tailwind with opacity like bg-primary/20
             // You need to set the variable that Reference CSS uses?
             // Actually index.html says: primary: "var(--color-primary)"
             // Tailwind text-opacity/bg-opacity works best when the var is just the RGB channels
             // But here it seems set as full hex. 
             // If we wanted opacity support we might need to change how index.html configures it.
             // For now we just stick to hex.
        }

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

  const resetTheme = () => {
      setPrimaryColor('#984369');
      setTheme('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, primaryColor, updatePrimaryColor, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
