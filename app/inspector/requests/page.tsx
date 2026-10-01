import Link from 'next/link';
import { requireInspector } from '@/lib/supabase/require-inspector';
import { RequestStatusSelect } from '@/app/inspector/requests/RequestStatusSelect';
import { RequestAssignment } from '@/app/inspector/requests/RequestAssignment';

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
  assigned_inspector_id: string | null;
  appointment_time: string | null;
  assigned_inspector: { name: string } | null;
};

export default async function InspectionRequestsPage() {
  const { supabase, inspector } = await requireInspector();
  const isManager = inspector?.role === 'manager';

  const { data: requests } = await supabase
    .from('inspection_requests')
    .select('*, assigned_inspector:inspectors!assigned_inspector_id(name)')
    .order('created_at', { ascending: false })
    .returns<InspectionRequestRow[]>();

  // Only needed for the manager's assignment dropdown.
  const { data: roster } = isManager
    ? await supabase
        .from('inspectors')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
        .returns<{ id: string; name: string }[]>()
    : { data: null };

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
                <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
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

                  <div className="flex flex-col gap-2 items-start sm:items-end">
                    <RequestStatusSelect requestId={req.id} status={req.status} />
                    {isManager ? (
                      <RequestAssignment
                        requestId={req.id}
                        inspectors={roster ?? []}
                        assignedInspectorId={req.assigned_inspector_id}
                        appointmentTime={req.appointment_time}
                      />
                    ) : (
                      <div className="text-xs text-gray-400 text-left sm:text-right">
                        <div>
                          {req.assigned_inspector?.name
                            ? `Assigned: ${req.assigned_inspector.name}`
                            : 'Unassigned'}
                        </div>
                        {req.appointment_time && (
                          <div>{new Date(req.appointment_time).toLocaleString()}</div>
                        )}
                      </div>
                    )}
                  </div>
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
