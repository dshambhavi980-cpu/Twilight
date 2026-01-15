export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
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
  date: string; // ISO date string YYYY-MM-DD
  flow?: FlowIntensity;
  moods?: Mood[];
  symptoms?: string[]; // Array of symptom IDs
  notes?: string;
  energyLevel?: "high" | "medium" | "low";
  sleepQuality?: "good" | "fair" | "poor";
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
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: string | null
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
    }
  }
}
