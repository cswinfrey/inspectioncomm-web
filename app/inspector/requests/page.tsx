import Link from 'next/link';
import { requireInspector } from '@/lib/supabase/require-inspector';
import { RequestStatusSelect } from '@/app/inspector/requests/RequestStatusSelect';

type InspectionRequestRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicle_type: string;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export default async function InspectionRequestsPage() {
  const { supabase } = await requireInspector();

  const { data: requests } = await supabase
    .from('inspection_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<InspectionRequestRow[]>();

  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-16">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Inspection Requests</h1>
          <Link
            href="/inspector/dashboard"
            className="px-4 py-2 bg-slate-700 text-white rounded font-semibold hover:bg-slate-600 text-sm"
          >
            Back to Dashboard
          </Link>
        </div>

        {requests && requests.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {requests.map((req) => (
              <li key={req.id} className="bg-slate-800/60 rounded px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-medium">
                      {req.name} &middot;{' '}
                      {[req.vehicle_year, req.vehicle_make, req.vehicle_model]
                        .filter(Boolean)
                        .join(' ') || req.vehicle_type}
                    </div>
                    <div className="text-sm text-gray-400">
                      {req.email}
                      {req.phone ? ` · ${req.phone}` : ''}
                    </div>
                    <div className="text-sm text-gray-400">
                      {req.vehicle_type}
                      {req.location ? ` · ${req.location}` : ''}
                    </div>
                    {req.notes && (
                      <div className="text-sm text-gray-500 mt-1 italic">{req.notes}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Submitted {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>
                  <RequestStatusSelect requestId={req.id} status={req.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No inspection requests yet.</p>
        )}
      </div>
    </main>
  );
}
