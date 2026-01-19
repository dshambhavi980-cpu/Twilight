import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Toast from '../../components/Toast';

const AdminLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Fetch recent logs with user details
                const { data, error } = await supabase
                    .from('daily_logs')
                    .select('*, profiles(full_name, email, avatar_url)')
                    .order('date', { ascending: false })
                    .limit(50);

                if (error) throw error;
                setLogs(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading logs...</div>;

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold mb-6 font-display">User Logs</h1>
            
            {logs.length === 0 ? (
                <p className="text-gray-500 text-center">No logs found.</p>
            ) : (
                <div className="space-y-3">
                    {logs.map((log) => (
                        <div key={log.id} className="bg-[#1E1C24] p-4 rounded-2xl border border-white/5 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-700/50 overflow-hidden shrink-0">
                                    {(log.profiles as any)?.avatar_url ? (
                                        <img src={(log.profiles as any).avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                            {(log.profiles as any)?.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm text-gray-200">{(log.profiles as any)?.full_name || 'Anonymous'}</h3>
                                    <p className="text-xs text-gray-500">{new Date(log.date).toDateString()}</p>
                                </div>
                                {log.flow_intensity && (
                                     <span className={`px-2 py-1 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20`}>
                                         {log.flow_intensity}
                                     </span>
                                )}
                            </div>
                            
                            {(log.symptoms as string[] || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {(log.symptoms as string[]).map((s, i) => (
                                        <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded-full text-gray-400">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                             {(log.moods as string[] || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {(log.moods as string[]).map((m, i) => (
                                        <span key={i} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminLogs;
