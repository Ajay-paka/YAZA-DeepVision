import 'dotenv/config';

export const config = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  YOUTUBE_COOKIE: process.env.YOUTUBE_COOKIE,
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export function validateConfig() {
  const missing = [];
  if (!config.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!config.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
  }
  
  return missing.length === 0;
}
