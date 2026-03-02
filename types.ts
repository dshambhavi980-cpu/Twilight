export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'partner';
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    is_partner?: boolean;
    [key: string]: any;
  };
}

export type FlowIntensity = "spotting" | "light" | "medium" | "heavy";
export type Mood =
  | "calm"
  | "happy"
  | "energetic"
  | "frisky"
  | "swings"
  | "anxious"
  | "sad"
  | "irritated";
export type SymptomCategory = "physical" | "digestion" | "other";

export interface DailyLog {
  id: string;
  user_id: string;
  date: string; // ISO date string YYYY-MM-DD
  flow?: FlowIntensity;
  moods?: Mood[];
  symptoms?: string[]; // Array of symptom IDs
  notes?: string;
  energyLevel?: "high" | "medium" | "low";
  sleepQuality?: "good" | "fair" | "poor";
  sleepHours?: number;
}

export interface CycleSettings {
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodStart: string; // ISO date
  onboardingCompleted: boolean;
  irregularCycle: boolean;
}

export interface CyclePhase {
  currentDay: number;
  phase: "Menstrual" | "Follicular" | "Ovulation" | "Luteal";
  nextPeriodIn: number;
  isFertile: boolean;
  isOvulation: boolean;
}

export interface AppNotification {
  id: string;
  type: 'reminder' | 'period_start' | 'insight';
  message: string;
  isRead: boolean;
  timestamp: string;
}

// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Couple {
  id: string;
  partner_1_id: string;
  partner_2_id: string | null;
  pairing_code: string;
  status: 'pending' | 'active';
  partner_1_role: 'menstruator' | 'supporter';
  share_enabled: boolean;
  love_code?: string;
  love_unlocked: boolean;
  created_at: string;
}

