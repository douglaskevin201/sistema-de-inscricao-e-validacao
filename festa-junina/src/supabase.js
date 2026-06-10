import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('Missing or invalid VITE_SUPABASE_URL:', supabaseUrl)
  throw new Error('VITE_SUPABASE_URL is not configured or is invalid.')
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.error('Missing VITE_SUPABASE_ANON_KEY')
  throw new Error('VITE_SUPABASE_ANON_KEY is not configured.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)