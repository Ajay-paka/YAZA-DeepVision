import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

const supabaseUrl = config.SUPABASE_URL || '';
const supabaseAnonKey = config.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. SUPABASE_URL and SUPABASE_ANON_KEY must be set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
