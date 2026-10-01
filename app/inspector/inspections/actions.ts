'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Condition, InspectionChecklist, ObdScanResult } from '@/lib/inspection-checklist';
import type {
  CoolantCondition,
  WarrantyChecklist,
  YesNo,
  YesNoDetail,
} from '@/lib/warranty-checklist';

// Shared by any action that edits an inspection's checklist/media: the
// owning inspector can edit while in_progress; a manager can always edit;
// no one else can. Once completed, only a manager may still make changes.
export async function checkInspectionEditPermission(
  supabase: SupabaseClient,
  userId: string,
  inspectionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: inspector } = await supabase
    .from('inspectors')
    .select('role')
    .eq('id', userId)
    .single();
  const isManager = inspector?.role === 'manager';

  const { data: inspection } = await supabase
    .from('inspections')
    .select('inspector_id, status')
    .eq('id', inspectionId)
    .single();

  if (!inspection) {
    return { ok: false, error: 'Inspection not found.' };
  }

  const isOwner = inspection.inspector_id === userId;
  if (!isOwner && !isManager) {
    return { ok: false, error: 'Not authorized.' };
  }
  if (isOwner && !isManager && inspection.status === 'completed') {
    return {
      ok: false,
      error: 'This inspection is completed. Ask a manager to make corrections.',
    };
  }
  return { ok: true };
}

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

  const permission = await checkInspectionEditPermission(supabase, user.id, inspectionId);
  if (!permission.ok) {
    return { status: 'error', message: permission.error };
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

  const fuelTypeChoice = optional(formData, 'fuel_type_choice');
  const fuelType =
    fuelTypeChoice === 'Other' ? optional(formData, 'fuel_type_other') : fuelTypeChoice;

  const { error } = await supabase
    .from('inspections')
    .update({
      vehicle_color: optional(formData, 'vehicle_color'),
      license_plate: optional(formData, 'license_plate'),
      license_plate_state: optional(formData, 'license_plate_state'),
      fuel_type: fuelType,
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

function checklistYesNo(formData: FormData, key: string): YesNo | undefined {
  return checklistValue(formData, key) as YesNo | undefined;
}

function checklistYesNoDetail(formData: FormData, key: string): YesNoDetail | undefined {
  const value = checklistYesNo(formData, `${key}_value`);
  const details = checklistValue(formData, `${key}_details`);
  if (!value && !details) return undefined;
  return { value, details };
}

export async function updateWarrantyChecklist(
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

  const permission = await checkInspectionEditPermission(supabase, user.id, inspectionId);
  if (!permission.ok) {
    return { status: 'error', message: permission.error };
  }

  const warrantyChecklist: WarrantyChecklist = {
    inspector_name: checklistValue(formData, 'inspector_name'),
    inspector_phone: checklistValue(formData, 'inspector_phone'),
    repair_order_number: checklistValue(formData, 'repair_order_number'),

    vehicle_body_type: checklistValue(formData, 'vehicle_body_type'),
    drivetrain: checklistValue(formData, 'drivetrain'),
    tire_size_oem: checklistValue(formData, 'tire_size_oem'),
    tire_size_actual: checklistValue(formData, 'tire_size_actual'),

    labor_rate: checklistValue(formData, 'labor_rate'),
    labor_rate_type: checklistValue(formData, 'labor_rate_type'),

    modifications: checklistYesNoDetail(formData, 'modifications'),
    signs_of_collision: checklistYesNoDetail(formData, 'signs_of_collision'),
    signs_of_abuse_neglect: checklistYesNoDetail(formData, 'signs_of_abuse_neglect'),
    commercial_signage: checklistYesNoDetail(formData, 'commercial_signage'),
    hitch: checklistYesNoDetail(formData, 'hitch'),

    engine_fluid_condition: checklistCondition(formData, 'engine_fluid_condition'),
    engine_leaks: checklistYesNoDetail(formData, 'engine_leaks'),
    transmission_fluid_level: checklistCondition(formData, 'transmission_fluid_level'),
    transmission_leaks: checklistYesNoDetail(formData, 'transmission_leaks'),
    power_steering_fluid_condition: checklistCondition(formData, 'power_steering_fluid_condition'),
    coolant_level_condition: checklistValue(formData, 'coolant_level_condition') as
      | CoolantCondition
      | undefined,
    coolant_leaks: checklistYesNoDetail(formData, 'coolant_leaks'),
    hoses_condition: checklistCondition(formData, 'hoses_condition'),
    belts_condition: checklistCondition(formData, 'belts_condition'),
    air_filter_condition: checklistCondition(formData, 'air_filter_condition'),

    teardown_observed: checklistYesNoDetail(formData, 'teardown_observed'),
    tsbs_presented: checklistYesNoDetail(formData, 'tsbs_presented'),

    inspector_observations: checklistValue(formData, 'inspector_observations'),
    inspector_cause_of_failure: checklistValue(formData, 'inspector_cause_of_failure'),
    verified_failures: checklistYesNo(formData, 'verified_failures'),
    verbal_called_in: checklistYesNo(formData, 'verbal_called_in'),
    person_spoken_with: checklistValue(formData, 'person_spoken_with'),
  };

  const fuelTypeChoice = optional(formData, 'fuel_type_choice');
  const fuelType =
    fuelTypeChoice === 'Other' ? optional(formData, 'fuel_type_other') : fuelTypeChoice;

  const { error } = await supabase
    .from('inspections')
    .update({
      license_plate: optional(formData, 'license_plate'),
      license_plate_state: optional(formData, 'license_plate_state'),
      fuel_type: fuelType,
      engine_size: optional(formData, 'engine_size'),
      engine_cylinders: optionalInt(formData, 'engine_cylinders'),
      warranty_checklist: warrantyChecklist,
    })
    .eq('id', inspectionId);

  if (error) {
    return { status: 'error', message: 'Could not save the warranty checklist.' };
  }

  revalidatePath(`/inspector/inspections/${inspectionId}`);
  return { status: 'idle', message: 'Saved.' };
}
