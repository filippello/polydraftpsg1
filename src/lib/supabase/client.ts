import { createBrowserClient } from '@supabase/ssr';

// Create a Supabase client for use in the browser
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  console.log('[Supabase Client] URL:', url ? `${url.substring(0, 30)}...` : 'MISSING');
  console.log('[Supabase Client] Key:', key ? `${key.substring(0, 20)}...` : 'MISSING');

  return createBrowserClient(url, key);
}

// Singleton instance for client-side use
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabase should only be called on the client side');
  }

  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}
