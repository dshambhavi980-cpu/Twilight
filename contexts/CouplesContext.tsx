import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Couple, SharedNote } from '../types';

interface CouplesContextType {
  couple: Couple | null;
  notes: SharedNote[];
  isLoading: boolean;
  createNote: (content: string) => Promise<void>;
  generatePairingCode: () => Promise<string>;
  joinCouple: (code: string) => Promise<void>;
  addReaction: (noteId: string, emoji: string) => Promise<void>;
  replyToNote: (noteId: string, reply: string) => Promise<void>;
  markAsRead: (noteIds: string[]) => Promise<void>;
  setIsChatOpen: (isOpen: boolean) => void;
}

const CouplesContext = createContext<CouplesContextType | undefined>(undefined);

export const CouplesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      // Fetch couple data for all users including admins
      fetchCoupleData();
    } else {
      setCouple(null);
      setNotes([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchCoupleData = async () => {
    try {
      if (!user) return;
      
      // For admin users, fetch any couple they created (partner_1)
      // For regular users, fetch couple where they are partner_1 or partner_2
      const query = user.role === 'admin' 
        ? supabase.from('couples').select('*').eq('partner_1_id', user.id).maybeSingle()
        : supabase.from('couples').select('*').or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`).maybeSingle();
      
      const { data: coupleData, error: coupleError } = await query;

      if (coupleError) throw coupleError;
      setCouple(coupleData);

      if (coupleData) {
        // Fetch notes
        const { data: notesData, error: notesError } = await supabase
          .from('shared_notes')
          .select('*')
          .eq('couple_id', coupleData.id)
          .order('created_at', { ascending: true });

        if (notesError) throw notesError;
        setNotes(notesData || []);
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
      }
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
          table: 'shared_notes',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
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
              const newStatus = isChatOpen ? 'read' : 'delivered';
              supabase
                .from('shared_notes')
                .update({ status: newStatus })
                .eq('id', newNote.id)
                .then();
            }
          } else if (payload.eventType === 'UPDATE') {
             const updatedNote = payload.new as SharedNote;
             console.log('Received UPDATE:', updatedNote); 
             setNotes((prev) =>
               prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
             );
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [couple?.id, user?.id, isChatOpen]);


  const generatePairingCode = async () => {
    if (!user) throw new Error('Not authenticated');
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Check if user already has a pending couple (delete/reset optional, here we assuming creating fresh)
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

    const { data, error } = await supabase
      .rpc('join_couple', { code_input: code });

    if (error) throw error;
    
    // The RPC returns the couple object directly
    // Ideally we should cast it or validate it
    setCouple(data as unknown as Couple);
  };

  const createNote = async (content: string) => {
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
      created_at: new Date().toISOString(),
    };
    
    setNotes((prev) => [...prev, optimisticNote]);

    try {
      const { data, error } = await supabase.from('shared_notes').insert({
        couple_id: couple.id,
        sender_id: user.id,
        content,
      }).select().single();

      if (error) throw error;
      
      // Replace temp note with real note from DB
      setNotes((prev) => prev.map(n => n.id === tempId ? data : n));
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

  return (
    <CouplesContext.Provider
      value={{
        couple,
        notes,
        isLoading,
        createNote,
        generatePairingCode,
        joinCouple,
        addReaction,
        replyToNote,
        markAsRead,
        setIsChatOpen
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
