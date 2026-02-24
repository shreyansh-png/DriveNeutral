import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// Note: You must provide your actual Supabase project URL and anonymous key.
// Usually this is done via environment variables, like import.meta.env.VITE_SUPABASE_URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
