import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// Note: You must provide your actual Supabase project URL and anonymous key.
// Usually this is done via environment variables, like import.meta.env.VITE_SUPABASE_URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables are missing! Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file (locally) or Netlify settings (live).');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
