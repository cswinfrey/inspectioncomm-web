export const CONDITION_OPTIONS = ['Good', 'Fair', 'Poor', 'Not Applicable'] as const;
export type Condition = (typeof CONDITION_OPTIONS)[number];

export const OBD_SCAN_OPTIONS = ['Pass', 'Codes Found', 'Not Applicable'] as const;

// Suggested photo tags matching the checklist sections — shown as
// autocomplete suggestions, not a fixed enum, so an inspector can still
// type something more specific (e.g. "Front Left Tire").
export const MEDIA_TAG_SUGGESTIONS = [
  'VIN / Odometer',
  'Exterior / Paint',
  'Tires',
  'Engine',
  'Transmission',
  'Suspension / Steering',
  'Brakes / Fluids',
  'AC / Interior',
  'OBD Scan',
  'General',
] as const;
export type ObdScanResult = (typeof OBD_SCAN_OPTIONS)[number];

export type InspectionChecklist = {
  tires?: { size?: string; condition?: Condition; tread?: string };
  paint?: { condition?: Condition };
  transmission?: { type?: string; condition?: Condition };
  suspension_steering?: { condition?: Condition };
  power_steering?: { type?: string; condition?: Condition };
  brake_fluid?: { level?: string; condition?: Condition };
  fluid_leaks?: { condition?: Condition; notes?: string };
  ac_heat?: { condition?: Condition };
  interior_electronics?: {
    radio?: Condition;
    heated_cooled_seats?: Condition;
    sunroof?: Condition;
    rear_tailgate?: Condition;
  };
  obd_scan?: {
    ecm?: ObdScanResult;
    tcm?: ObdScanResult;
    abs?: ObdScanResult;
    srs?: ObdScanResult;
    awd_4wd?: ObdScanResult;
  };
};
