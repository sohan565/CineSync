import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/auth';
import { LoginInput, RegisterInput, GuestInput } from '@/lib/validations/auth';

const GUEST_KEY_ID = 'cinesync_guest_id';
const GUEST_KEY_NAME = 'cinesync_guest_name';

export class AuthService {
  private static supabase = createClient();

  /**
   * Register a new user with Email & Password
   */
  static async register(input: RegisterInput): Promise<UserProfile> {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          display_name: input.displayName,
        },
      },
    });

    if (error) {
      throw new Error(this.formatErrorMessage(error.message));
    }

    if (!data.user) {
      throw new Error('Registration failed. Please try again.');
    }

    return {
      id: data.user.id,
      displayName: input.displayName,
      email: data.user.email || null,
      avatarUrl: null,
      isGuest: false,
      createdAt: data.user.created_at,
    };
  }

  /**
   * Log in an existing user with Email & Password
   */
  static async login(input: LoginInput): Promise<UserProfile> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new Error(this.formatErrorMessage(error.message));
    }

    if (!data.user) {
      throw new Error('Login failed. Invalid credentials.');
    }

    const displayName =
      data.user.user_metadata?.display_name ||
      data.user.email?.split('@')[0] ||
      'Member User';

    return {
      id: data.user.id,
      displayName,
      email: data.user.email || null,
      avatarUrl: data.user.user_metadata?.avatar_url || null,
      isGuest: false,
      createdAt: data.user.created_at,
    };
  }

  /**
   * Create or update Guest Session
   */
  static async setGuestProfile(input: GuestInput): Promise<UserProfile> {
    let guestId = localStorage.getItem(GUEST_KEY_ID);
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem(GUEST_KEY_ID, guestId);
    }
    localStorage.setItem(GUEST_KEY_NAME, input.displayName);

    return {
      id: guestId,
      displayName: input.displayName,
      email: null,
      avatarUrl: null,
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get Current Session (Supabase Auth or Local Guest)
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data } = await this.supabase.auth.getUser();
      if (data?.user) {
        return {
          id: data.user.id,
          displayName:
            data.user.user_metadata?.display_name ||
            data.user.email?.split('@')[0] ||
            'Member User',
          email: data.user.email || null,
          avatarUrl: data.user.user_metadata?.avatar_url || null,
          isGuest: false,
          createdAt: data.user.created_at,
        };
      }
    } catch (err) {
      console.warn('Supabase Auth session check bypassed:', err);
    }

    // Fallback to local Guest profile
    const guestId = localStorage.getItem(GUEST_KEY_ID);
    const guestName = localStorage.getItem(GUEST_KEY_NAME);

    if (guestId && guestName) {
      return {
        id: guestId,
        displayName: guestName,
        email: null,
        avatarUrl: null,
        isGuest: true,
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Sign Out
   */
  static async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    localStorage.removeItem(GUEST_KEY_NAME);
  }

  /**
   * Format Supabase error messages into user-friendly alerts
   */
  private static formatErrorMessage(message: string): string {
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('User already registered')) {
      return 'An account with this email address already exists.';
    }
    if (message.includes('Password should be at least')) {
      return 'Password does not meet minimum length requirements.';
    }
    return message;
  }
}
