import type { InspectionChecklist } from '@/lib/inspection-checklist';

type CoreFields = {
  vehicle_color: string | null;
  license_plate: string | null;
  license_plate_state: string | null;
  fuel_type: string | null;
  engine_size: string | null;
  engine_cylinders: number | null;
  odometer_before: number | null;
  odometer_after: number | null;
  notes: string | null;
  synopsis: string | null;
};

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-white">{value ?? '—'}</dd>
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

export function ChecklistDisplay({
  core,
  checklist,
}: {
  core: CoreFields;
  checklist: InspectionChecklist;
}) {
  return (
    <div>
      <Section title="Vehicle identity">
        <Field label="Color" value={core.vehicle_color} />
        <Field
          label="License plate"
          value={
            core.license_plate
              ? `${core.license_plate}${core.license_plate_state ? ` (${core.license_plate_state})` : ''}`
              : null
          }
        />
      </Section>

      <Section title="Odometer">
        <Field label="Before inspection" value={core.odometer_before} />
        <Field label="After inspection" value={core.odometer_after} />
      </Section>

      <Section title="Engine & transmission">
        <Field label="Fuel type" value={core.fuel_type} />
        <Field label="Engine size" value={core.engine_size} />
        <Field label="Cylinders" value={core.engine_cylinders} />
        <Field label="Transmission type" value={checklist.transmission?.type} />
        <Field label="Transmission condition" value={checklist.transmission?.condition} />
      </Section>

      <Section title="Tires">
        <Field label="Size" value={checklist.tires?.size} />
        <Field label="Tread" value={checklist.tires?.tread} />
        <Field label="Condition" value={checklist.tires?.condition} />
      </Section>

      <Section title="Exterior & steering">
        <Field label="Paint condition" value={checklist.paint?.condition} />
        <Field label="Suspension & steering" value={checklist.suspension_steering?.condition} />
        <Field label="Power steering type" value={checklist.power_steering?.type} />
        <Field label="Power steering condition" value={checklist.power_steering?.condition} />
      </Section>

      <Section title="Fluids & climate">
        <Field label="Brake fluid level" value={checklist.brake_fluid?.level} />
        <Field label="Brake fluid condition" value={checklist.brake_fluid?.condition} />
        <Field label="Fluid leaks" value={checklist.fluid_leaks?.condition} />
        <Field label="AC / heat" value={checklist.ac_heat?.condition} />
      </Section>
      {checklist.fluid_leaks?.notes && (
        <p className="text-sm text-white -mt-4 mb-6">{checklist.fluid_leaks.notes}</p>
      )}

      <Section title="Interior electronics">
        <Field label="Radio" value={checklist.interior_electronics?.radio} />
        <Field label="Heated/cooled seats" value={checklist.interior_electronics?.heated_cooled_seats} />
        <Field label="Sunroof" value={checklist.interior_electronics?.sunroof} />
        <Field label="Rear tailgate" value={checklist.interior_electronics?.rear_tailgate} />
      </Section>

      <Section title="OBD scan">
        <Field label="ECM" value={checklist.obd_scan?.ecm} />
        <Field label="TCM" value={checklist.obd_scan?.tcm} />
        <Field label="ABS" value={checklist.obd_scan?.abs} />
        <Field label="SRS" value={checklist.obd_scan?.srs} />
        <Field label="AWD / 4WD" value={checklist.obd_scan?.awd_4wd} />
      </Section>

      {(core.notes || core.synopsis) && (
        <div className="mb-2">
          <h3 className="text-gray-500 text-xs uppercase tracking-wide mb-2">Notes &amp; synopsis</h3>
          {core.notes && (
            <div className="mb-4">
              <p className="text-gray-500 text-sm mb-1">Inspector notes</p>
              <p className="text-white whitespace-pre-wrap text-sm">{core.notes}</p>
            </div>
          )}
          {core.synopsis && (
            <div>
              <p className="text-gray-500 text-sm mb-1">Synopsis / diagnosis</p>
              <p className="text-white whitespace-pre-wrap text-sm">{core.synopsis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
