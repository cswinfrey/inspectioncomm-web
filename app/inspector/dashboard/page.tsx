import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/inspector/actions';

export default async function InspectorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/inspector/login');
  }

  const { data: inspector } = await supabase
    .from('inspectors')
    .select('name, email, role')
    .eq('id', user.id)
    .single();

  type InspectionListRow = {
    id: string;
    vehicle_year: number | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    inspection_date: string;
    status: string;
    customers: { name: string } | null;
  };

  // Explicitly scoped to the signed-in inspector's own inspections — this is
  // "my inspections", not the manager's all-inspectors view at /manager.
  // Managers also match the broader "Managers view all inspections" RLS
  // policy, so without this filter they'd see everyone's rows here too.
  const { data: inspections } = await supabase
    .from('inspections')
    .select('id, vehicle_year, vehicle_make, vehicle_model, inspection_date, status, customers(name)')
    .eq('inspector_id', user.id)
    .order('created_at', { ascending: false })
    .returns<InspectionListRow[]>();

  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome, {inspector?.name ?? user.email}
            </h1>
            <p className="text-gray-400">{inspector?.email ?? user.email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Inspections</h2>
          <div className="flex gap-2">
            {inspector?.role === 'manager' && (
              <Link
                href="/inspector/manager"
                className="px-4 py-2 bg-slate-700 text-white rounded font-semibold hover:bg-slate-600 text-sm"
              >
                Manager View
              </Link>
            )}
            <Link
              href="/inspector/inspections/new"
              className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 text-sm"
            >
              New Inspection
            </Link>
          </div>
        </div>

        {inspections && inspections.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {inspections.map((inspection) => (
              <li key={inspection.id}>
                <Link
                  href={`/inspector/inspections/${inspection.id}`}
                  className="block bg-slate-800/60 hover:bg-slate-800 rounded px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">
                      {inspection.vehicle_year} {inspection.vehicle_make}{' '}
                      {inspection.vehicle_model}
                    </span>
                    <span className="text-xs text-gray-400">{inspection.status}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {inspection.customers?.name} &middot; {inspection.inspection_date}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No inspections yet.</p>
        )}
      </div>
    </main>
  );
}
