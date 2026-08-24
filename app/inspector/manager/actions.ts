'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// A duration long enough to function as "permanent" — Supabase's ban
// mechanism doesn't have a true infinite option.
const PERMANENT_BAN_DURATION = '876000h';

async function requireManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: 'Not authenticated.' };
  }

  const { data: inspector } = await supabase
    .from('inspectors')
    .select('role')
    .eq('id', user.id)
    .single();

  if (inspector?.role !== 'manager') {
    return { ok: false as const, error: 'Not authorized.' };
  }

  return { ok: true as const, userId: user.id };
}

export type AddInspectorState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export async function addInspector(
  _prevState: AddInspectorState,
  formData: FormData
): Promise<AddInspectorState> {
  const auth = await requireManager();
  if (!auth.ok) {
    return { status: 'error', message: auth.error };
  }

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const tempPassword = String(formData.get('temp_password') ?? '');

  if (!name || !email || tempPassword.length < 8) {
    return {
      status: 'error',
      message: 'Name, email, and an 8+ character temporary password are required.',
    };
  }

  const adminClient = await createAdminClient();
  const { error } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    return { status: 'error', message: error.message };
  }

  revalidatePath('/inspector/manager');
  return { status: 'success', message: `${name} was added. Share the temp password with them directly.` };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function deactivateInspector(inspectorId: string): Promise<ActionResult> {
  const auth = await requireManager();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  if (auth.userId === inspectorId) {
    return { ok: false, error: "You can't deactivate your own account." };
  }

  const adminClient = await createAdminClient();
  const { error: banError } = await adminClient.auth.admin.updateUserById(inspectorId, {
    ban_duration: PERMANENT_BAN_DURATION,
  });
  if (banError) {
    return { ok: false, error: banError.message };
  }

  const { error: updateError } = await adminClient
    .from('inspectors')
    .update({ is_active: false })
    .eq('id', inspectorId);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath('/inspector/manager');
  return { ok: true };
}

export async function reactivateInspector(inspectorId: string): Promise<ActionResult> {
  const auth = await requireManager();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const adminClient = await createAdminClient();
  const { error: banError } = await adminClient.auth.admin.updateUserById(inspectorId, {
    ban_duration: 'none',
  });
  if (banError) {
    return { ok: false, error: banError.message };
  }

  const { error: updateError } = await adminClient
    .from('inspectors')
    .update({ is_active: true })
    .eq('id', inspectorId);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath('/inspector/manager');
  return { ok: true };
}
