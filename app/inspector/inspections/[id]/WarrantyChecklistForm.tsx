'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  updateWarrantyChecklist,
  type ChecklistState,
} from '@/app/inspector/inspections/actions';
import { CONDITION_OPTIONS, FUEL_TYPE_OPTIONS } from '@/lib/inspection-checklist';
import {
  VEHICLE_BODY_TYPES,
  DRIVETRAIN_TYPES,
  LABOR_RATE_TYPES,
  YES_NO_OPTIONS,
  COOLANT_CONDITION_OPTIONS,
  type WarrantyChecklist,
  type YesNoDetail,
} from '@/lib/warranty-checklist';

const initialState: ChecklistState = { status: 'idle', message: '' };

const inputClass =
  'px-3 py-2 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none text-sm w-full';

function TextField({
  name,
  label,
  defaultValue,
  type = 'text',
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
}) {
  return (
    <label className="text-xs text-gray-400 flex flex-col gap-1">
      {label}
      <input type={type} name={name} defaultValue={defaultValue ?? ''} className={inputClass} />
    </label>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <label className="text-xs text-gray-400 flex flex-col gap-1">
      {label}
      <select name={name} defaultValue={defaultValue ?? ''} className={inputClass}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConditionField({
  name,
  label,
  defaultValue,
  options = CONDITION_OPTIONS,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options?: readonly string[];
}) {
  return <SelectField name={name} label={label} options={options} defaultValue={defaultValue} />;
}

function YesNoDetailField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: YesNoDetail;
}) {
  const [value, setValue] = useState(defaultValue?.value ?? '');
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 flex flex-col gap-1">
        {label}
        <select
          name={`${name}_value`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
        >
          <option value="">—</option>
          {YES_NO_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      {value === 'Yes' && (
        <input
          type="text"
          name={`${name}_details`}
          placeholder="Describe what was found"
          defaultValue={defaultValue?.details ?? ''}
          className={inputClass}
        />
      )}
    </div>
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
  license_plate: string | null;
  license_plate_state: string | null;
  fuel_type: string | null;
  engine_size: string | null;
  engine_cylinders: number | null;
};

export function WarrantyChecklistForm({
  inspectionId,
  core,
  checklist,
  defaultInspectorName,
  defaultInspectorPhone,
}: {
  inspectionId: string;
  core: CoreFields;
  checklist: WarrantyChecklist;
  defaultInspectorName: string;
  defaultInspectorPhone: string;
}) {
  const action = updateWarrantyChecklist.bind(null, inspectionId);
  const [state, formAction] = useActionState(action, initialState);

  const isKnownFuel = (FUEL_TYPE_OPTIONS as readonly string[]).includes(core.fuel_type ?? '');
  const [fuelChoice, setFuelChoice] = useState(() => {
    if (isKnownFuel) return core.fuel_type as string;
    return core.fuel_type ? 'Other' : '';
  });
  const isElectric = fuelChoice === 'Electric';

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">
          Appointment information
        </legend>
        <TextField
          name="inspector_name"
          label="Inspector name"
          defaultValue={checklist.inspector_name ?? defaultInspectorName}
        />
        <TextField
          name="inspector_phone"
          label="Inspector phone"
          defaultValue={checklist.inspector_phone ?? defaultInspectorPhone}
        />
        <TextField
          name="repair_order_number"
          label="Repair order number"
          defaultValue={checklist.repair_order_number}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Vehicle</legend>
        <SelectField
          name="vehicle_body_type"
          label="Vehicle type"
          options={VEHICLE_BODY_TYPES}
          defaultValue={checklist.vehicle_body_type}
        />
        <SelectField
          name="drivetrain"
          label="Drivetrain"
          options={DRIVETRAIN_TYPES}
          defaultValue={checklist.drivetrain}
        />
        <TextField name="license_plate" label="License plate" defaultValue={core.license_plate} />
        <TextField
          name="license_plate_state"
          label="Plate state"
          defaultValue={core.license_plate_state}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 flex flex-col gap-1">
            Fuel type
            <select
              name="fuel_type_choice"
              value={fuelChoice}
              onChange={(e) => setFuelChoice(e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {FUEL_TYPE_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </label>
          {fuelChoice === 'Other' && (
            <input
              type="text"
              name="fuel_type_other"
              placeholder="Specify fuel type"
              defaultValue={isKnownFuel ? '' : (core.fuel_type ?? '')}
              className={inputClass}
            />
          )}
        </div>

        {!isElectric && (
          <>
            <TextField name="engine_size" label="Engine size (L)" defaultValue={core.engine_size} />
            <TextField
              name="engine_cylinders"
              label="Cylinders"
              type="number"
              defaultValue={core.engine_cylinders}
            />
          </>
        )}

        <TextField name="tire_size_oem" label="Tire size (OEM)" defaultValue={checklist.tire_size_oem} />
        <TextField
          name="tire_size_actual"
          label="Tire size (actual)"
          defaultValue={checklist.tire_size_actual}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Labor rate</legend>
        <TextField name="labor_rate" label="Labor rate" defaultValue={checklist.labor_rate} />
        <SelectField
          name="labor_rate_type"
          label="Verbal or posted?"
          options={LABOR_RATE_TYPES}
          defaultValue={checklist.labor_rate_type}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Vehicle history</legend>
        <YesNoDetailField
          name="modifications"
          label="Modifications"
          defaultValue={checklist.modifications}
        />
        <YesNoDetailField
          name="signs_of_collision"
          label="Signs of collision"
          defaultValue={checklist.signs_of_collision}
        />
        <YesNoDetailField
          name="signs_of_abuse_neglect"
          label="Signs of abuse or neglect"
          defaultValue={checklist.signs_of_abuse_neglect}
        />
        <YesNoDetailField
          name="commercial_signage"
          label="Commercial signage"
          defaultValue={checklist.commercial_signage}
        />
        <YesNoDetailField name="hitch" label="Hitch" defaultValue={checklist.hitch} />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="text-gray-300 font-semibold mb-1 col-span-2">Fluids &amp; mechanical</legend>
        {!isElectric && (
          <>
            <ConditionField
              name="engine_fluid_condition"
              label="Engine oil level &amp; condition"
              defaultValue={checklist.engine_fluid_condition}
            />
            <YesNoDetailField
              name="engine_leaks"
              label="Engine leaks present?"
              defaultValue={checklist.engine_leaks}
            />
            <ConditionField
              name="transmission_fluid_level"
              label="Transmission fluid &amp; level"
              defaultValue={checklist.transmission_fluid_level}
            />
            <YesNoDetailField
              name="transmission_leaks"
              label="Transmission leaks present?"
              defaultValue={checklist.transmission_leaks}
            />
            <ConditionField
              name="power_steering_fluid_condition"
              label="Power steering fluid condition"
              defaultValue={checklist.power_steering_fluid_condition}
            />
          </>
        )}
        <ConditionField
          name="coolant_level_condition"
          label="Coolant level &amp; condition"
          options={COOLANT_CONDITION_OPTIONS}
          defaultValue={checklist.coolant_level_condition}
        />
        <YesNoDetailField
          name="coolant_leaks"
          label="Coolant leaks present?"
          defaultValue={checklist.coolant_leaks}
        />
        <ConditionField
          name="hoses_condition"
          label="Hoses condition"
          defaultValue={checklist.hoses_condition}
        />
        <ConditionField
          name="belts_condition"
          label="Belts condition"
          defaultValue={checklist.belts_condition}
        />
        <ConditionField
          name="air_filter_condition"
          label="Air filter condition"
          defaultValue={checklist.air_filter_condition}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-gray-300 font-semibold mb-1">Diagnostic</legend>
        <div className="grid grid-cols-2 gap-3">
          <YesNoDetailField
            name="teardown_observed"
            label="Teardown observed?"
            defaultValue={checklist.teardown_observed}
          />
          <YesNoDetailField
            name="tsbs_presented"
            label="TSBs presented?"
            defaultValue={checklist.tsbs_presented}
          />
        </div>
        <label className="text-xs text-gray-400 flex flex-col gap-1">
          Inspector observations
          <textarea
            name="inspector_observations"
            defaultValue={checklist.inspector_observations ?? ''}
            rows={3}
            className={inputClass}
          />
        </label>
        <label className="text-xs text-gray-400 flex flex-col gap-1">
          Inspector cause of failure
          <textarea
            name="inspector_cause_of_failure"
            defaultValue={checklist.inspector_cause_of_failure ?? ''}
            rows={3}
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            name="verified_failures"
            label="Verified failures?"
            options={YES_NO_OPTIONS}
            defaultValue={checklist.verified_failures}
          />
          <VerbalCalledInField defaultValue={checklist.verbal_called_in} personSpokenWith={checklist.person_spoken_with} />
        </div>
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

function VerbalCalledInField({
  defaultValue,
  personSpokenWith,
}: {
  defaultValue?: string;
  personSpokenWith?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? '');
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 flex flex-col gap-1">
        Verbal called in?
        <select
          name="verbal_called_in"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
        >
          <option value="">—</option>
          {YES_NO_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      {value === 'Yes' && (
        <input
          type="text"
          name="person_spoken_with"
          placeholder="Name of person spoken with"
          defaultValue={personSpokenWith ?? ''}
          className={inputClass}
        />
      )}
    </div>
  );
}
