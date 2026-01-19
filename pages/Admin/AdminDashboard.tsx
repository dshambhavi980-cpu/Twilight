import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCouples } from '../../contexts/CouplesContext';
import { User, Database } from '../../types';
import Toast from '../../components/Toast';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

const AdminDashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const { generatePairingCode, couple } = useCouples();
    
    const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0 });
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [recentLogs, setRecentLogs] = useState<any[]>([]); // simplified type
    const [isLoading, setIsLoading] = useState(true);
    const [pairingCode, setPairingCode] = useState<string | null>(null);

    // Toast State
    const [toast, setToast] = useState<{ isVisible: boolean; message: string; subMessage?: string; type: 'success' | 'error' }>({ 
        isVisible: false, 
        message: '', 
        type: 'success' 
    });
    
    const showLocalToast = (message: string, subMessage?: string, type: 'success' | 'error' = 'success') => {
        setToast({ isVisible: true, message, subMessage, type });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            // 1. Fetch Users
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (profilesError) throw profilesError;
            setUsers(profiles || []);
            setStats(prev => ({ ...prev, totalUsers: profiles?.length || 0 }));

            // 2. Fetch Recent Logs (Last 24h for "Active Today" proxy or just count logs)
            const today = new Date().toISOString().split('T')[0];
            const { data: logs, error: logsError } = await supabase
                .from('daily_logs')
                .select('*, profiles(full_name, email)')
                .eq('date', today);

            if (!logsError) {
                setStats(prev => ({ ...prev, activeToday: logs?.length || 0 }));
                setRecentLogs(logs || []);
            }

        } catch (error) {
            console.error('Error fetching admin data:', error);
            showLocalToast('Error', 'Failed to load dashboard data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        try {
            const code = await generatePairingCode();
            setPairingCode(code);
            showLocalToast('Code Generated', `Pairing Code: ${code}`);
        } catch (error) {
            console.error(error);
            showLocalToast('Error', 'Failed to generate code', 'error');
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#121014] text-white">Loading Admin Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-[#121014] text-white font-sans">
            {/* Admin Header */}
            <header className="sticky top-0 z-20 bg-[#121014]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <span className="material-symbols-outlined">admin_panel_settings</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold font-display">Command Center</h1>
                        <p className="text-xs text-gray-400">Welcome back, Sir</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={fetchData} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-400">refresh</span>
                    </button>
                    <button onClick={signOut} className="text-sm text-red-400 hover:text-red-300 font-medium">
                        Log Out
                    </button>
                </div>
            </header>

            <main className="p-6 max-w-7xl mx-auto space-y-8">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1E1C24] p-6 rounded-2xl border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Total Users</p>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            {stats.totalUsers}
                        </h3>
                    </div>
                    <div className="bg-[#1E1C24] p-6 rounded-2xl border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Active Today</p>
                        <h3 className="text-3xl font-bold text-green-400">
                            {stats.activeToday}
                        </h3>
                    </div>
                    <div className="bg-[#1E1C24] p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Love Lock Code</p>
                            <h3 className="text-2xl font-mono font-bold tracking-widest text-pink-400">
                                {pairingCode || couple?.pairing_code || '---'}
                            </h3>
                        </div>
                        <button 
                            onClick={handleGenerateCode}
                            className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-xl transition-colors shadow-lg shadow-pink-500/20"
                        >
                            <span className="material-symbols-outlined">key</span>
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold px-1">Registered Users</h2>
                    <div className="bg-[#1E1C24] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-400 text-sm">
                                        <th className="p-4 font-medium">User</th>
                                        <th className="p-4 font-medium">Email</th>
                                        <th className="p-4 font-medium">Role</th>
                                        <th className="p-4 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-700/50 overflow-hidden">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {u.full_name?.charAt(0) || u.email?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium">{u.full_name || 'Anonymous'}</span>
                                            </td>
                                            <td className="p-4 text-gray-400">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs border ${
                                                    u.role === 'admin' 
                                                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                }`}>
                                                    {u.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                {new Date(u.updated_at || '').toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            
            <Toast 
                message={toast.message}
                subMessage={toast.subMessage}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                type={toast.type}
            />
        </div>
    );
};

export default AdminDashboard;
