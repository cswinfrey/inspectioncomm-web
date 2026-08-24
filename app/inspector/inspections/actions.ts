'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CreateInspectionState = {
  status: 'idle' | 'error';
  message: string;
};

export async function createInspection(
  _prevState: CreateInspectionState,
  formData: FormData
): Promise<CreateInspectionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/inspector/login');
  }

  const customerName = String(formData.get('customer_name') ?? '').trim();
  const customerEmail = String(formData.get('customer_email') ?? '').trim();
  const vehicleVin = String(formData.get('vehicle_vin') ?? '').trim();
  const vehicleYear = String(formData.get('vehicle_year') ?? '').trim();
  const vehicleMake = String(formData.get('vehicle_make') ?? '').trim();
  const vehicleModel = String(formData.get('vehicle_model') ?? '').trim();
  const vehicleMileage = String(formData.get('vehicle_mileage') ?? '').trim();
  const inspectionDate = String(formData.get('inspection_date') ?? '').trim();
  const inspectionType = String(formData.get('inspection_type') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!customerName || !customerEmail || !vehicleMake || !vehicleModel || !inspectionDate) {
    return { status: 'error', message: 'Please fill in all required fields.' };
  }

  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle();

  let customerId = existingCustomer?.id as string | undefined;

  if (!customerId) {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({ name: customerName, email: customerEmail })
      .select('id')
      .single();

    if (customerError) {
      return { status: 'error', message: 'Could not save the customer.' };
    }
    customerId = newCustomer.id;
  }

  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .insert({
      inspector_id: user.id,
      customer_id: customerId,
      inspection_type: inspectionType || 'pre-purchase',
      vehicle_vin: vehicleVin || null,
      vehicle_year: vehicleYear ? Number(vehicleYear) : null,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      vehicle_mileage: vehicleMileage ? Number(vehicleMileage) : null,
      inspection_date: inspectionDate,
      notes: notes || null,
    })
    .select('id')
    .single();

  if (inspectionError) {
    return { status: 'error', message: 'Could not create the inspection.' };
  }

  redirect(`/inspector/inspections/${inspection.id}`);
}

export type StatusResult = { ok: true } | { ok: false; error: string };

export async function setInspectionStatus(
  inspectionId: string,
  status: 'in_progress' | 'completed'
): Promise<StatusResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Not authenticated.' };
  }

  const { error } = await supabase
    .from('inspections')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', inspectionId);

  if (error) {
    return { ok: false, error: 'Could not update status.' };
  }

  revalidatePath(`/inspector/inspections/${inspectionId}`);
  revalidatePath('/inspector/dashboard');
  revalidatePath('/inspector/manager');
  return { ok: true };
}
