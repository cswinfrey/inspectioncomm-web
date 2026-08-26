'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Condition, InspectionChecklist, ObdScanResult } from '@/lib/inspection-checklist';

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
  const vehicleColor = String(formData.get('vehicle_color') ?? '').trim();
  const licensePlate = String(formData.get('license_plate') ?? '').trim();
  const licensePlateState = String(formData.get('license_plate_state') ?? '').trim();
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
      vehicle_color: vehicleColor || null,
      license_plate: licensePlate || null,
      license_plate_state: licensePlateState || null,
      odometer_before: vehicleMileage ? Number(vehicleMileage) : null,
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

export type ChecklistState = {
  status: 'idle' | 'error';
  message: string;
};

// For top-level columns: null (not undefined) so a cleared field actually
// overwrites the stored value instead of being dropped from the update.
function optional(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value || null;
}

function optionalInt(formData: FormData, key: string): number | null {
  const value = String(formData.get(key) ?? '').trim();
  return value ? Number(value) : null;
}

// For fields nested inside the checklist JSONB object: undefined so an
// empty field is simply omitted from that section's JSON rather than
// stored as an explicit null.
function checklistValue(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? '').trim();
  return value || undefined;
}

function checklistCondition(formData: FormData, key: string): Condition | undefined {
  return checklistValue(formData, key) as Condition | undefined;
}

function checklistObdResult(formData: FormData, key: string): ObdScanResult | undefined {
  return checklistValue(formData, key) as ObdScanResult | undefined;
}

export async function updateInspectionChecklist(
  inspectionId: string,
  _prevState: ChecklistState,
  formData: FormData
): Promise<ChecklistState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'error', message: 'Not authenticated.' };
  }

  const { data: inspector } = await supabase
    .from('inspectors')
    .select('role')
    .eq('id', user.id)
    .single();
  const isManager = inspector?.role === 'manager';

  const { data: inspection } = await supabase
    .from('inspections')
    .select('inspector_id, status')
    .eq('id', inspectionId)
    .single();

  if (!inspection) {
    return { status: 'error', message: 'Inspection not found.' };
  }

  const isOwner = inspection.inspector_id === user.id;
  if (!isOwner && !isManager) {
    return { status: 'error', message: 'Not authorized.' };
  }
  if (isOwner && !isManager && inspection.status === 'completed') {
    return {
      status: 'error',
      message: 'This inspection is completed. Ask a manager to make corrections.',
    };
  }

  const checklist: InspectionChecklist = {
    tires: {
      size: checklistValue(formData, 'tires_size'),
      condition: checklistCondition(formData, 'tires_condition'),
      tread: checklistValue(formData, 'tires_tread'),
    },
    paint: {
      condition: checklistCondition(formData, 'paint_condition'),
    },
    transmission: {
      type: checklistValue(formData, 'transmission_type'),
      condition: checklistCondition(formData, 'transmission_condition'),
    },
    suspension_steering: {
      condition: checklistCondition(formData, 'suspension_steering_condition'),
    },
    power_steering: {
      type: checklistValue(formData, 'power_steering_type'),
      condition: checklistCondition(formData, 'power_steering_condition'),
    },
    brake_fluid: {
      level: checklistValue(formData, 'brake_fluid_level'),
      condition: checklistCondition(formData, 'brake_fluid_condition'),
    },
    fluid_leaks: {
      condition: checklistCondition(formData, 'fluid_leaks_condition'),
      notes: checklistValue(formData, 'fluid_leaks_notes'),
    },
    ac_heat: {
      condition: checklistCondition(formData, 'ac_heat_condition'),
    },
    interior_electronics: {
      radio: checklistCondition(formData, 'electronics_radio'),
      heated_cooled_seats: checklistCondition(formData, 'electronics_seats'),
      sunroof: checklistCondition(formData, 'electronics_sunroof'),
      rear_tailgate: checklistCondition(formData, 'electronics_tailgate'),
    },
    obd_scan: {
      ecm: checklistObdResult(formData, 'obd_ecm'),
      tcm: checklistObdResult(formData, 'obd_tcm'),
      abs: checklistObdResult(formData, 'obd_abs'),
      srs: checklistObdResult(formData, 'obd_srs'),
      awd_4wd: checklistObdResult(formData, 'obd_awd'),
    },
  };

  const { error } = await supabase
    .from('inspections')
    .update({
      vehicle_color: optional(formData, 'vehicle_color'),
      license_plate: optional(formData, 'license_plate'),
      license_plate_state: optional(formData, 'license_plate_state'),
      engine_size: optional(formData, 'engine_size'),
      engine_cylinders: optionalInt(formData, 'engine_cylinders'),
      odometer_before: optionalInt(formData, 'odometer_before'),
      odometer_after: optionalInt(formData, 'odometer_after'),
      notes: optional(formData, 'notes'),
      synopsis: optional(formData, 'synopsis'),
      checklist,
    })
    .eq('id', inspectionId);

  if (error) {
    return { status: 'error', message: 'Could not save the checklist.' };
  }

  revalidatePath(`/inspector/inspections/${inspectionId}`);
  return { status: 'idle', message: 'Saved.' };
}
