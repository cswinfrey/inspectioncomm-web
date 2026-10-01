import type { WarrantyChecklist, YesNoDetail } from '@/lib/warranty-checklist';

type CoreFields = {
  license_plate: string | null;
  license_plate_state: string | null;
  fuel_type: string | null;
  engine_size: string | null;
  engine_cylinders: number | null;
};

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-white">{value ?? '—'}</dd>
    </div>
  );
}

function YesNoField({ label, value }: { label: string; value: YesNoDetail | undefined }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-white">
        {value?.value ?? '—'}
        {value?.value === 'Yes' && value.details && (
          <span className="block text-gray-400 text-xs mt-0.5">{value.details}</span>
        )}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-gray-500 text-xs uppercase tracking-wide mb-2">{title}</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm">{children}</dl>
    </div>
  );
}

export function WarrantyChecklistDisplay({
  core,
  checklist,
}: {
  core: CoreFields;
  checklist: WarrantyChecklist;
}) {
  const isElectric = core.fuel_type === 'Electric';

  return (
    <div>
      <Section title="Appointment information">
        <Field label="Inspector name" value={checklist.inspector_name} />
        <Field label="Inspector phone" value={checklist.inspector_phone} />
        <Field label="Repair order number" value={checklist.repair_order_number} />
      </Section>

      <Section title="Vehicle">
        <Field label="Vehicle type" value={checklist.vehicle_body_type} />
        <Field label="Drivetrain" value={checklist.drivetrain} />
        <Field
          label="License plate"
          value={
            core.license_plate
              ? `${core.license_plate}${core.license_plate_state ? ` (${core.license_plate_state})` : ''}`
              : null
          }
        />
        <Field label="Fuel type" value={core.fuel_type} />
        {!isElectric && (
          <>
            <Field label="Engine size" value={core.engine_size} />
            <Field label="Cylinders" value={core.engine_cylinders} />
          </>
        )}
        <Field label="Tire size (OEM)" value={checklist.tire_size_oem} />
        <Field label="Tire size (actual)" value={checklist.tire_size_actual} />
      </Section>

      <Section title="Labor rate">
        <Field label="Labor rate" value={checklist.labor_rate} />
        <Field label="Verbal or posted?" value={checklist.labor_rate_type} />
      </Section>

      <Section title="Vehicle history">
        <YesNoField label="Modifications" value={checklist.modifications} />
        <YesNoField label="Signs of collision" value={checklist.signs_of_collision} />
        <YesNoField label="Signs of abuse or neglect" value={checklist.signs_of_abuse_neglect} />
        <YesNoField label="Commercial signage" value={checklist.commercial_signage} />
        <YesNoField label="Hitch" value={checklist.hitch} />
      </Section>

      <Section title="Fluids & mechanical">
        {!isElectric && (
          <>
            <Field label="Engine oil level & condition" value={checklist.engine_fluid_condition} />
            <YesNoField label="Engine leaks present?" value={checklist.engine_leaks} />
            <Field label="Transmission fluid & level" value={checklist.transmission_fluid_level} />
            <YesNoField label="Transmission leaks present?" value={checklist.transmission_leaks} />
            <Field
              label="Power steering fluid condition"
              value={checklist.power_steering_fluid_condition}
            />
          </>
        )}
        <Field label="Coolant level & condition" value={checklist.coolant_level_condition} />
        <YesNoField label="Coolant leaks present?" value={checklist.coolant_leaks} />
        <Field label="Hoses condition" value={checklist.hoses_condition} />
        <Field label="Belts condition" value={checklist.belts_condition} />
        <Field label="Air filter condition" value={checklist.air_filter_condition} />
      </Section>

      <Section title="Diagnostic">
        <YesNoField label="Teardown observed?" value={checklist.teardown_observed} />
        <YesNoField label="TSBs presented?" value={checklist.tsbs_presented} />
        <Field label="Verified failures?" value={checklist.verified_failures} />
        <Field label="Verbal called in?" value={checklist.verbal_called_in} />
        {checklist.verbal_called_in === 'Yes' && (
          <Field label="Person spoken with" value={checklist.person_spoken_with} />
        )}
      </Section>

      {(checklist.inspector_observations || checklist.inspector_cause_of_failure) && (
        <div className="mb-2">
          <h3 className="text-gray-500 text-xs uppercase tracking-wide mb-2">
            Observations &amp; diagnosis
          </h3>
          {checklist.inspector_observations && (
            <div className="mb-4">
              <p className="text-gray-500 text-sm mb-1">Inspector observations</p>
              <p className="text-white whitespace-pre-wrap text-sm">
                {checklist.inspector_observations}
              </p>
            </div>
          )}
          {checklist.inspector_cause_of_failure && (
            <div>
              <p className="text-gray-500 text-sm mb-1">Inspector cause of failure</p>
              <p className="text-white whitespace-pre-wrap text-sm">
                {checklist.inspector_cause_of_failure}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
