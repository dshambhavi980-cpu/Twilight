import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Couple, SharedNote } from '../types';
import { initializeEncryptionKeys, encryptMessage, decryptMessage, encryptData, decryptData, encryptBlob, decryptBlob } from '../lib/encryption';

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
  broadcastUpdate: (type: 'log' | 'settings' | 'profile') => void;
  mapSettings: (row: any) => any;
  partnerPubKey: string | null;
}

const CouplesContext = createContext<CouplesContextType | undefined>(undefined);

export const CouplesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, bootData } = useAuth();
  // Cache couple data to prevent flash on resume/re-mount
  const getCachedCouple = (): Couple | null => {
    try {
      const cached = localStorage.getItem('tw_cached_couple');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  };

  const setCachedCouple = (v: Couple | null) => {
    try {
      if (v) localStorage.setItem('tw_cached_couple', JSON.stringify(v));
      else localStorage.removeItem('tw_cached_couple');
    } catch { }
  };

  const [couple, setCouple] = useState<Couple | null>(getCachedCouple);
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [isLoading, setIsLoading] = useState(() => !getCachedCouple());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasMoreNotes, setHasMoreNotes] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  
  // Partner State
  const [partnerProfile, setPartnerProfile] = useState<any | null>(null);
  const [partnerSettings, setPartnerSettings] = useState<any | null>(null);
  const [partnerLogs, setPartnerLogs] = useState<any[]>([]);
  const [partnerPubKey, setPartnerPubKey] = useState<string | null>(null);

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

  // Use a ref for partnerLogs to avoid stale closures in Realtime listeners
  const partnerLogsRef = React.useRef<any[]>([]);
  useEffect(() => {
    partnerLogsRef.current = partnerLogs;
  }, [partnerLogs]);

  // Cache for partner's public key to reduce DB calls and latency
  const partnerPublicKeyRef = React.useRef<string | null>(null);

  // Wait for auth to be fully verified before fetching couple data.
  // Without this gate, the cached user triggers a fetch BEFORE the Supabase
  // client has restored its JWT session, so RLS blocks the query and couple = null.
  useEffect(() => {
    if (authLoading) return; // Don't fetch until supabase session is verified
    if (user) {
      // Initialize E2EE Keys
      initializeEncryptionKeys(user.id).then(pubKey => {
        console.log('[E2EE] Initializing public key in DB');
        // Use 'as any' for now to bypass strict typed-table check issues on new tables
        (supabase.from('user_keys' as any) as any).upsert({ user_id: user.id, public_key: pubKey }).then();
      });

      // Fetch couple data for all users including admins
      fetchCoupleData();
    } else {
      setCouple(null);
      setNotes([]);
      setIsLoading(false);
      partnerPublicKeyRef.current = null;
      setPartnerPubKey(null);
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
          // 1. Check for Boot Data
          if (bootData && user) {
             console.log('[COUPLES DEBUG] Using Boot Data for initial load');
             const bootCouple = bootData.couple as Couple | null;
             setCouple(bootCouple);
             setCachedCouple(bootCouple);
             
             if (bootCouple && bootData.notes) {
               // Decrypt and initialize notes
               const resolvedPartnerId = bootCouple.partner_1_id === user.id ? bootCouple.partner_2_id : bootCouple.partner_1_id;
               const partnerPubKey = await fetchPartnerPublicKey(resolvedPartnerId || undefined);
               const decryptedNotes = await Promise.all((bootData.notes as any[]).map(async (n) => {
                   let decrypted = { ...n };
                   if (partnerPubKey) {
                       if (n.type === 'text') decrypted.content = await decryptMessage(n.content, partnerPubKey, user.id);
                       if (n.media_url) decrypted.media_url = await decryptMessage(n.media_url, partnerPubKey, user.id);
                       if (n.reply_content) decrypted.reply_content = await decryptMessage(n.reply_content, partnerPubKey, user.id);
                       if (n.reactions && typeof n.reactions === 'string') {
                           decrypted.reactions = await decryptData<any[]>(n.reactions, partnerPubKey, user.id) || [];
                       } else if (!n.reactions) {
                           decrypted.reactions = [];
                       }
                   } else if (!n.reactions) {
                       decrypted.reactions = [];
                   }
                   return decrypted;
               }));
               setHasMoreNotes(decryptedNotes.length > NOTES_PAGE_SIZE);
               setNotes(decryptedNotes.slice(0, NOTES_PAGE_SIZE).reverse());
             }

             if (bootCouple?.status === 'active') {
               await fetchPartnerDataInternal(bootCouple, user.id);
             }
             setIsLoading(false);
             return;
          }

          // 2. Standard Fetch fallback (Optimized with selective columns)
          const columns = 'id, partner_1_id, partner_2_id, pairing_code, status, partner_1_role, share_enabled, love_code, love_unlocked, created_at';
          const query = user.role === 'admin' 
            ? supabase.from('couples').select(columns).eq('partner_1_id', user.id).order('created_at', { ascending: false })
            : supabase.from('couples').select(columns).or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`).order('created_at', { ascending: false });
          
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
          setCachedCouple(coupleData);

          if (coupleData) {
            // Fetch only the latest page of notes; older ones loaded on demand
            const { data: notesData, error: notesError } = await supabase
              .from('shared_notes')
              .select('id, sender_id, content, type, status, created_at, reply_content, reactions, media_url')
              .eq('couple_id', coupleData.id)
              .order('created_at', { ascending: false })
              .limit(NOTES_PAGE_SIZE + 1);

            if (notesError) throw notesError;
            const fetched = (notesData || []) as SharedNote[];

            // E2EE Decryption Flow
            const resolvedPartnerId = coupleData.partner_1_id === user.id ? coupleData.partner_2_id : coupleData.partner_1_id;
            const partnerPubKey = await fetchPartnerPublicKey(resolvedPartnerId || undefined);
            const decryptedNotes = await Promise.all(fetched.map(async (n) => {
                let decrypted = { ...n };
                if (!partnerPubKey) {
                    // Fallback: Ensure reactions is at least an empty array if not decrypted
                    if (typeof decrypted.reactions === 'string') decrypted.reactions = [];
                    return decrypted;
                }

                // 1. Decrypt Content
                if (n.type === 'text') {
                    decrypted.content = await decryptMessage(n.content, partnerPubKey, user.id);
                }

                // 2. Decrypt Media URL
                if (n.media_url) {
                    decrypted.media_url = await decryptMessage(n.media_url, partnerPubKey, user.id);
                }

                // 3. Decrypt Reply Content
                if (n.reply_content) {
                    decrypted.reply_content = await decryptMessage(n.reply_content, partnerPubKey, user.id);
                }

                // 4. Decrypt Reactions
                if (n.reactions && typeof n.reactions === 'string') {
                    const decryptedReactions = await decryptData<any[]>(n.reactions, partnerPubKey, user.id);
                    decrypted.reactions = decryptedReactions || [];
                } else if (!n.reactions) {
                    decrypted.reactions = [];
                }

                return decrypted;
            }));

            // If we got more than PAGE_SIZE, there are older messages
            setHasMoreNotes(decryptedNotes.length > NOTES_PAGE_SIZE);
            // Take only PAGE_SIZE and reverse to chat order (oldest first)
            setNotes(decryptedNotes.slice(0, NOTES_PAGE_SIZE).reverse());
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

  const decryptNote = async (note: SharedNote, partnerPubKey: string, userId: string): Promise<SharedNote> => {
      const decrypted = { ...note };
      // 1. Decrypt Content
      if (decrypted.type === 'text') {
          decrypted.content = await decryptMessage(decrypted.content, partnerPubKey, userId);
      }
      // 2. Decrypt Media URL
      if (decrypted.media_url) {
          decrypted.media_url = await decryptMessage(decrypted.media_url, partnerPubKey, userId);
      }
      // 3. Decrypt Reply Content
      if (decrypted.reply_content) {
          decrypted.reply_content = await decryptMessage(decrypted.reply_content, partnerPubKey, userId);
      }
      // 4. Decrypt Reactions
      if (decrypted.reactions && typeof decrypted.reactions === 'string') {
          const decryptedReactions = await decryptData<any[]>(decrypted.reactions as any, partnerPubKey, userId);
          decrypted.reactions = decryptedReactions || [];
      } else if (!decrypted.reactions) {
          decrypted.reactions = [];
      }
      return decrypted;
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
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            let newNote = payload.new as SharedNote;
            
            // WE MUST DECRYPT ON INSERT
            const partnerPubKey = await fetchPartnerPublicKey();
            if (partnerPubKey) {
                newNote = await decryptNote(newNote, partnerPubKey, user.id);
            }

            setNotes((prev) => prev.some(n => n.id === newNote.id) ? prev : [...prev, newNote]);
            if (newNote.sender_id !== user.id && newNote.status === 'sent') {
              const newStatus = isChatOpenRef.current ? 'read' : 'delivered';
              supabase.from('shared_notes').update({ status: newStatus }).eq('id', newNote.id).then();
            }
          } else if (payload.eventType === 'UPDATE') {
             let updatedNote = payload.new as SharedNote;
             
             // WE MUST DECRYPT ON UPDATE
             const partnerPubKey = await fetchPartnerPublicKey();
             if (partnerPubKey) {
                 updatedNote = await decryptNote(updatedNote, partnerPubKey, user.id);
             }

             setNotes((prev) => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
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
          'broadcast',
          { event: 'partner_data_updated' },
          (payload) => {
            console.log('[Realtime] Broadcast received:', payload.payload.type);
            // Re-fetch partner data immediately on broadcast
            if (couple && user) {
               fetchPartnerDataInternal(couple, user.id);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${partnerId}` },
          (payload) => {
            console.log('[Realtime] Partner settings synced', payload.eventType);
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const s = payload.new as any;
              let start = s.last_period_start || '';
              // Smart Fallback integration using Ref to avoid stale logs state
              if (!start && partnerLogsRef.current.length > 0) {
                const latest = [...partnerLogsRef.current].sort((a, b) => b.date.localeCompare(a.date)).find(l => l.flow);
                if (latest) {
                   console.log('[Realtime] Settings fallback to latest log:', latest.date);
                   start = latest.date;
                }
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
            const mapPartnerLog = (l: any) => ({
              ...l,
              energyLevel: l.energy_level,
              sleepQuality: l.sleep_quality,
              sleepHours: l.sleep_hours
            });

            if (payload.eventType === 'INSERT') {
              setPartnerLogs(prev => [mapPartnerLog(payload.new), ...prev].sort((a, b) => b.date.localeCompare(a.date)));
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapPartnerLog(payload.new);
              setPartnerLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
            } else if (payload.eventType === 'DELETE') {
              setPartnerLogs(prev => prev.filter(l => l.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    // 3. READ RECEIPT SYNC: Poll note statuses every 3s while chat is open
    // This ensures the sender sees read/delivered status even if Realtime misses
    let statusPollInterval: NodeJS.Timeout | null = null;
    statusPollInterval = setInterval(async () => {
      if (!isChatOpenRef.current || !couple?.id || !user) return;
      try {
        const { data } = await supabase
          .from('shared_notes')
          .select('id, status')
          .eq('couple_id', couple.id)
          .eq('sender_id', user.id)
          .in('status', ['sent', 'delivered'])
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (data && data.length > 0) {
          setNotes(prev => prev.map(n => {
            const updated = (data as any[]).find(d => d.id === n.id);
            return updated && updated.status !== n.status
              ? { ...n, status: updated.status }
              : n;
          }));
        }
      } catch (err) {
        // Silent — polling is a fallback
      }
    }, 3000);

    return () => {
      supabase.removeChannel(mainChannel);
      if (partnerChannel) supabase.removeChannel(partnerChannel);
      if (statusPollInterval) clearInterval(statusPollInterval);
    };
  }, [couple?.id, user?.id, partnerId, couple?.status]); 

  // Direct Broadcast helper
  const broadcastUpdate = (type: 'log' | 'settings' | 'profile') => {
    if (!couple?.id || !partnerId) return;
    
    const channelId = `partner_realtime_${user?.id}`; // Listeners listen to the sender's channel
    supabase.channel(channelId).send({
      type: 'broadcast',
      event: 'partner_data_updated',
      payload: { type, senderId: user?.id },
    });
    console.log('[Realtime] Broadcast sent:', type);
  };


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
        partner_1_role: user.role === 'partner' ? 'supporter' : 'menstruator',
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

  // Prevent partner-to-partner connections:
  // Look up the pending couple row to check the creator's role
  if (user.role === 'partner') {
    const { data: pendingCouple } = await (supabase
      .from('couples')
      .select('partner_1_id, partner_1_role') as any)
      .eq('pairing_code', code.toUpperCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingCouple?.partner_1_role === 'supporter') {
      // Both are partners (supporter role = partner account)
      throw new Error('Two partner accounts cannot connect with each other. One must be a regular user account.');
    }
  } else {
    // user.role === 'user' — check if code creator is also a user (menstruator)
    const { data: pendingCouple } = await (supabase
      .from('couples')
      .select('partner_1_id, partner_1_role') as any)
      .eq('pairing_code', code.toUpperCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingCouple?.partner_1_role === 'menstruator') {
      // Both are regular users (menstruator role = user account)
      throw new Error('Two user accounts cannot connect with each other. One must be a partner account.');
    }
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

    // E2EE: Encrypt the file content before upload
    let uploadData: ArrayBuffer | File = file;
    const partnerPubKey = await fetchPartnerPublicKey();
    if (partnerPubKey) {
        console.log('[E2EE] Encrypting file for upload...');
        const arrayBuffer = await file.arrayBuffer();
        uploadData = await encryptBlob(arrayBuffer, partnerPubKey);
        console.log('[E2EE] File encryption complete');
    }

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, uploadData, {
          contentType: file.type // Maintain original mime type
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const fetchPartnerPublicKey = async (manualPartnerId?: string): Promise<string | null> => {
    const id = manualPartnerId || partnerId;
    if (!id) return null;
    if (partnerPublicKeyRef.current && !manualPartnerId) return partnerPublicKeyRef.current;

    const { data, error } = await (supabase
        .from('user_keys' as any)
        .select('public_key')
        .eq('user_id', id)
        .maybeSingle() as any);
    
    if (error || !data) {
        console.warn('[E2EE] Could not fetch public key for partner:', id);
        return null;
    }
    
    // Always set it to cache since a user only has one active partner at a time
    partnerPublicKeyRef.current = data.public_key;
    setPartnerPubKey(data.public_key);
    
    return data.public_key;
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
      let finalContent = content;
      let encryptedMediaUrl = mediaUrl;

      const partnerPubKey = await fetchPartnerPublicKey();
      if (partnerPubKey) {
          if (type === 'text') {
              finalContent = await encryptMessage(content, partnerPubKey);
              console.log('[E2EE] Message encrypted');
          }
          if (mediaUrl) {
              encryptedMediaUrl = await encryptMessage(mediaUrl, partnerPubKey);
              console.log('[E2EE] Media URL encrypted');
          }
      }

      const { data, error } = await (supabase.from('shared_notes').insert({
        couple_id: couple.id,
        sender_id: user.id,
        content: finalContent,
        type,
        media_url: encryptedMediaUrl,
      } as any) as any).select().single();

      if (error) throw error;
      
      // Decrypt the response for the sender before updating state to prevent flicker
      let decryptedNote = { ...(data as any) };
      if (partnerPubKey) {
          if (type === 'text') decryptedNote.content = await decryptMessage(decryptedNote.content, partnerPubKey);
          if (decryptedNote.media_url) decryptedNote.media_url = await decryptMessage(decryptedNote.media_url, partnerPubKey);
          if (decryptedNote.reply_content) decryptedNote.reply_content = await decryptMessage(decryptedNote.reply_content, partnerPubKey);
          if (decryptedNote.reactions && typeof decryptedNote.reactions === 'string') {
              const decryptedReactions = await decryptData<any[]>(decryptedNote.reactions, partnerPubKey);
              decryptedNote.reactions = decryptedReactions || [];
          } else if (!decryptedNote.reactions) {
              decryptedNote.reactions = [];
          }
      }

      // Replace temp note with real note from DB (using decrypted content)
      // If the real note already arrived via Realtime INSERT, remove the temp one to prevent duplicates which can mess up the UI (e.g. duplicate blue ticks).
      setNotes((prev) => {
          if (prev.some(n => n.id === decryptedNote.id)) {
              // Note already added by Realtime listener. Update it just in case and remove the temp one.
              return prev.map(n => n.id === decryptedNote.id ? decryptedNote : n).filter(n => n.id !== tempId);
          }
          // Otherwise, map tempId to real note
          return prev.map(n => n.id === tempId ? decryptedNote : n);
      });

      // Trigger Push Notification & In-App Notification
      const recipientId = couple.partner_1_id === user.id ? couple.partner_2_id : couple.partner_1_id;
      if (recipientId) {
        // 1. Get nickname of the recipient for the sender
      let nickname = 'partner';
      try {
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('partner_nickname')
          .eq('id', recipientId)
          .single();
        
        if (recipientProfile && (recipientProfile as any).partner_nickname) {
            nickname = (recipientProfile as any).partner_nickname;
        } else {
            // Fallback: Use Sender's First Name
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();
            if (senderProfile && (senderProfile as any).full_name) {
                nickname = (senderProfile as any).full_name.split(' ')[0];
            }
        }
      } catch (err) {
          console.warn('[CouplesContext] Failed to fetch nickname', err);
      }
      
      const displayMessage = content.length > 50 ? `New love note from your ${nickname} ❤️` : `${nickname}: ${content}`;

        // 2. Send Push
        supabase.functions.invoke('push-notifications', {
          body: {
            userId: recipientId,
            message: displayMessage,
            type: 'chat',
            noteId: (data as any).id 
          }
        }).catch(err => console.error('Push failed:', err));

        // 3. Insert In-App Notification
        supabase.from('notifications').insert({
          user_id: recipientId,
          type: 'chat',
          message: displayMessage,
          is_read: false,
          created_at: new Date().toISOString(),
        } as any).then(({ error }) => {
          if (error) console.error('In-app notification for note failed:', error);
        });
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
        let finalReactions: any = updatedReactions;
        const partnerPubKey = await fetchPartnerPublicKey();
        if (partnerPubKey) {
            finalReactions = await encryptData(updatedReactions, partnerPubKey);
        }

        const { error } = await (supabase
          .from('shared_notes')
          .update({ reactions: finalReactions } as any) as any)
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
        let finalReply = reply;
        const partnerPubKey = await fetchPartnerPublicKey();
        if (partnerPubKey) {
            finalReply = await encryptMessage(reply, partnerPubKey);
        }

        const { error } = await (supabase
          .from('shared_notes')
          .update({ reply_content: finalReply } as any) as any)
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

      console.log('[PARTNER DEBUG] currentUserId:', currentUserId);
      console.log('[PARTNER DEBUG] couple.partner_1_id:', currentCouple.partner_1_id);
      console.log('[PARTNER DEBUG] couple.partner_2_id:', currentCouple.partner_2_id);
      console.log('[PARTNER DEBUG] Resolved partnerId:', partnerId);

      // Safety guard: never fetch our own data as "partner"
      if (!partnerId || partnerId === currentUserId) {
        console.warn('[PARTNER] partnerId resolved to self or null — skipping fetch');
        return;
      }

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Partner data fetch timeout')), 8000)
      );

      const fetchPromise = async () => {
          // Run all 3 queries in PARALLEL for instant loading
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const [profileResult, settingsResult, logsResult] = await Promise.all([
              // 1. Fetch Partner Profile
              supabase
                  .from('profiles')
                  .select('id, full_name, avatar_url, role, partner_nickname')
                  .eq('id', partnerId)
                  .single(),
              // 2. Fetch User Settings (Cycle Data) — only if sharing enabled
              currentCouple.share_enabled
                  ? (supabase
                      .from('user_settings')
                      .select('avg_cycle_length, avg_period_length, last_period_start, onboarding_completed, irregular_cycle, encrypted_payload') as any)
                      .eq('user_id', partnerId)
                      .maybeSingle()
                  : Promise.resolve({ data: null }),
              // 3. Fetch Recent Logs (Last 30 days) — only if sharing enabled
              currentCouple.share_enabled
                  ? (supabase
                      .from('daily_logs')
                      .select('id, date, flow, moods, symptoms, notes, energy_level, sleep_hours, sleep_quality, encrypted_payload') as any)
                      .eq('user_id', partnerId)
                      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                      .order('date', { ascending: false })
                  : Promise.resolve({ data: null }),
          ]);

          console.log('[PARTNER DEBUG] Fetched profile:', profileResult.data?.full_name, 'avatar:', profileResult.data?.avatar_url);

          // Set profile immediately
          if (profileResult.data) setPartnerProfile(profileResult.data as any);

          // Process settings + logs
          if (currentCouple.share_enabled) {
              const settingsData = settingsResult.data;
              const logsData = logsResult.data as any[] | null;

              if (settingsData) {
                  let s = settingsData as any;
                  
                  // Decrypt partner settings
                  if (s.encrypted_payload && partnerPubKey) {
                    const decrypted = await decryptData<any>(s.encrypted_payload, partnerPubKey, user.id);
                    if (decrypted) s = { ...s, ...decrypted };
                  }

                  let effectiveStart = s.last_period_start || s.lastPeriodStart || '';
                  
                  // SMART FALLBACK: If start date is missing in settings, derive from logs
                  if (!effectiveStart && logsData && logsData.length > 0) {
                      const latestFlowLog = logsData.find((l: any) => l.flow);
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

              if (logsData) {
                  const mappedLogs = await Promise.all((logsData as any[]).map(async (l: any) => {
                      let data = { ...l };
                      if (l.encrypted_payload && partnerPubKey) {
                          const decrypted = await decryptData<any>(l.encrypted_payload, partnerPubKey, user.id);
                          if (decrypted) data = { ...data, ...decrypted };
                      }
                      return {
                          ...data,
                          energyLevel: data.energy_level || data.energyLevel,
                          sleepQuality: data.sleep_quality || data.sleepQuality,
                          sleepHours: data.sleep_hours || data.sleepHours
                      };
                  }));
                  setPartnerLogs(mappedLogs);
              }
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
          const { error } = await ((supabase
              .from('couples' as any) as any)
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
        broadcastUpdate,
        mapSettings,
        partnerPubKey
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
