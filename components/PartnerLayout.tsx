import React from 'react';
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
    AnimatedWellnessIcon
} from './ui/AnimatedIcons';

// Fallback Icon if Home isn't in generic exports
const HomeIcon = ({ isActive }: { isActive: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const PartnerLayout: React.FC = () => {
    const { theme, primaryColor } = useTheme();
    const isDark = theme === 'dark';
    const location = useLocation();

    const navItems = [
        { to: "/partner/dashboard", label: "Home", Icon: HomeIcon },
        { to: "/partner/calendar", label: "Calendar", Icon: CustomAnimatedCalendar },
        { to: "/partner/insights", label: "Insights", Icon: AnimatedInsights },
        { to: "/partner/wellness", label: "Wellness", Icon: AnimatedWellnessIcon },
        { to: "/partner/notes", label: "Notes", Icon: AnimatedLoveNotesIcon },
        { to: "/partner/games", label: "Games", Icon: AnimatedGamesIcon },
        { to: "/partner/profile", label: "Profile", Icon: AnimatedProfileIcon }
    ];

    return (
        <div className={`flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative transition-colors duration-300 ${isDark ? 'bg-[#121014] text-white' : 'bg-[#FDFCF8] text-[#121014]'
            }`}>
            <div className="flex-1 overflow-y-auto pb-24 scroll-smooth">
                <Outlet />
            </div>

            {/* Bottom Navbar */}
            <nav className={`fixed bottom-0 left-0 right-0 h-[74px] px-2 py-3 flex justify-between items-center z-50 max-w-md mx-auto border-t overflow-x-auto no-scrollbar ${isDark
                ? 'bg-surface-dark/95 backdrop-blur-md border-white/5'
                : 'bg-white/95 backdrop-blur-md border-gray-100'
                }`}>
                <LayoutGroup id="partner-navbar">
                    {navItems.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end
                            className={({ isActive }) =>
                                `relative flex flex-col items-center gap-1 transition-colors px-1 py-1 rounded-xl overflow-visible min-w-[48px] flex-1 ${isActive
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
                                    <div className="w-6 h-6 flex items-center justify-center overflow-visible relative z-10 mb-0.5">
                                        <Icon isActive={isActive} />
                                    </div>
                                    <span className={`text-[10px] font-bold relative z-10 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </LayoutGroup>
            </nav>
        </div>
    );
};

export default PartnerLayout;
