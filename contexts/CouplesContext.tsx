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
}

const CouplesContext = createContext<CouplesContextType | undefined>(undefined);

export const CouplesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
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
      
      // Fetch couple
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`)
        .maybeSingle();

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

        // Realtime subscription for notes
        const channel = supabase
          .channel('shared_notes_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'shared_notes',
              filter: `couple_id=eq.${coupleData.id}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setNotes((prev) => [...prev, payload.new as SharedNote]);
              } else if (payload.eventType === 'UPDATE') {
                setNotes((prev) =>
                  prev.map((n) => (n.id === payload.new.id ? (payload.new as SharedNote) : n))
                );
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    } catch (error) {
      console.error('Error fetching couple data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

    const { error } = await supabase.from('shared_notes').insert({
      couple_id: couple.id,
      sender_id: user.id,
      content,
    });

    if (error) throw error;
  };

  const addReaction = async (noteId: string, emoji: string) => {
      if(!user) return;
      const note = notes.find(n => n.id === noteId);
      if(!note) return;

      const currentReactions = note.reactions || [];
      // Simple toggle or append logic: usually users just add reactions
      // We will define structure as object { user_id: string, emoji: string }
      // But types said Record<string, string>. Let's stick to Record for simplicity?
      // Actually let's just make it simple: array of objects.
      // Postgres stores JSONB.
      
      const newReaction = { user_id: user.id, emoji };
      const updatedReactions = [...currentReactions, newReaction];

      const { error } = await supabase
        .from('shared_notes')
        .update({ reactions: updatedReactions })
        .eq('id', noteId);
      
      if(error) throw error;
  };
  
    const replyToNote = async (noteId: string, reply: string) => {
      if(!user) return;
      
      const { error } = await supabase
        .from('shared_notes')
        .update({ reply_content: reply })
        .eq('id', noteId);
      
      if(error) throw error;
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
        replyToNote
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
