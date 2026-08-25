'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  updateInspectionChecklist,
  type ChecklistState,
} from '@/app/inspector/inspections/actions';
import {
  CONDITION_OPTIONS,
  OBD_SCAN_OPTIONS,
  type InspectionChecklist,
} from '@/lib/inspection-checklist';

const initialState: ChecklistState = { status: 'idle', message: '' };

const inputClass =
  'px-3 py-2 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none text-sm w-full';

function TextField({ name, label, defaultValue, type = 'text' }: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
}) {
  return (
    <label className="text-xs text-gray-400 flex flex-col gap-1">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        className={inputClass}
      />
    </label>
  );
}

function ConditionField({ name, label, defaultValue }: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="text-xs text-gray-400 flex flex-col gap-1">
      {label}
      <select name={name} defaultValue={defaultValue ?? ''} className={inputClass}>
        <option value="">—</option>
        {CONDITION_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}

function ObdField({ name, label, defaultValue }: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="text-xs text-gray-400 flex flex-col gap-1">
      {label}
      <select name={name} defaultValue={defaultValue ?? ''} className={inputClass}>
        <option value="">—</option>
        {OBD_SCAN_OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Save Checklist'}
    </button>
  );
}

type CoreFields = {
  vehicle_color: string | null;
  license_plate: string | null;
  license_plate_state: string | null;
  engine_size: string | null;
  engine_cylinders: number | null;
  odometer_before: number | null;
  odometer_after: number | null;
};

export function ChecklistForm({
  inspectionId,
  core,
  checklist,
}: {
  inspectionId: string;
  core: CoreFields;
  checklist: InspectionChecklist;
}) {
  const action = updateInspectionChecklist.bind(null, inspectionId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Vehicle identity</legend>
        <TextField name="vehicle_color" label="Color" defaultValue={core.vehicle_color} />
        <TextField name="license_plate" label="License plate" defaultValue={core.license_plate} />
        <TextField
          name="license_plate_state"
          label="Plate state"
          defaultValue={core.license_plate_state}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Odometer</legend>
        <TextField
          name="odometer_before"
          label="Before inspection"
          type="number"
          defaultValue={core.odometer_before}
        />
        <TextField
          name="odometer_after"
          label="After inspection"
          type="number"
          defaultValue={core.odometer_after}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">
          Engine &amp; transmission
        </legend>
        <TextField name="engine_size" label="Engine size" defaultValue={core.engine_size} />
        <TextField
          name="engine_cylinders"
          label="Cylinders"
          type="number"
          defaultValue={core.engine_cylinders}
        />
        <TextField
          name="transmission_type"
          label="Transmission type"
          defaultValue={checklist.transmission?.type}
        />
        <ConditionField
          name="transmission_condition"
          label="Transmission condition"
          defaultValue={checklist.transmission?.condition}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Tires</legend>
        <TextField name="tires_size" label="Size" defaultValue={checklist.tires?.size} />
        <TextField name="tires_tread" label="Tread" defaultValue={checklist.tires?.tread} />
        <ConditionField
          name="tires_condition"
          label="Condition"
          defaultValue={checklist.tires?.condition}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">
          Exterior &amp; steering
        </legend>
        <ConditionField
          name="paint_condition"
          label="Paint condition"
          defaultValue={checklist.paint?.condition}
        />
        <ConditionField
          name="suspension_steering_condition"
          label="Suspension &amp; steering"
          defaultValue={checklist.suspension_steering?.condition}
        />
        <TextField
          name="power_steering_type"
          label="Power steering type"
          defaultValue={checklist.power_steering?.type}
        />
        <ConditionField
          name="power_steering_condition"
          label="Power steering condition"
          defaultValue={checklist.power_steering?.condition}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Fluids &amp; climate</legend>
        <TextField
          name="brake_fluid_level"
          label="Brake fluid level"
          defaultValue={checklist.brake_fluid?.level}
        />
        <ConditionField
          name="brake_fluid_condition"
          label="Brake fluid condition"
          defaultValue={checklist.brake_fluid?.condition}
        />
        <ConditionField
          name="fluid_leaks_condition"
          label="Fluid leaks"
          defaultValue={checklist.fluid_leaks?.condition}
        />
        <ConditionField
          name="ac_heat_condition"
          label="AC / heat"
          defaultValue={checklist.ac_heat?.condition}
        />
        <label className="text-xs text-gray-400 flex flex-col gap-1 col-span-2">
          Fluid leak notes
          <textarea
            name="fluid_leaks_notes"
            defaultValue={checklist.fluid_leaks?.notes ?? ''}
            rows={2}
            className={inputClass}
          />
        </label>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Interior electronics</legend>
        <ConditionField
          name="electronics_radio"
          label="Radio"
          defaultValue={checklist.interior_electronics?.radio}
        />
        <ConditionField
          name="electronics_seats"
          label="Heated/cooled seats"
          defaultValue={checklist.interior_electronics?.heated_cooled_seats}
        />
        <ConditionField
          name="electronics_sunroof"
          label="Sunroof"
          defaultValue={checklist.interior_electronics?.sunroof}
        />
        <ConditionField
          name="electronics_tailgate"
          label="Rear tailgate"
          defaultValue={checklist.interior_electronics?.rear_tailgate}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">OBD scan</legend>
        <ObdField name="obd_ecm" label="ECM" defaultValue={checklist.obd_scan?.ecm} />
        <ObdField name="obd_tcm" label="TCM" defaultValue={checklist.obd_scan?.tcm} />
        <ObdField name="obd_abs" label="ABS" defaultValue={checklist.obd_scan?.abs} />
        <ObdField name="obd_srs" label="SRS" defaultValue={checklist.obd_scan?.srs} />
        <ObdField
          name="obd_awd"
          label="AWD / 4WD"
          defaultValue={checklist.obd_scan?.awd_4wd}
        />
      </fieldset>

      <div>
        <SubmitButton />
        {state.message && (
          <p
            aria-live="polite"
            className={`mt-2 text-sm ${state.status === 'error' ? 'text-red-400' : 'text-green-400'}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
