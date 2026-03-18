import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Persistence will fall back to local mode until configured.'
  );
}

// Create a single supabase client for interacting with your database
// We use a proxy-like approach or null checks to prevent top-level crashes if variables are missing
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseConfigured = isConfigured;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

if (!isConfigured) {
  console.error('CRITICAL: Supabase is NOT configured. Database operations will fail.');
}