export interface SharedNote {
  id: string;
  couple_id: string;
  sender_id: string;
  sender_device_id?: string;
  content: string;
  reply_content: string | null;
  reply_to_id: string | null;
  reactions: { user_id: string; emoji: string }[] | null;
  starred_by: string[] | null;
  pinned_by: string[] | null;
  is_forwarded: boolean;
  deleted_by: string[] | null;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'audio' | 'gif';
  media_url?: string;
  v?: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          status: string | null
          role: 'user' | 'admin' | 'partner'
          partner_nickname: string | null
          updated_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: string | null
          role?: 'user' | 'admin' | 'partner'
          partner_nickname?: string | null
          updated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: string | null
          role?: 'user' | 'admin' | 'partner'
          partner_nickname?: string | null
          updated_at?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          avg_cycle_length: number
          avg_period_length: number
          last_period_start: string | null
          onboarding_completed: boolean
          irregular_cycle: boolean
          notifications_enabled: boolean
          period_notifications: boolean
          reminder_notifications: boolean
          encrypted_payload: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          avg_cycle_length?: number
          avg_period_length?: number
          last_period_start?: string | null
          onboarding_completed?: boolean
          irregular_cycle?: boolean
          notifications_enabled?: boolean
          period_notifications?: boolean
          reminder_notifications?: boolean
          encrypted_payload?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          avg_cycle_length?: number
          avg_period_length?: number
          last_period_start?: string | null
          onboarding_completed?: boolean
          irregular_cycle?: boolean
          notifications_enabled?: boolean
          period_notifications?: boolean
          reminder_notifications?: boolean
          encrypted_payload?: string | null
          updated_at?: string | null
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          flow: string | null
          moods: string[] | null
          symptoms: string[] | null
          notes: string | null
          energy_level: 'low' | 'medium' | 'high' | null
          sleep_hours: number | null
          sleep_quality: 'poor' | 'fair' | 'good' | null
          encrypted_payload: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          flow?: string | null
          moods?: string[] | null
          symptoms?: string[] | null
          notes?: string | null
          energy_level?: 'low' | 'medium' | 'high' | null
          sleep_hours?: number | null
          sleep_quality?: 'poor' | 'fair' | 'good' | null
          encrypted_payload?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          flow?: string | null
          moods?: string[] | null
          symptoms?: string[] | null
          notes?: string | null
          energy_level?: 'low' | 'medium' | 'high' | null
          sleep_hours?: number | null
          sleep_quality?: 'poor' | 'fair' | 'good' | null
          encrypted_payload?: string | null
          created_at?: string | null
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      couples: {
        Row: Couple
        Insert: {
          id?: string
          partner_1_id: string
          partner_2_id?: string | null
          partner_1_role?: 'menstruator' | 'supporter'
          partner_2_role?: string | null
          status: 'pending' | 'active'
          pairing_code: string
          share_enabled?: boolean
          love_code?: string
          love_unlocked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          partner_1_id?: string
          partner_2_id?: string | null
          partner_1_role?: 'menstruator' | 'supporter'
          partner_2_role?: string | null
          status?: 'pending' | 'active'
          pairing_code?: string
          share_enabled?: boolean
          love_code?: string
          love_unlocked?: boolean
          created_at?: string
        }
      }
      shared_notes: {
        Row: SharedNote
        Insert: {
          id?: string
          couple_id: string
          sender_id: string
          sender_device_id?: string
          content: string
          reply_content?: string | null
          reactions?: Json[] | null
          status: 'sent' | 'delivered' | 'read'
          type: 'text' | 'image' | 'audio'
          media_url?: string
          v?: number
          created_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          sender_id?: string
          sender_device_id?: string
          content?: string
          reply_content?: string | null
          reactions?: Json[] | null
          status?: 'sent' | 'delivered' | 'read'
          type?: 'text' | 'image' | 'audio'
          media_url?: string
          v?: number
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          message: string
          is_read: boolean
          data: Json | null
          encrypted_payload: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          message: string
          is_read?: boolean
          data?: Json | null
          encrypted_payload?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          message?: string
          is_read?: boolean
          data?: Json | null
          encrypted_payload?: string | null
          created_at?: string
        }
      }
      shared_cards: {
        Row: {
          id: string
          user_id: string | null
          share_code: string
          card_data: Json
          created_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          share_code: string
          card_data: Json
          created_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          share_code?: string
          card_data?: Json
          created_at?: string | null
          expires_at?: string | null
        }
      }
      game_sessions: {
        Row: {
          id: string
          couple_id: string
          game_type: string
          board_state: Json
          current_turn: string | null
          player_x: string
          player_o: string | null
          winner: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          game_type: string
          board_state: Json
          current_turn?: string | null
          player_x: string
          player_o?: string | null
          winner?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          game_type?: string
          board_state?: Json
          current_turn?: string | null
          player_x?: string
          player_o?: string | null
          winner?: string | null
          status?: string
          created_at?: string
        }
      }
      user_fcm_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          device_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          device_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          device_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_keys: {
        Row: {
          user_id: string
          device_id: string
          public_key: string
          device_name: string | null
          last_active: string | null
          backup_identity: string | null
          backup_salt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          device_id?: string
          public_key: string
          device_name?: string | null
          last_active?: string | null
          backup_identity?: string | null
          backup_salt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          device_id?: string
          public_key?: string
          device_name?: string | null
          last_active?: string | null
          backup_identity?: string | null
          backup_salt?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      identity_backups: {
        Row: {
          user_id: string
          backup_identity: string
          backup_salt: string
          public_key: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          backup_identity: string
          backup_salt: string
          public_key?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          backup_identity?: string
          backup_salt?: string
          public_key?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      note_keys: {
        Row: {
          note_id: string
          user_id: string
          device_id: string
          encrypted_message_key: string
          created_at: string | null
          v: number | null
        }
        Insert: {
          note_id: string
          user_id: string
          device_id: string
          encrypted_message_key: string
          created_at?: string | null
          v?: number | null
        }
        Update: {
          note_id?: string
          user_id?: string
          device_id?: string
          encrypted_message_key?: string
          created_at?: string | null
          v?: number | null
        }
      }
    }
    Functions: {
      join_couple: {
        Args: {
          code_input: string
        }
        Returns: Json
      }
    }
  }
}
