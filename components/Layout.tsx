import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { AnimatedDashboard, AnimatedInsights, AnimatedProfile, CustomAnimatedCalendar, AnimatedHeart, AnimatedGamesIcon } from './ui/AnimatedIcons';

const Layout: React.FC = () => {
  const { primaryColor } = useTheme();
  const location = useLocation();
  const hideNavRoutes = ['/login', '/signup', '/welcome', '/settings/cycle-length', '/settings/period-length', '/settings/profile', '/log/details'];
  const hideNavPrefixes = ['/games/', '/partner/games/', '/admin/games/'];
  const showNav = !hideNavRoutes.includes(location.pathname) && !hideNavPrefixes.some(p => location.pathname.startsWith(p));

  const navItems = [
    { to: "/dashboard", label: "Today", Icon: AnimatedDashboard },
    { to: "/calendar", label: "Calendar", Icon: CustomAnimatedCalendar },
    { to: "/insights", label: "Insights", Icon: AnimatedInsights },
    { to: "/notes", label: "Notes", Icon: AnimatedHeart },
    { to: "/games", label: "Games", Icon: AnimatedGamesIcon },
    { to: "/settings", label: "Profile", Icon: AnimatedProfile }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-dark text-white max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 h-[74px] bg-surface-dark/95 backdrop-blur-xl border-t border-white/5 px-2 py-3 flex justify-between items-center z-50 max-w-md mx-auto overflow-x-auto no-scrollbar">
          <LayoutGroup id="user-navbar">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 transition-colors px-1 py-1 rounded-xl min-w-[50px] flex-1 ${
                    isActive ? 'text-primary' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="user-navbar-active"
                        className="absolute inset-0 rounded-xl"
                        style={{ zIndex: 0, backgroundColor: primaryColor ? `${primaryColor}33` : 'rgba(152, 67, 105, 0.2)' }}
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <div className="w-6 h-6 flex items-center justify-center relative z-10">
                      <Icon isActive={isActive} />
                    </div>
                    <span className="text-[10px] font-bold relative z-10 whitespace-nowrap">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </LayoutGroup>
        </nav>
      )}
    </div>
  );
};

export default Layout;