import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Couple, SharedNote } from '../types';

const NOTES_PAGE_SIZE = 50;

interface CouplesContextType {
  couple: Couple | null;
  notes: SharedNote[];
  isLoading: boolean;
  loading: boolean;  // alias for isLoading
  hasMoreNotes: boolean;
  loadingOlder: boolean;
  loadOlderNotes: () => Promise<void>;
  createNote: (content: string, type?: 'text' | 'image' | 'audio', mediaUrl?: string) => Promise<void>;
  generatePairingCode: () => Promise<string>;
  joinCouple: (code: string) => Promise<void>;
  addReaction: (noteId: string, emoji: string) => Promise<void>;
  replyToNote: (noteId: string, reply: string) => Promise<void>;
  markAsRead: (noteIds: string[]) => Promise<void>;
  setIsChatOpen: (isOpen: boolean) => void;
  uploadMedia: (file: File) => Promise<string>;
  
  // Partner Features
  isSupporter: boolean;
  partnerProfile: any | null; // Using any for simplicity for now, should be Profile
  partnerSettings: any | null; // Should be UserSettings
  partnerLogs: any[]; // Should be DailyLog[]
  partnerData: {
    profile: any | null;
    settings: any | null;
    logs: any[];
  };
  fetchPartnerData: () => Promise<void>;
  toggleGhostMode: () => Promise<void>;
  generateLoveCode: () => Promise<string>;
  unlockLoveNotes: (code: string) => Promise<void>;
  disconnectCouple: () => Promise<void>;
  mapSettings: (row: any) => any;
}

const CouplesContext = createContext<CouplesContextType | undefined>(undefined);

