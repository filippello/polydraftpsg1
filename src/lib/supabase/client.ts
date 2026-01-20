import { createBrowserClient } from '@supabase/ssr';

// Create a Supabase client for use in the browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
