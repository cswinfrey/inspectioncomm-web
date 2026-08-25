'use server';

import { createClient } from '@supabase/supabase-js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export async function subscribeEmail(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  // Honeypot: real users never fill this (it's visually hidden); bots that
  // blindly fill every field do. Pretend success so bots don't learn to
  // skip it, but don't actually insert anything.
  if (String(formData.get('company') ?? '').trim()) {
    return { status: 'success', message: "Thanks! We'll notify you when we launch." };
  }

  const email = String(formData.get('email') ?? '').trim();

  if (!EMAIL_REGEX.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.from('signups').insert({ email });

  if (error) {
    // Unique violation: already signed up, treat as success.
    if (error.code === '23505') {
      return { status: 'success', message: "You're already on the list!" };
    }
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }

  return { status: 'success', message: "Thanks! We'll notify you when we launch." };
}
