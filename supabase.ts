
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe access to process.env
const getEnv = (key: string): string | undefined => {
  try {
    return (process.env as any)[key];
  } catch (e) {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://zhetkmhjanhmdcuiskpj.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZXRrbWhqYW5obWRjdWlza3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTEzNTAsImV4cCI6MjA4MjU4NzM1MH0.pltcNrKkg52hjFeIHP3W_yC8lkieLtj0Jg7i1wbpN3A';

// Check if we are still using placeholders or if the URL is clearly invalid
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-url') &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

// Initialize client safely. We wrap it in a function to catch errors if the URL is invalid.
let supabaseInstance: SupabaseClient | null = null;
try {
  if (supabaseUrl.startsWith('https://')) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.error("Critical: Failed to initialize Supabase client. Check your SUPABASE_URL format.", e);
}

export const supabase = supabaseInstance!;

/**
 * Helper to test the connection by attempting a simple select
 */
export const testConnection = async () => {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase configuration is missing or invalid. URL must start with "https://".'
      };
    }
    if (!supabaseInstance) {
        return { success: false, message: 'Supabase client failed to initialize. Check URL format.' };
    }

    // Attempt to query the invitations table (even if it returns 0 rows)
    const { error } = await supabase.from('invitations').select('count').limit(1);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
