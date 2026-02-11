import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { 
    AnimatedUsersIcon, 
    AnimatedLoveNotesIcon, 
    AnimatedLogsIcon, 
    AnimatedProfileIcon,
    AnimatedGamesIcon
} from './ui/AnimatedIcons';

const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.25
};

const AdminLayout: React.FC = () => {
    const { theme, primaryColor } = useTheme();
    const isDark = theme === 'dark';
    const location = useLocation();

    const navItems = [
        { to: "/admin/users", label: "Users", Icon: AnimatedUsersIcon },
        { to: "/admin/notes", label: "Love Notes", Icon: AnimatedLoveNotesIcon },
        { to: "/admin/games", label: "Games", Icon: AnimatedGamesIcon },
        { to: "/admin/logs", label: "Logs", Icon: AnimatedLogsIcon }, 
        { to: "/admin/profile", label: "Profile", Icon: AnimatedProfileIcon }
    ];

    return (
        <div className={`flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative transition-colors duration-300 ${
            isDark ? 'bg-background-dark' : 'bg-[#FDFCF8]'
        }`}>
            <div className="flex-1 overflow-y-auto pb-24">
                <Outlet />
            </div>

            {/* Bottom Navbar */}
            <nav className={`fixed bottom-0 left-0 right-0 px-6 py-4 flex justify-between items-center z-50 max-w-md mx-auto border-t overflow-visible ${
                isDark 
                    ? 'bg-[#121014] border-white/5' 
                    : 'bg-white border-gray-100'
            }`}>
                <LayoutGroup id="admin-navbar">
                    {navItems.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end
                            className={({ isActive }) =>
                                `relative flex flex-col items-center gap-1.5 transition-colors px-4 py-2 rounded-xl overflow-visible ${
                                    isActive 
                                        ? 'text-primary' 
                                        : isDark 
                                            ? 'text-gray-400 hover:text-white' 
                                            : 'text-gray-400 hover:text-gray-700'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="admin-navbar-active"
                                            className="absolute inset-0 rounded-xl"
                                            style={{ 
                                                zIndex: 0,
                                                backgroundColor: primaryColor ? `${primaryColor}${isDark ? '33' : '1A'}` : 'rgba(152, 67, 105, 0.2)' 
                                            }}
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <div className="w-7 h-7 flex items-center justify-center overflow-visible relative z-10">
                                        <Icon isActive={isActive} />
                                    </div>
                                    <span className="text-[10px] font-bold relative z-10">{label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </LayoutGroup>
            </nav>
        </div>
    );
};

export default AdminLayout;
