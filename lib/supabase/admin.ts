import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey } from '@/lib/azure-secrets';

// Bypasses RLS entirely — only use for operations that genuinely need it:
// creating/banning auth users via the Admin API (verify the caller is a
// manager first), or the public customer report page, whose access control
// is possession of an unguessable token rather than RLS. Never expose this
// client or its key to the client.
export async function createAdminClient() {
  const serviceRoleKey = await getSupabaseServiceRoleKey();

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
