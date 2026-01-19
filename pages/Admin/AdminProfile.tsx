import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminProfile: React.FC = () => {
    const { user, signOut } = useAuth();
    return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
             <div className="w-24 h-24 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                 <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
             </div>
             <h2 className="text-xl font-bold mb-2">{user?.name || 'Administrator'}</h2>
             <p className="text-gray-500 mb-8">{user?.email}</p>
             
             <div className="w-full max-w-sm space-y-3">
                 <button onClick={signOut} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl border border-red-500/20 font-bold transition-colors">
                     Log Out
                 </button>
             </div>
        </div>
    );
};

export default AdminProfile;
