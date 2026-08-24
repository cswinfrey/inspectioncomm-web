'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ChangePasswordState = {
  status: 'idle' | 'error';
  message: string;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/inspector/login');
  }

  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirm_password') ?? '');

  if (password.length < 8) {
    return { status: 'error', message: 'Password must be at least 8 characters.' };
  }
  if (password !== confirmPassword) {
    return { status: 'error', message: 'Passwords do not match.' };
  }

  const { error: updateAuthError } = await supabase.auth.updateUser({ password });
  if (updateAuthError) {
    return { status: 'error', message: updateAuthError.message };
  }

  const { error: updateProfileError } = await supabase
    .from('inspectors')
    .update({ must_change_password: false })
    .eq('id', user.id);
  if (updateProfileError) {
    return { status: 'error', message: 'Password changed, but could not update your profile.' };
  }

  redirect('/inspector/dashboard');
}
