import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getReadUrls } from '@/lib/azure-media';
import { ChecklistDisplay } from '@/components/ChecklistDisplay';
import type { InspectionChecklist } from '@/lib/inspection-checklist';
import { groupMediaByTag } from '@/lib/group-media';

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Public page, no auth — possession of the token is the access control.
  // Uses the service-role admin client because RLS deliberately grants no
  // anon access to inspections (see supabase/schema.sql).
  const admin = await createAdminClient();

  type ReportRow = {
    id: string;
    inspection_type: string;
    status: string;
    notes: string | null;
    inspection_date: string;
    vehicle_vin: string | null;
    vehicle_year: number | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_mileage: number | null;
    vehicle_color: string | null;
    license_plate: string | null;
    license_plate_state: string | null;
    fuel_type: string | null;
    engine_size: string | null;
    engine_cylinders: number | null;
    odometer_before: number | null;
    odometer_after: number | null;
    synopsis: string | null;
    checklist: InspectionChecklist;
    customers: { name: string } | null;
    inspectors: { name: string } | null;
  };

  const { data: inspection } = await admin
    .from('inspections')
    .select(
      'id, inspection_type, status, notes, inspection_date, vehicle_vin, vehicle_year, vehicle_make, vehicle_model, vehicle_mileage, vehicle_color, license_plate, license_plate_state, fuel_type, engine_size, engine_cylinders, odometer_before, odometer_after, synopsis, checklist, customers(name), inspectors(name)'
    )
    .eq('access_token', token)
    .single()
    .returns<ReportRow>();

  if (!inspection) {
    notFound();
  }

  const { data: rawMedia } = await admin
    .from('inspection_media')
    .select('*')
    .eq('inspection_id', inspection.id)
    .order('uploaded_at', { ascending: false });

  const media = await getReadUrls(rawMedia ?? []);
  const mediaGroups = groupMediaByTag(media);
  const isImage = (fileType: string) => fileType.startsWith('image/');

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-blue-400 text-sm font-semibold mb-1">InspectionComm Report</p>
        <h1 className="text-2xl font-bold text-white mb-1">
          {inspection.vehicle_year} {inspection.vehicle_make} {inspection.vehicle_model}
        </h1>
        <p className="text-gray-400 mb-8">
          {inspection.customers?.name} &middot; {inspection.inspection_date} &middot;{' '}
          {inspection.status}
        </p>

        <dl className="grid grid-cols-2 gap-4 text-sm mb-8">
          <div>
            <dt className="text-gray-500">VIN</dt>
            <dd className="text-white">{inspection.vehicle_vin || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Mileage</dt>
            <dd className="text-white">{inspection.vehicle_mileage ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Inspection type</dt>
            <dd className="text-white">{inspection.inspection_type}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Inspector</dt>
            <dd className="text-white">{inspection.inspectors?.name || '—'}</dd>
          </div>
        </dl>

        <div className="mb-8">
          <h2 className="text-gray-500 text-sm mb-2">Inspection checklist</h2>
          <ChecklistDisplay
            core={{
              vehicle_color: inspection.vehicle_color,
              license_plate: inspection.license_plate,
              license_plate_state: inspection.license_plate_state,
              fuel_type: inspection.fuel_type,
              engine_size: inspection.engine_size,
              engine_cylinders: inspection.engine_cylinders,
              odometer_before: inspection.odometer_before,
              odometer_after: inspection.odometer_after,
              notes: inspection.notes,
              synopsis: inspection.synopsis,
            }}
            checklist={inspection.checklist ?? {}}
          />
        </div>

        <div>
          <h2 className="text-gray-500 text-sm mb-2">Photos &amp; video ({media.length})</h2>
          {mediaGroups.length > 0 ? (
            <div className="flex flex-col gap-4">
              {mediaGroups.map((group) => (
                <div key={group.tag}>
                  <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    {group.tag}
                  </h3>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <a href={item.read_url} target="_blank" rel="noreferrer" className="block">
                          {isImage(item.file_type) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.read_url}
                              alt={item.file_name}
                              className="w-full aspect-square object-cover rounded"
                            />
                          ) : (
                            <div className="w-full aspect-square rounded bg-slate-800 flex items-center justify-center text-xs text-gray-400 p-2 text-center">
                              {item.file_name}
                            </div>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No photos uploaded yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