export const CouplesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasMoreNotes, setHasMoreNotes] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  
  // Partner State
  const [partnerProfile, setPartnerProfile] = useState<any | null>(null);
  const [partnerSettings, setPartnerSettings] = useState<any | null>(null);
  const [partnerLogs, setPartnerLogs] = useState<any[]>([]);

  // Helper to map DB row to CycleSettings type
  const mapSettings = (s: any) => {
    if (!s) return null;
    return {
      avgCycleLength: s.avg_cycle_length || 28,
      avgPeriodLength: s.avg_period_length || 5,
      lastPeriodStart: s.last_period_start || '',
      onboardingCompleted: s.onboarding_completed || false,
      irregularCycle: s.irregular_cycle || false
    };
  };

  // Check if current user is the "supporter"
  const isSupporter = couple 
    ? (couple.partner_1_id === user?.id && couple.partner_1_role === 'supporter') || 
      (couple.partner_2_id === user?.id)
    : user?.role === 'partner';
  
  // Use a ref to track chat open status without triggering re-subscriptions
  const isChatOpenRef = React.useRef(isChatOpen);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // Wait for auth to be fully verified before fetching couple data.
  // Without this gate, the cached user triggers a fetch BEFORE the Supabase
  // client has restored its JWT session, so RLS blocks the query and couple = null.
  useEffect(() => {
    if (authLoading) return; // Don't fetch until supabase session is verified
    if (user) {
      // Fetch couple data for all users including admins
      fetchCoupleData();
    } else {
      setCouple(null);
      setNotes([]);
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const fetchCoupleData = async () => {
    try {
      if (!user) return;
      
      // Timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Couple data fetch timeout')), 10000)
      );

      const fetchDataPromise = async () => {
          // Fetch ALL couple rows for this user (not maybeSingle — that crashes
          // with PGRST116 if multiple rows exist, e.g. an active + stale pending).
          const query = user.role === 'admin' 
            ? supabase.from('couples').select('*').eq('partner_1_id', user.id).order('created_at', { ascending: false })
            : supabase.from('couples').select('*').or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`).order('created_at', { ascending: false });
          
          const { data: rows, error: coupleError } = await query;

          if (coupleError) throw coupleError;

          const coupleRows = (rows || []) as Couple[];

          // Prefer the active couple; fall back to the newest pending one
          const activeCouple = coupleRows.find(r => r.status === 'active');
          const pendingCouple = coupleRows.find(r => r.status === 'pending');
          const coupleData = activeCouple || pendingCouple || null;

          // Auto-cleanup: delete stale pending rows when an active couple exists
          if (activeCouple && coupleRows.length > 1) {
            const staleIds = coupleRows.filter(r => r.id !== activeCouple.id).map(r => r.id);
            if (staleIds.length > 0) {
              supabase.from('couples').delete().in('id', staleIds).then(() => {
                console.log('[Couples] Cleaned up', staleIds.length, 'stale couple rows');
              });
            }
          }

          setCouple(coupleData);

          if (coupleData) {
            // Fetch only the latest page of notes; older ones loaded on demand
            const { data: notesData, error: notesError } = await supabase
              .from('shared_notes')
              .select('*')
              .eq('couple_id', coupleData.id)
              .order('created_at', { ascending: false })
              .limit(NOTES_PAGE_SIZE + 1);

            if (notesError) throw notesError;
            const fetched = (notesData || []) as SharedNote[];
            // If we got more than PAGE_SIZE, there are older messages
            setHasMoreNotes(fetched.length > NOTES_PAGE_SIZE);
            // Take only PAGE_SIZE and reverse to chat order (oldest first)
            setNotes(fetched.slice(0, NOTES_PAGE_SIZE).reverse());
            // Mark received messages as delivered
            const unacknowledgedNotes = fetched
              .filter(n => n.sender_id !== user.id && n.status === 'sent')
              .map(n => n.id);
            
            if (unacknowledgedNotes.length > 0) {
              await supabase
                .from('shared_notes')
                .update({ status: 'delivered' } as any)
                .in('id', unacknowledgedNotes);
            }

            // Fetch Partner Data if available and authorized
            if (coupleData.status === 'active') {
                 await fetchPartnerDataInternal(coupleData, user.id);
            }
          }
      };

      await Promise.race([fetchDataPromise(), timeoutPromise]);

    } catch (error) {
      console.error('Error fetching couple data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // PARTNER REAL-TIME SYNC HELPER
  const partnerId = React.useMemo(() => {
    if (!couple || !user) return null;
    return couple.partner_1_id === user.id ? couple.partner_2_id : couple.partner_1_id;
  }, [couple, user]);

  // Unified Real-time Subscription Effect
  useEffect(() => {
    if (!couple?.id || !user) return;

    // 1. MAIN CHANNEL: Couple status & Shared Notes
    const mainChannel = supabase
      .channel(`couple_main_${couple.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${couple.id}` },
        (payload) => {
            console.log('[Realtime] Couple data update');
            if (payload.eventType === 'UPDATE') setCouple(payload.new as Couple);
            if (payload.eventType === 'DELETE') {
                setCouple(null);
                setNotes([]);
                setPartnerProfile(null);
                setPartnerSettings(null);
                setPartnerLogs([]);
            }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_notes', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as SharedNote;
            setNotes((prev) => prev.some(n => n.id === newNote.id) ? prev : [...prev, newNote]);
            if (newNote.sender_id !== user.id && newNote.status === 'sent') {
              const newStatus = isChatOpenRef.current ? 'read' : 'delivered';
              supabase.from('shared_notes').update({ status: newStatus }).eq('id', newNote.id).then();
            }
          } else if (payload.eventType === 'UPDATE') {
             const updatedNote = payload.new as SharedNote;
             setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // 2. PARTNER CHANNEL: Live Cycle Sync + Profile Sync
    let partnerChannel: any = null;
    if (couple.status === 'active' && partnerId && partnerId !== user.id) {
      partnerChannel = supabase
        .channel(`partner_realtime_${partnerId}`)
        // Live profile sync (name, avatar changes)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${partnerId}` },
          (payload) => {
            console.log('[Realtime] Partner profile synced');
            setPartnerProfile(payload.new as any);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${partnerId}` },
          (payload) => {
            console.log('[Realtime] Partner settings synced');
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const s = payload.new as any;
              let start = s.last_period_start || '';
              // Smart Fallback integration
              if (!start && partnerLogs.length > 0) {
                const latest = [...partnerLogs].sort((a, b) => b.date.localeCompare(a.date)).find(l => l.flow);
                if (latest) start = latest.date;
              }
              setPartnerSettings(mapSettings({ ...s, last_period_start: start }));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'daily_logs', filter: `user_id=eq.${partnerId}` },
          (payload) => {
            console.log('[Realtime] Partner log synced');
            if (payload.eventType === 'INSERT') {
              setPartnerLogs(prev => [payload.new as any, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
            } else if (payload.eventType === 'UPDATE') {
              setPartnerLogs(prev => prev.map(l => l.id === payload.new.id ? payload.new as any : l));
            } else if (payload.eventType === 'DELETE') {
              setPartnerLogs(prev => prev.filter(l => l.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(mainChannel);
      if (partnerChannel) supabase.removeChannel(partnerChannel);
    };
  }, [couple?.id, user?.id, partnerId, couple?.status]); 


  // Load older messages (pagination — prepend to the front)
  const loadOlderNotes = async () => {
    if (!couple?.id || !hasMoreNotes || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const oldestNote = notes[0];
      if (!oldestNote) return;

      const { data, error } = await supabase
        .from('shared_notes')
        .select('*')
        .eq('couple_id', couple.id)
        .lt('created_at', oldestNote.created_at)
        .order('created_at', { ascending: false })
        .limit(NOTES_PAGE_SIZE + 1);

      if (error) throw error;
      const fetched = data || [];
      setHasMoreNotes(fetched.length > NOTES_PAGE_SIZE);
      const page = fetched.slice(0, NOTES_PAGE_SIZE).reverse();
      setNotes(prev => [...page, ...prev]);
    } catch (err) {
      console.error('Error loading older notes:', err);
    } finally {
      setLoadingOlder(false);
    }
  };


  const generatePairingCode = async () => {
    if (!user) throw new Error('Not authenticated');

    // Guard: if we already have ANY couple (active OR pending), block new pairing
    if (couple) {
      if (couple.status === 'active') {
        throw new Error('You are already connected. Disconnect first to create a new pairing.');
      }
      // Already have a pending code — just return it
      if (couple.status === 'pending' && couple.pairing_code) {
        return couple.pairing_code;
      }
    }

    // Double-check against the DB to prevent race conditions
    const { data: existing } = await (supabase
      .from('couples')
      .select('id, status, pairing_code') as any)
      .or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        throw new Error('You are already connected. Disconnect first to create a new pairing.');
      }
      if (existing.status === 'pending' && existing.pairing_code) {
        // Return the existing pending code instead of creating another
        return existing.pairing_code;
      }
      // Stale pending row without a code — delete it
      await (supabase.from('couples').delete().eq('id', existing.id) as any);
    }
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await (supabase
      .from('couples')
      .insert({
        partner_1_id: user.id,
        pairing_code: code,
        status: 'pending'
      } as any) as any)
      .select()
      .single();

    if (error) throw error;
    setCouple(data as any);
    return code;
  };

  const joinCouple = async (code: string) => {
    if (!user) throw new Error('Not authenticated');

    // Guard: block joining if this user already belongs to a couple
    if (couple) {
      throw new Error('You are already in a pairing. Disconnect first to join another.');
    }

    // Double-check the DB
    const { data: existingCouple } = await (supabase
      .from('couples')
      .select('id, status') as any)
      .or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`)
      .not('status', 'eq', 'pending')
      .limit(1)
      .maybeSingle();

    if (existingCouple) {
      throw new Error('You are already connected to someone. Disconnect first.');
    }

    const { data, error } = await supabase
      .rpc('join_couple', { code_input: code });

    if (error) throw error;
    
    setCouple(data as any);
  };

  const uploadMedia = async (file: File): Promise<string> => {
    if (!user || !couple) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${couple.id}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const createNote = async (content: string, type: 'text' | 'image' | 'audio' = 'text', mediaUrl?: string) => {
    if (!user || !couple) return;

    // Optimistic update - add note immediately to UI
    const tempId = `temp-${Date.now()}`;
    const optimisticNote: SharedNote = {
      id: tempId,
      couple_id: couple.id,
      sender_id: user.id,
      content,
      reply_content: null,
      reactions: null,
      status: 'sent',
      type,
      media_url: mediaUrl,
      created_at: new Date().toISOString(),
    };
    
    setNotes((prev) => [...prev, optimisticNote]);

    try {
      const { data, error } = await (supabase.from('shared_notes').insert({
        couple_id: couple.id,
        sender_id: user.id,
        content,
        type,
        media_url: mediaUrl,
      } as any) as any).select().single();

      if (error) throw error;
      
      // Replace temp note with real note from DB
      setNotes((prev) => prev.map(n => n.id === tempId ? (data as any) : n));

      // Trigger Push Notification & Server-Side Delivery Update
      const recipientId = couple.partner_1_id === user.id ? couple.partner_2_id : couple.partner_1_id;
      if (recipientId) {
        supabase.functions.invoke('push-notifications', {
          body: {
            userId: recipientId,
            message: content.length > 50 ? 'New love note ❤️' : content,
            type: 'chat',
            noteId: (data as any).id 
          }
        }).catch(err => console.error('Push failed:', err));
      }
    } catch (error) {
      // Remove optimistic note on error
      setNotes((prev) => prev.filter(n => n.id !== tempId));
      throw error;
    }
  };

  const addReaction = async (noteId: string, emoji: string) => {
      if(!user) return;
      const note = notes.find(n => n.id === noteId);
      if(!note) return;

      const currentReactions = note.reactions || [];
      const newReaction = { user_id: user.id, emoji };
      const updatedReactions = [...currentReactions, newReaction];

      // Optimistic update
      setNotes((prev) => prev.map(n => 
        n.id === noteId ? { ...n, reactions: updatedReactions as any } : n
      ));

      try {
        const { error } = await (supabase
          .from('shared_notes')
          .update({ reactions: updatedReactions } as any) as any)
          .eq('id', noteId);
        
        if(error) throw error;
      } catch (error) {
        // Revert on error
        setNotes((prev) => prev.map(n => 
          n.id === noteId ? { ...n, reactions: currentReactions } : n
        ));
        throw error;
      }
  };
  
    const replyToNote = async (noteId: string, reply: string) => {
      if(!user) return;
      const note = notes.find(n => n.id === noteId);
      const previousReply = note?.reply_content;
      
      // Optimistic update
      setNotes((prev) => prev.map(n => 
        n.id === noteId ? { ...n, reply_content: reply } : n
      ));

      try {
        const { error } = await (supabase
          .from('shared_notes')
          .update({ reply_content: reply } as any) as any)
          .eq('id', noteId);
        
        if(error) throw error;
      } catch (error) {
        // Revert on error
        setNotes((prev) => prev.map(n => 
          n.id === noteId ? { ...n, reply_content: previousReply } : n
        ));
        throw error;
      }
  };

  const markAsRead = async (noteIds: string[]) => {
    if (!user || noteIds.length === 0) return;

    // Optimistic update
    setNotes((prev) => prev.map(n => 
      noteIds.includes(n.id) ? { ...n, status: 'read' } : n
    ));

    await (supabase
      .from('shared_notes')
      .update({ status: 'read' } as any) as any)
      .in('id', noteIds);
  };

  const fetchPartnerDataInternal = async (currentCouple: Couple, currentUserId: string) => {
      // Determine partner ID — must be the OTHER person in the couple
      const partnerId = currentCouple.partner_1_id === currentUserId 
          ? currentCouple.partner_2_id 
          : currentCouple.partner_1_id;

      // Safety guard: never fetch our own data as "partner"
      if (!partnerId || partnerId === currentUserId) {
        console.warn('[PARTNER] partnerId resolved to self or null — skipping fetch');
        return;
      }

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Partner data fetch timeout')), 8000)
      );

      const fetchPromise = async () => {
          // 1. Fetch Partner Profile
          const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', partnerId)
              .single();
          
          if (profile) setPartnerProfile(profile);

              // 2. Fetch User Settings (Cycle Data)
              // Only if share_enabled is true (checked by RLS, but safe to check here too)
              if (currentCouple.share_enabled) {
                  const { data: settingsData } = await (supabase
                      .from('user_settings')
                      .select('*') as any)
                      .eq('user_id', partnerId)
                      .single();
                  
                  // 3. Fetch Recent Logs (Last 30 days)
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  const { data: logsData } = await (supabase
                      .from('daily_logs')
                      .select('*') as any)
                      .eq('user_id', partnerId)
                      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                      .order('date', { ascending: false });

                      if (settingsData) {
                          const s = settingsData as any;
                          let effectiveStart = s.last_period_start || '';
                          
                          // SMART FALLBACK: If start date is missing in settings, derive from logs
                          if (!effectiveStart && logsData && (logsData as any[]).length > 0) {
                              const latestFlowLog = (logsData as any[]).find((l: any) => l.flow);
                              if (latestFlowLog) {
                                  console.log('[PARTNER DEBUG] Using fallback lastPeriodStart from log:', latestFlowLog.date);
                                  effectiveStart = latestFlowLog.date;
                              }
                          }

                          setPartnerSettings(mapSettings({
                              ...s,
                              last_period_start: effectiveStart
                          }));
                      } else {
                          setPartnerSettings(null);
                      }

                      if (logsData) setPartnerLogs(logsData as any[]);
                  } else {
                      setPartnerSettings(null);
                      setPartnerLogs([]);
                  }
          };

      try {
           await Promise.race([fetchPromise(), timeoutPromise]);
      } catch (error) {
          console.error('Error fetching partner data:', error);
      }
  };

  // Memoized partner data for components to consume
  const partnerData = React.useMemo(() => ({
    profile: partnerProfile,
    settings: partnerSettings,
    logs: partnerLogs
  }), [partnerProfile, partnerSettings, partnerLogs]);

  const toggleGhostMode = async () => {
      if (!couple || !user) return;
      
      try {
          const newStatus = !couple.share_enabled;
          
          // Optimistic update
          setCouple(prev => prev ? { ...prev, share_enabled: newStatus } : null);

          // Use explicit casting to bypass intermittent schema mapping failures
          const { error } = await (supabase
              .from('couples')
              .update({ share_enabled: newStatus } as any) as any)
              .eq('id', couple.id);

          if (error) throw error;
      } catch (err) {
          console.error('Error toggling ghost mode:', err);
          // Revert optimistic update
          setCouple(prev => prev ? { ...prev, share_enabled: !prev.share_enabled } : null);
      }
  };

  const generateLoveCode = async () => {
    if (!user || !couple) throw new Error('Not authenticated');
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await (supabase
      .from('couples')
      .update({ love_code: code } as any) as any)
      .eq('id', couple.id);

    if (error) throw error;
    setCouple(prev => prev ? { ...prev, love_code: code } : null);
    return code;
  };

  const unlockLoveNotes = async (code: string) => {
    if (!user || !couple) throw new Error('Not authenticated');

    const { data, error } = await (supabase
      .rpc('unlock_love_notes', { code_input: code }) as any);

    if (error) throw error;
    setCouple(data as any);
  };

  const disconnectCouple = async () => {
    if (!user || !couple) throw new Error('Not authenticated');
    
    try {
      // 1. Delete shared notes first
      await (supabase
        .from('shared_notes')
        .delete() as any)
        .eq('couple_id', couple.id);
        
      // 2. Delete the couple
      const { error } = await (supabase.from('couples').delete().eq('id', couple.id) as any);
      if (error) throw error;
      
      setCouple(null);
      setNotes([]);
      setPartnerProfile(null);
      setPartnerSettings(null);
      setPartnerLogs([]);
    } catch (err) {
      console.error('Disconnect failed:', err);
      throw err;
    }
  };

  return (
    <CouplesContext.Provider
      value={{
        couple,
        notes,
        isLoading,
        loading: isLoading,
        hasMoreNotes,
        loadingOlder,
        loadOlderNotes,
        createNote,
        generatePairingCode,
        joinCouple,
        addReaction,
        replyToNote,
        markAsRead,
        setIsChatOpen,
        uploadMedia,
        isSupporter,
        partnerProfile,
        partnerSettings,
        partnerLogs,
        partnerData,
        fetchPartnerData: () => couple && user ? fetchPartnerDataInternal(couple, user.id) : Promise.resolve(),
        toggleGhostMode,
        generateLoveCode,
        unlockLoveNotes,
        disconnectCouple,
        mapSettings
      }}
    >
      {children}
    </CouplesContext.Provider>
  );
};

export const useCouples = () => {
  const context = useContext(CouplesContext);
  if (context === undefined) {
    throw new Error('useCouples must be used within a CouplesProvider');
  }
  return context;
};
