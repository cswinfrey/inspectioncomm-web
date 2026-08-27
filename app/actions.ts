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

export type RequestInspectionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export async function submitInspectionRequest(
  _prevState: RequestInspectionState,
  formData: FormData
): Promise<RequestInspectionState> {
  // Honeypot, same pattern as subscribeEmail above.
  if (String(formData.get('company') ?? '').trim()) {
    return {
      status: 'success',
      message: "Thanks! We'll reach out shortly to schedule your inspection.",
    };
  }

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const vehicleType = String(formData.get('vehicle_type') ?? '').trim();
  const vehicleYear = String(formData.get('vehicle_year') ?? '').trim();
  const vehicleMake = String(formData.get('vehicle_make') ?? '').trim();
  const vehicleModel = String(formData.get('vehicle_model') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!name) {
    return { status: 'error', message: 'Enter your name.' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }
  if (!vehicleType) {
    return { status: 'error', message: 'Select the type of vehicle.' };
  }

  const year = vehicleYear ? Number(vehicleYear) : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.from('inspection_requests').insert({
    name,
    email,
    phone: phone || null,
    vehicle_type: vehicleType,
    vehicle_year: year && !Number.isNaN(year) ? year : null,
    vehicle_make: vehicleMake || null,
    vehicle_model: vehicleModel || null,
    location: location || null,
    notes: notes || null,
  });

  if (error) {
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }

  return {
    status: 'success',
    message: "Thanks! We'll reach out shortly to schedule your inspection.",
  };
}
