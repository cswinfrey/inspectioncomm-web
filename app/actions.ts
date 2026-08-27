'use server';

import { createClient } from '@supabase/supabase-js';
import { sendInspectionRequestEmails } from '@/lib/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Best-effort: the request is already saved and visible in
  // /inspector/requests regardless, so a delivery failure here shouldn't
  // block the visitor from seeing a success message.
  try {
    await sendInspectionRequestEmails({
      name,
      email,
      phone: phone || null,
      vehicleType,
      vehicleYear: vehicleYear || null,
      vehicleMake: vehicleMake || null,
      vehicleModel: vehicleModel || null,
      location: location || null,
      notes: notes || null,
    });
  } catch (emailError) {
    console.error('Failed to send inspection request emails', emailError);
  }

  return {
    status: 'success',
    message: "Thanks! We'll reach out shortly to schedule your inspection.",
  };
}
