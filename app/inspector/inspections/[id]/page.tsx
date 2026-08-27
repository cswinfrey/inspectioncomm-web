import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { requireInspector } from '@/lib/supabase/require-inspector';
import { getReadUrls } from '@/lib/azure-media';
import { ChecklistDisplay } from '@/components/ChecklistDisplay';
import type { InspectionChecklist } from '@/lib/inspection-checklist';
import { groupMediaByTag } from '@/lib/group-media';
import { UploadMedia } from './UploadMedia';
import { StatusToggle } from './StatusToggle';
import { CopyReportLink } from './CopyReportLink';
import { ChecklistForm } from './ChecklistForm';
import { MediaTagInput } from './MediaTagInput';

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, inspector } = await requireInspector();

  type InspectionDetailRow = {
    id: string;
    inspector_id: string;
    access_token: string;
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
    customers: { name: string; email: string } | null;
  };

  const { data: inspection } = await supabase
    .from('inspections')
    .select(
      'id, inspector_id, access_token, inspection_type, status, notes, inspection_date, vehicle_vin, vehicle_year, vehicle_make, vehicle_model, vehicle_mileage, vehicle_color, license_plate, license_plate_state, fuel_type, engine_size, engine_cylinders, odometer_before, odometer_after, synopsis, checklist, customers(name, email)'
    )
    .eq('id', id)
    .single()
    .returns<InspectionDetailRow>();

  if (!inspection) {
    notFound();
  }

  const { data: rawMedia } = await supabase
    .from('inspection_media')
    .select('*')
    .eq('inspection_id', id)
    .order('uploaded_at', { ascending: false });

  const media = await getReadUrls(rawMedia ?? []);
  const mediaGroups = groupMediaByTag(media);

  const isOwner = inspection.inspector_id === user.id;
  const isManager = inspector?.role === 'manager';
  const canEditChecklist = (isOwner && inspection.status !== 'completed') || isManager;

  const headerList = await headers();
  const host = headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'https';
  const reportUrl = `${protocol}://${host}/report/${inspection.access_token}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/inspector/dashboard" className="text-blue-400 hover:underline text-sm">
          &larr; Back to dashboard
        </Link>

        <div className="flex items-start justify-between mt-4 mb-1">
          <h1 className="text-2xl font-bold text-white">
            {inspection.vehicle_year} {inspection.vehicle_make} {inspection.vehicle_model}
          </h1>
          {inspection.inspector_id === user.id && (
            <StatusToggle inspectionId={id} status={inspection.status} />
          )}
        </div>
        <p className="text-gray-400 mb-4">
          {inspection.customers?.name} &middot; {inspection.inspection_date} &middot;{' '}
          {inspection.status}
        </p>

        <div className="mb-8">
          <CopyReportLink url={reportUrl} />
        </div>

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
            <dt className="text-gray-500">Type</dt>
            <dd className="text-white">{inspection.inspection_type}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Customer email</dt>
            <dd className="text-white">{inspection.customers?.email}</dd>
          </div>
        </dl>

        {(() => {
          const core = {
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
          };

          return (
            <div className="mb-8">
              <h2 className="text-gray-500 text-sm mb-2">Inspection checklist</h2>
              {canEditChecklist ? (
                <ChecklistForm
                  inspectionId={id}
                  core={core}
                  checklist={inspection.checklist ?? {}}
                />
              ) : (
                <ChecklistDisplay core={core} checklist={inspection.checklist ?? {}} />
              )}
            </div>
          );
        })()}

        <div>
          <h2 className="text-gray-500 text-sm mb-2">
            Photos &amp; video ({media?.length ?? 0})
          </h2>
          {mediaGroups.length > 0 ? (
            <div className="flex flex-col gap-4">
              {mediaGroups.map((group) => (
                <div key={group.tag}>
                  <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    {group.tag}
                  </h3>
                  <ul className="grid grid-cols-3 gap-2">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.read_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-blue-400 hover:underline truncate"
                        >
                          {item.file_name}
                        </a>
                        {canEditChecklist && (
                          <MediaTagInput
                            mediaId={item.id}
                            inspectionId={id}
                            initialTag={item.tag}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No photos uploaded yet.</p>
          )}
          <UploadMedia inspectionId={id} />
        </div>
      </div>
    </main>
  );
}
