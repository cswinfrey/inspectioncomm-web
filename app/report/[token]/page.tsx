import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getReadUrls } from '@/lib/azure-media';

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
    customers: { name: string } | null;
  };

  const { data: inspection } = await admin
    .from('inspections')
    .select(
      'id, inspection_type, status, notes, inspection_date, vehicle_vin, vehicle_year, vehicle_make, vehicle_model, vehicle_mileage, customers(name)'
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
        </dl>

        {inspection.notes && (
          <div className="mb-8">
            <h2 className="text-gray-500 text-sm mb-1">Inspector notes</h2>
            <p className="text-white whitespace-pre-wrap">{inspection.notes}</p>
          </div>
        )}

        <div>
          <h2 className="text-gray-500 text-sm mb-2">Photos &amp; video ({media.length})</h2>
          {media.length > 0 ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {media.map((item) => (
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
          ) : (
            <p className="text-gray-500 text-sm">No photos uploaded yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
