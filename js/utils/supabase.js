/**
 * Supabase Client Wrapper
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check if valid Supabase credentials are set
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return (
    import.meta.env?.VITE_SUPABASE_URL &&
    import.meta.env?.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  );
}
