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
  fetchPartnerData: () => Promise<void>;
  toggleGhostMode: () => Promise<void>;
  generateLoveCode: () => Promise<string>;
  unlockLoveNotes: (code: string) => Promise<void>;
  disconnectCouple: () => Promise<void>;
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

  // Check if current user is the "supporter" (partner_2 or explicitly set role)
  // Also fallback to user.role === 'partner' if no couple exists yet
  const isSupporter = couple 
    ? (couple.partner_1_id === user?.id && couple.partner_1_role === 'supporter') || 
      (couple.partner_2_id === user?.id) // Currently assuming partner_2 is always supporter
    : user?.role === 'partner'; // Fallback for partners who haven't joined yet
  
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

          // Prefer the active couple; fall back to the newest pending one
          const activeCouple = (rows || []).find(r => r.status === 'active');
          const pendingCouple = (rows || []).find(r => r.status === 'pending');
          const coupleData = activeCouple || pendingCouple || null;

          // Auto-cleanup: delete stale pending rows when an active couple exists
          if (activeCouple && rows && rows.length > 1) {
            const staleIds = rows.filter(r => r.id !== activeCouple.id).map(r => r.id);
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
            const fetched = notesData || [];
            // If we got more than PAGE_SIZE, there are older messages
            setHasMoreNotes(fetched.length > NOTES_PAGE_SIZE);
            // Take only PAGE_SIZE and reverse to chat order (oldest first)
            setNotes(fetched.slice(0, NOTES_PAGE_SIZE).reverse());
            // Mark received messages as delivered
            const unacknowledgedNotes = (notesData || [])
              .filter(n => n.sender_id !== user.id && n.status === 'sent')
              .map(n => n.id);
            
            if (unacknowledgedNotes.length > 0) {
              await supabase
                .from('shared_notes')
                .update({ status: 'delivered' })
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

    useEffect(() => {
    if (!couple?.id || !user) return;

    const channel = supabase
      .channel(`shared_notes_${couple.id}`)

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${couple.id}`,
        },
        (payload) => {
           console.log('[Realtime] Couple event:', payload.eventType);
           if (payload.eventType === 'UPDATE') {
               setCouple(payload.new as Couple);
           } else if (payload.eventType === 'DELETE') {
               console.log('[Realtime] Couple deleted/disconnected');
               setCouple(null);
               setNotes([]);
               // Optional: Show a toast or alert via a callback? 
               // For now, state change triggers UI re-render to "Enter Code" screen.
           }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_notes',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          console.log('[Realtime] Received event:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as SharedNote;
            // Only add if not already in list (avoid duplicates from optimistic updates)
            setNotes((prev) => {
              const exists = prev.some(n => n.id === newNote.id);
              if (exists) return prev;
              return [...prev, newNote];
            });

            // Mark as delivered or read if from partner
            if (newNote.sender_id !== user.id && newNote.status === 'sent') {
              // Use the ref here to get current value without breaking dependency
              const newStatus = isChatOpenRef.current ? 'read' : 'delivered';
              supabase
                .from('shared_notes')
                .update({ status: newStatus })
                .eq('id', newNote.id)
                .then();
            }
          } else if (payload.eventType === 'UPDATE') {
             const updatedNote = payload.new as SharedNote;
             setNotes((prev) =>
               prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
             );
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for couple ${couple.id}:`, status);
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [couple?.id, user?.id]); // Removed isChatOpen dependency


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
    const { data: existing } = await supabase
      .from('couples')
      .select('id, status, pairing_code')
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
      await supabase.from('couples').delete().eq('id', existing.id);
    }
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('couples')
      .insert({
        partner_1_id: user.id,
        pairing_code: code,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    setCouple(data);
    return code;
  };

  const joinCouple = async (code: string) => {
    if (!user) throw new Error('Not authenticated');

    // Guard: block joining if this user already belongs to a couple
    if (couple) {
      throw new Error('You are already in a pairing. Disconnect first to join another.');
    }

    // Double-check the DB
    const { data: existingCouple } = await supabase
      .from('couples')
      .select('id, status')
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
    
    // The RPC returns the couple object directly
    // Ideally we should cast it or validate it
    setCouple(data as unknown as Couple);
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
      const { data, error } = await supabase.from('shared_notes').insert({
        couple_id: couple.id,
        sender_id: user.id,
        content,
        type,
        media_url: mediaUrl,
      }).select().single();

      if (error) throw error;
      
      // Replace temp note with real note from DB
      setNotes((prev) => prev.map(n => n.id === tempId ? data : n));

      // Trigger Push Notification & Server-Side Delivery Update
      const recipientId = couple.partner_1_id === user.id ? couple.partner_2_id : couple.partner_1_id;
      if (recipientId) {
        supabase.functions.invoke('push-notifications', {
          body: {
            userId: recipientId,
            message: content.length > 50 ? 'New love note ❤️' : content,
            type: 'chat',
            noteId: data.id 
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
        n.id === noteId ? { ...n, reactions: updatedReactions } : n
      ));

      try {
        const { error } = await supabase
          .from('shared_notes')
          .update({ reactions: updatedReactions })
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
        const { error } = await supabase
          .from('shared_notes')
          .update({ reply_content: reply })
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

    await supabase
      .from('shared_notes')
      .update({ status: 'read' })
      .in('id', noteIds);
  };

  const fetchPartnerDataInternal = async (currentCouple: Couple, currentUserId: string) => {
      // Determine partner ID
      const partnerId = currentCouple.partner_1_id === currentUserId 
          ? currentCouple.partner_2_id 
          : currentCouple.partner_1_id;

      if (!partnerId) return;

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
              const { data: settings } = await supabase
                  .from('user_settings')
                  .select('*')
                  .eq('user_id', partnerId)
                  .single();
              
              if (settings) setPartnerSettings(settings);

              // 3. Fetch Recent Logs (Last 30 days)
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              const { data: logs } = await supabase
                  .from('daily_logs')
                  .select('*')
                  .eq('user_id', partnerId)
                  .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                  .order('date', { ascending: false });

              if (logs) setPartnerLogs(logs);
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

  const toggleGhostMode = async () => {
      if (!couple || !user) return;
      
      // Only partner_1 (menstruator) can usually toggle this, strictly speaking
      // But let's allow whoever is the 'owner' or has permissions
      // For now, assuming anyone can toggle shared state if they are in the couple
      
      try {
          const newStatus = !couple.share_enabled;
          
          // Optimistic update
          setCouple(prev => prev ? { ...prev, share_enabled: newStatus } : null);

          const { error } = await supabase
              .from('couples')
              .update({ share_enabled: newStatus })
              .eq('id', couple.id);

          if (error) throw error;
      } catch (error) {
          console.error("Failed to toggle ghost mode", error);
          // Revert
          setCouple(prev => prev ? { ...prev, share_enabled: !prev.share_enabled } : null);
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
        generateLoveCode: async () => {
             if (!user || !couple) throw new Error('Not authenticated');
             const code = Math.random().toString(36).substring(2, 8).toUpperCase();
             const { error } = await supabase.from('couples').update({ love_code: code }).eq('id', couple.id);
             if (error) throw error;
             
             // Optimistic update
             setCouple(prev => prev ? { ...prev, love_code: code } : null);
             return code;
        },
        unlockLoveNotes: async (code) => {
             if (!user) throw new Error('Not authenticated');
             const { data, error } = await supabase.rpc('join_couple_love_lock', { code_input: code });
             if (error) throw error;
             setCouple(data as any);
        },
        disconnectCouple: async () => {
             if (!user || !couple) throw new Error('Not authenticated');
             // Hard delete or Soft delete? Requested "depair from each other... logic locks partner dashboard"
             // Best approach: User deletes the couple row? Or sets status to disconnected?
             // "if the user depairs it , it locks the partner(bf) dashboard again and the code can be generated again"
             // This implies deleting the couple record essentially.
             const { error } = await supabase.from('couples').delete().eq('id', couple.id);
             if (error) throw error;
             setCouple(null);
             setNotes([]);
        },
        
        isSupporter,
        partnerProfile,
        partnerSettings,
        partnerLogs,
        fetchPartnerData: () => couple && user ? fetchPartnerDataInternal(couple, user.id) : Promise.resolve(),
        toggleGhostMode
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
