import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { AnimatedDashboard, AnimatedInsights, AnimatedProfile, CustomAnimatedCalendar, AnimatedHeart } from './ui/AnimatedIcons';

const Layout: React.FC = () => {
  const location = useLocation();
  const hideNavRoutes = ['/login', '/signup', '/welcome', '/settings/cycle-length', '/settings/period-length', '/settings/profile', '/log/details'];
  const showNav = !hideNavRoutes.includes(location.pathname);

  const navItems = [
    { to: "/dashboard", label: "Today", Icon: AnimatedDashboard },
    { to: "/calendar", label: "Calendar", Icon: CustomAnimatedCalendar },
    { to: "/insights", label: "Insights", Icon: AnimatedInsights },
    { to: "/notes", label: "Love Notes", Icon: AnimatedHeart },
    { to: "/settings", label: "Profile", Icon: AnimatedProfile }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-dark text-white max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface-dark/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 max-w-md mx-auto overflow-visible">
          <LayoutGroup id="user-navbar">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1.5 transition-colors px-4 py-2 rounded-xl overflow-visible ${
                    isActive ? 'text-primary' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="user-navbar-active"
                        className="absolute inset-0 bg-[#984369]/20 rounded-xl"
                        style={{ zIndex: 0 }}
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
      )}
    </div>
  );
};

export default Layout;