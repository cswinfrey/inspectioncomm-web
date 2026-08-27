'use server';

import { requireInspector } from '@/lib/supabase/require-inspector';

const STATUSES = ['new', 'contacted', 'scheduled', 'closed'] as const;
type RequestStatus = (typeof STATUSES)[number];

export async function updateRequestStatus(
  requestId: string,
  status: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!STATUSES.includes(status as RequestStatus)) {
    return { ok: false, error: 'Invalid status.' };
  }

  const { supabase } = await requireInspector();

  const { error } = await supabase
    .from('inspection_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
