import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const PartnerAuthCallback: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const hasRedirected = useRef(false);

    useEffect(() => {
        const handlePartnerAuth = async () => {
            // Prevent multiple executions
            if (loading || hasRedirected.current) return;

            if (!user) {
                console.log('[PartnerAuth] No user found, redirecting to login');
                hasRedirected.current = true;
                navigate('/partner/login', { replace: true });
                return;
            }

            console.log('[PartnerAuth] Checking role for user:', user.id, 'Current Context Role:', user.role);

            try {
                // 1. Check role from DB
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (error) {
                    console.error('[PartnerAuth] Error fetching profile:', error);
                }

                const roleFromDb = profile ? (profile as any).role : null;
                const effectiveRole = user.role === 'admin' ? 'admin' : (roleFromDb || user.role);
                console.log('[PartnerAuth] DB Role:', roleFromDb, 'Effective Role:', effectiveRole);

                // 2. Admin users go to admin dashboard
                if (effectiveRole === 'admin') {
                    console.log('[PartnerAuth] Admin detected, redirecting to admin dashboard');
                    hasRedirected.current = true;
                    navigate('/admin/users', { replace: true });
                    return;
                }

                // 3. Partner users go to partner dashboard
                if (effectiveRole === 'partner') {
                    console.log('[PartnerAuth] Partner confirmed, redirecting to partner dashboard');
                    hasRedirected.current = true;
                    navigate('/partner/dashboard', { replace: true });
                    return;
                }

                // 4. Regular users need to be upgraded to partner
                if (effectiveRole === 'user') {
                    console.log('[PartnerAuth] Upgrading user to partner role...');
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ role: 'partner' } as any)
                        .eq('id', user.id);

                    if (updateError) {
                        console.error('[PartnerAuth] Error upgrading role:', updateError);
                        hasRedirected.current = true;
                        navigate('/dashboard', { replace: true });
                        return;
                    }
                    
                    console.log('[PartnerAuth] Upgrade successful. Redirecting...');
                    hasRedirected.current = true;
                    // Force reload to refresh auth context
                    window.location.href = '#/partner';
                    window.location.reload();
                }

            } catch (err) {
                 console.error('[PartnerAuth] Exception:', err);
                 hasRedirected.current = true;
                 navigate('/dashboard', { replace: true });
            }
        };

        handlePartnerAuth();
    }, [user, loading, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/60 font-medium">Setting up your partner account...</p>
            </div>
        </div>
    );
};

export default PartnerAuthCallback;
