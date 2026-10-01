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

// Manager-only: RLS allows any authenticated inspector to update
// inspection_requests (it's a shared team inbox — see schema.sql), but
// assignment specifically is a manager decision, so that's enforced here in
// the server action rather than at the database layer.
export async function assignRequest(
  requestId: string,
  inspectorId: string | null,
  appointmentTime: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, inspector } = await requireInspector();

  if (inspector?.role !== 'manager') {
    return { ok: false, error: 'Only managers can assign inspections.' };
  }

  const { error } = await supabase
    .from('inspection_requests')
    .update({
      assigned_inspector_id: inspectorId,
      appointment_time: appointmentTime,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
