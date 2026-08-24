import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey } from '@/lib/azure-secrets';

// Bypasses RLS entirely — only use for operations that genuinely need it
// (creating/banning auth users via the Admin API), and only after verifying
// the caller is a manager. Never expose this client or its key to the client.
export async function createAdminClient() {
  const serviceRoleKey = await getSupabaseServiceRoleKey();

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
