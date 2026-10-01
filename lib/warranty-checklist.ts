import type { Condition } from '@/lib/inspection-checklist';

export const INSPECTION_TYPES = [
  { value: 'pre-purchase', label: 'Pre-Purchase Inspection' },
  { value: 'warranty', label: 'Warranty Inspection' },
] as const;

export const VEHICLE_BODY_TYPES = ['Sedan', 'Coupe', 'Convertible', 'Truck', 'Other'] as const;
export const DRIVETRAIN_TYPES = ['FWD', 'RWD', 'AWD', '4x4'] as const;
export const LABOR_RATE_TYPES = ['Verbal', 'Posted'] as const;
export const YES_NO_OPTIONS = ['Yes', 'No'] as const;
export type YesNo = (typeof YES_NO_OPTIONS)[number];

// Coolant gets one extra option on top of the normal Good/Fair/Poor/Not
// Applicable scale — on some vehicles it's genuinely not reachable without
// teardown, which is a different claim than "not applicable."
export const COOLANT_CONDITION_OPTIONS = ['Good', 'Fair', 'Poor', 'Not Applicable', 'Inaccessible'] as const;
export type CoolantCondition = (typeof COOLANT_CONDITION_OPTIONS)[number];

// A yes/no presence check with a free-text follow-up shown only when "Yes"
// (e.g. "Modifications present?" -> "Yes" -> describe what was found).
export type YesNoDetail = { value?: YesNo; details?: string };

export type WarrantyChecklist = {
  inspector_name?: string;
  inspector_phone?: string;
  repair_order_number?: string;

  vehicle_body_type?: string;
  drivetrain?: string;
  tire_size_oem?: string;
  tire_size_actual?: string;

  labor_rate?: string;
  labor_rate_type?: string;

  modifications?: YesNoDetail;
  signs_of_collision?: YesNoDetail;
  signs_of_abuse_neglect?: YesNoDetail;
  commercial_signage?: YesNoDetail;
  hitch?: YesNoDetail;

  // Engine/transmission/power-steering fields are hidden in the UI (not
  // just NA'd) when fuel_type is Electric — see ElectricAware in
  // WarrantyChecklistForm.tsx. Coolant stays visible either way.
  engine_fluid_condition?: Condition;
  engine_leaks?: YesNoDetail;
  transmission_fluid_level?: Condition;
  transmission_leaks?: YesNoDetail;
  power_steering_fluid_condition?: Condition;
  coolant_level_condition?: CoolantCondition;
  coolant_leaks?: YesNoDetail;
  hoses_condition?: Condition;
  belts_condition?: Condition;
  air_filter_condition?: Condition;

  teardown_observed?: YesNoDetail;
  tsbs_presented?: YesNoDetail;

  inspector_observations?: string;
  inspector_cause_of_failure?: string;
  verified_failures?: YesNo;
  verbal_called_in?: YesNo;
  person_spoken_with?: string;
};
