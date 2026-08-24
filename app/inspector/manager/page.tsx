import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type InspectionRow = {
  id: string;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  inspection_date: string;
  status: string;
  created_at: string;
  customers: { name: string } | null;
  inspectors: { name: string } | null;
};

export default async function ManagerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/inspector/login');
  }

  const { data: inspector } = await supabase
    .from('inspectors')
    .select('role')
    .eq('id', user.id)
    .single();

  if (inspector?.role !== 'manager') {
    redirect('/inspector/dashboard');
  }

  // Relies on the "Managers view all inspections" RLS policy — no manual
  // inspector_id filter here, unlike the personal dashboard.
  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, vehicle_year, vehicle_make, vehicle_model, inspection_date, status, created_at, customers(name), inspectors(name)'
    )
    .order('created_at', { ascending: false })
    .returns<InspectionRow[]>();

  const rows = inspections ?? [];

  const perInspector = new Map<string, number>();
  let thisMonthCount = 0;
  const now = new Date();

  for (const row of rows) {
    const name = row.inspectors?.name ?? 'Unknown';
    perInspector.set(name, (perInspector.get(name) ?? 0) + 1);

    const createdAt = new Date(row.created_at);
    if (
      createdAt.getUTCFullYear() === now.getUTCFullYear() &&
      createdAt.getUTCMonth() === now.getUTCMonth()
    ) {
      thisMonthCount += 1;
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Manager View</h1>
          <Link href="/inspector/dashboard" className="text-blue-400 hover:underline text-sm">
            &larr; My dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/60 rounded px-4 py-3">
            <p className="text-gray-500 text-sm">Inspections this month</p>
            <p className="text-2xl font-bold text-white">{thisMonthCount}</p>
          </div>
          <div className="bg-slate-800/60 rounded px-4 py-3">
            <p className="text-gray-500 text-sm">Total inspections</p>
            <p className="text-2xl font-bold text-white">{rows.length}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-2">By inspector</h2>
        <ul className="flex flex-col gap-1 mb-8">
          {[...perInspector.entries()].map(([name, count]) => (
            <li
              key={name}
              className="flex items-center justify-between bg-slate-800/60 rounded px-4 py-2 text-sm"
            >
              <span className="text-white">{name}</span>
              <span className="text-gray-400">{count}</span>
            </li>
          ))}
        </ul>

        <h2 className="text-lg font-semibold text-white mb-2">All inspections</h2>
        {rows.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {rows.map((inspection) => (
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
                    {inspection.inspectors?.name} &middot; {inspection.customers?.name} &middot;{' '}
                    {inspection.inspection_date}
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
