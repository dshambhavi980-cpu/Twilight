import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { AnimatedDashboard, AnimatedInsights, AnimatedProfile, CustomAnimatedCalendar, AnimatedHeart, AnimatedGamesIcon, AnimatedWellnessIcon } from './ui/AnimatedIcons';

const Layout: React.FC = () => {
  const { primaryColor, solidNavBg } = useTheme();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  const hideNavRoutes = ['/login', '/signup', '/welcome', '/settings/cycle-length', '/settings/period-length', '/settings/profile', '/log/details'];
  const hideNavPrefixes = ['/games/', '/partner/games/', '/admin/games/'];
  const showNav = !hideNavRoutes.includes(location.pathname) && !hideNavPrefixes.some(p => location.pathname.startsWith(p));

  const navItems = [
    { to: "/dashboard", label: "Today", Icon: AnimatedDashboard },
    { to: "/calendar", label: "Calendar", Icon: CustomAnimatedCalendar },
    { to: "/insights", label: "Insights", Icon: AnimatedInsights },
    { to: "/wellness", label: "Wellness", Icon: AnimatedWellnessIcon },
    { to: "/notes", label: "Notes", Icon: AnimatedHeart },
    { to: "/games", label: "Games", Icon: AnimatedGamesIcon },
    { to: "/settings", label: "Profile", Icon: AnimatedProfile }
  ];

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-background-dark text-white overflow-hidden relative">
      {/* Navigation */}
      {showNav && (
        <nav className={`
          z-50 shrink-0 transition-all duration-300
          fixed bottom-0 left-0 right-0 min-h-[74px] border-t px-2 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-between items-center overflow-x-auto md:overflow-y-auto no-scrollbar
          md:relative md:bottom-auto md:left-auto md:right-auto md:h-full md:border-t-0 md:border-r md:flex-col md:justify-start md:px-4 md:py-8 md:gap-4
          ${isSidebarCollapsed ? 'md:w-24' : 'md:w-64'}
          ${solidNavBg ? 'bg-background-dark border-white/10' : 'bg-surface-dark/95 backdrop-blur-xl border-white/5'}
        `}>
          
          {/* Desktop Logo & Toggle Area (Only shows on md+ breakpoints) */}
          <div className={`hidden md:flex items-center w-full mb-8 shrink-0 text-primary overflow-hidden ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
              <div className="flex items-center gap-3">
                 {!isSidebarCollapsed && (
                     <>
                        <span className="material-symbols-outlined text-3xl shrink-0">eco</span>
                        <span className="font-display font-bold text-xl tracking-wide whitespace-nowrap">Twilight</span>
                     </>
                 )}
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Close Sidebar"}
              >
                <span className="material-symbols-outlined shrink-0 text-2xl">
                  {isSidebarCollapsed ? 'menu' : 'close'}
                </span>
              </button>
          </div>

          <LayoutGroup id="user-navbar">
            <div className="flex w-full md:flex-col flex-1 justify-between md:justify-start md:gap-2">
              {navItems.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className={({ isActive }) =>
                    `relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 transition-colors px-2 py-2 rounded-xl min-w-[42px] md:w-full flex-1 md:flex-none md:h-14 ${isActive ? 'text-primary' : 'text-gray-400 hover:text-white'
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
                    <div className="w-6 h-6 flex items-center justify-center relative z-10 shrink-0 md:ml-2">
                      <Icon isActive={isActive} />
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="text-sm font-bold relative z-10 whitespace-nowrap hidden md:block md:text-left">{label}</span>
                    )}
                    <span className="text-[10px] font-bold relative z-10 whitespace-nowrap block md:hidden">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
            </div>
          </LayoutGroup>
        </nav>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto w-full relative h-full flex justify-center ${showNav ? 'pb-[calc(74px+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
        <div className="w-full max-w-md md:max-w-3xl lg:max-w-7xl mx-auto shadow-2xl md:shadow-none min-h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
