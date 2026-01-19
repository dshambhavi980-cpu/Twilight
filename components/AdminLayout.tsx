import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#121014] text-white max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#1E1C24]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 max-w-md mx-auto">
        {[
          { to: "/admin/users", label: "Users", icon: "group" },
          { to: "/admin/notes", label: "Love Notes", icon: "favorite" },
          { to: "/admin/logs", label: "Logs", icon: "list_alt" }, 
          { to: "/settings", label: "Profile", icon: "person" }
        ].map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1.5 transition-colors px-4 py-2 rounded-xl z-0 ${
                isActive ? 'text-purple-500' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="admin-navbar-active"
                    className="absolute inset-0 bg-purple-500/10 rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`material-symbols-outlined text-2xl ${isActive ? 'filled' : ''}`}>{icon}</span>
                <span className="text-[10px] font-bold relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AdminLayout;
