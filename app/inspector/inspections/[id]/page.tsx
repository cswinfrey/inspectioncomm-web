import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireInspector } from '@/lib/supabase/require-inspector';
import { UploadMedia } from './UploadMedia';
import { StatusToggle } from './StatusToggle';

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireInspector();

  type InspectionDetailRow = {
    id: string;
    inspector_id: string;
    inspection_type: string;
    status: string;
    notes: string | null;
    inspection_date: string;
    vehicle_vin: string | null;
    vehicle_year: number | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_mileage: number | null;
    customers: { name: string; email: string } | null;
  };

  const { data: inspection } = await supabase
    .from('inspections')
    .select(
      'id, inspector_id, inspection_type, status, notes, inspection_date, vehicle_vin, vehicle_year, vehicle_make, vehicle_model, vehicle_mileage, customers(name, email)'
    )
    .eq('id', id)
    .single()
    .returns<InspectionDetailRow>();

  if (!inspection) {
    notFound();
  }

  const { data: media } = await supabase
    .from('inspection_media')
    .select('*')
    .eq('inspection_id', id)
    .order('uploaded_at', { ascending: false });

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
            <dt className="text-gray-500">Type</dt>
            <dd className="text-white">{inspection.inspection_type}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Customer email</dt>
            <dd className="text-white">{inspection.customers?.email}</dd>
          </div>
        </dl>

        {inspection.notes && (
          <div className="mb-8">
            <h2 className="text-gray-500 text-sm mb-1">Notes</h2>
            <p className="text-white whitespace-pre-wrap">{inspection.notes}</p>
          </div>
        )}

        <div>
          <h2 className="text-gray-500 text-sm mb-2">
            Photos &amp; video ({media?.length ?? 0})
          </h2>
          {media && media.length > 0 ? (
            <ul className="grid grid-cols-3 gap-2">
              {media.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-blue-400 hover:underline truncate"
                  >
                    {item.file_name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No photos uploaded yet.</p>
          )}
          <UploadMedia inspectionId={id} />
        </div>
      </div>
    </main>
  );
}
