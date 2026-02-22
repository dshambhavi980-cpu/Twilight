export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: 'user' | 'admin' | 'partner';
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
  content: string;
  reply_content: string | null;
  reactions: Json[] | null; // e.g. [{ user_id: '...', emoji: '❤️' }]
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'audio';
  media_url?: string;
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
          role: 'user' | 'admin' | 'partner' // Added role
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: string | null
          role?: 'user' | 'admin' | 'partner' // Added role
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: string | null
          role?: 'user' | 'admin' | 'partner' // Added role
          updated_at?: string | null
        }
      }
      user_settings: {
        Row: {
          user_id: string
          avg_cycle_length: number
          avg_period_length: number
          last_period_start: string | null
          onboarding_completed: boolean
          updated_at: string | null
        }
        Insert: {
          user_id: string
          avg_cycle_length?: number
          avg_period_length?: number
          last_period_start?: string | null
          onboarding_completed?: boolean
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          avg_cycle_length?: number
          avg_period_length?: number
          last_period_start?: string | null
          onboarding_completed?: boolean
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
        Insert: Omit<Couple, 'id' | 'created_at'>
        Update: Partial<Omit<Couple, 'id' | 'created_at'>>
      }
      shared_notes: {
        Row: SharedNote
        Insert: Omit<SharedNote, 'id' | 'created_at'>
        Update: Partial<Omit<SharedNote, 'id' | 'created_at'>>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          message: string
          is_read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          message: string
          is_read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          message?: string
          is_read?: boolean
          data?: Json | null
          created_at?: string
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
        }
      }
      user_fcm_tokens: {
        Row: {
          user_id: string
          token: string
          device_type: string
          updated_at: string
        }
        Insert: {
          user_id: string
          token: string
          device_type: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          token?: string
          device_type?: string
          updated_at?: string
        }
      }
      user_keys: {
        Row: {
          user_id: string
          public_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          public_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          public_key?: string
          created_at?: string
          updated_at?: string
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
