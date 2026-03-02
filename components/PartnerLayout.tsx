import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import {
    AnimatedLoveNotesIcon,
    AnimatedLogsIcon,
    AnimatedProfileIcon,
    AnimatedGamesIcon,
    CustomAnimatedCalendar,
    AnimatedInsights,
    AnimatedWellnessIcon,
    AnimatedHomeIcon
} from './ui/AnimatedIcons';

const PartnerLayout: React.FC = () => {
    const { theme, primaryColor, solidNavBg } = useTheme();
    const isDark = theme === 'dark';
    const location = useLocation();
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return localStorage.getItem('partnerSidebarCollapsed') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('partnerSidebarCollapsed', String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    const navItems = [
        { to: "/partner/dashboard", label: "Home", Icon: AnimatedHomeIcon },
        { to: "/partner/calendar", label: "Calendar", Icon: CustomAnimatedCalendar },
        { to: "/partner/insights", label: "Insights", Icon: AnimatedInsights },
        { to: "/partner/wellness", label: "Wellness", Icon: AnimatedWellnessIcon },
        { to: "/partner/notes", label: "Notes", Icon: AnimatedLoveNotesIcon },
        { to: "/partner/games", label: "Games", Icon: AnimatedGamesIcon },
        { to: "/partner/profile", label: "Profile", Icon: AnimatedProfileIcon }
    ];

    return (
        <div className={`flex h-screen w-full flex-col md:flex-row shadow-2xl overflow-hidden relative transition-colors duration-300 ${isDark ? 'bg-[#121014] text-white' : 'bg-[#FDFCF8] text-[#121014]'
            }`}>
            {/* Bottom Navbar / Left Sidebar */}
            <nav className={`
                z-50 shrink-0 transition-all duration-300
                fixed bottom-0 left-0 right-0 min-h-[74px] px-2 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-between items-center border-t overflow-x-auto md:overflow-y-auto no-scrollbar 
                md:relative md:bottom-auto md:left-auto md:right-auto md:h-full md:border-t-0 md:border-r md:flex-col md:justify-start md:px-4 md:py-8 md:gap-4
                ${isSidebarCollapsed ? 'md:w-24' : 'md:w-64'}
                ${solidNavBg 
                    ? (isDark ? 'bg-[#121014] border-white/10' : 'bg-[#FDFCF8] border-gray-200')
                    : (isDark ? 'bg-surface-dark/95 backdrop-blur-md border-white/5' : 'bg-white/95 backdrop-blur-md border-gray-100')
                }
            `}>
                {/* Desktop Logo & Toggle Area (Only shows on md+ breakpoints) */}
                <div className={`hidden md:flex items-center w-full mb-8 shrink-0 overflow-hidden ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
                    <div className="flex items-center gap-3">
                       {!isSidebarCollapsed && (
                           <>
                              <span className="material-symbols-outlined text-3xl shrink-0 text-pink-500">favorite</span>
                              <span className={`font-display font-bold text-xl tracking-wide whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>Partners</span>
                           </>
                       )}
                    </div>
                    <button
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-pink-400 hover:bg-white/5 transition-colors"
                      title={isSidebarCollapsed ? "Expand Sidebar" : "Close Sidebar"}
                    >
                      <span className="material-symbols-outlined shrink-0 text-2xl">
                        {isSidebarCollapsed ? 'menu' : 'close'}
                      </span>
                    </button>
                </div>

                <LayoutGroup id="partner-navbar">
                    <div className="flex w-full md:flex-col flex-1 justify-between md:justify-start md:gap-2">
                    {navItems.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end
                            className={({ isActive }) =>
                                `relative flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 transition-colors px-2 py-2 rounded-xl min-w-[42px] md:w-full flex-1 md:flex-none md:h-14 ${isActive
                                    ? 'text-primary'
                                    : isDark
                                        ? 'text-gray-500 hover:text-white'
                                        : 'text-gray-400 hover:text-gray-700'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="partner-navbar-active"
                                            className="absolute inset-0 rounded-xl"
                                            style={{
                                                zIndex: 0,
                                                backgroundColor: primaryColor ? `${primaryColor}${isDark ? '22' : '15'}` : 'rgba(152, 67, 105, 0.15)'
                                            }}
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <div className="w-6 h-6 flex items-center justify-center overflow-visible relative z-10 shrink-0 md:ml-2">
                                        <Icon isActive={isActive} />
                                    </div>
                                    {!isSidebarCollapsed && (
                                        <span className={`text-sm font-bold relative z-10 transition-opacity duration-200 hidden md:block whitespace-nowrap md:text-left ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                            {label}
                                        </span>
                                    )}
                                    <span className={`text-[10px] font-bold relative z-10 whitespace-nowrap block md:hidden transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                    </div>
                </LayoutGroup>
            </nav>

            <div className="flex-1 overflow-y-auto w-full relative h-full flex justify-center pb-[calc(74px+env(safe-area-inset-bottom))] md:pb-0 scroll-smooth">
                <div className="w-full max-w-md md:max-w-3xl lg:max-w-7xl mx-auto min-h-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default PartnerLayout;
