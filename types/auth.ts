import { User as SupabaseUser } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  isGuest: boolean;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: SupabaseUser | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthMode = 'login' | 'register' | 'guest';
