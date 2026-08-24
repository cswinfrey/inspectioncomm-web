import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireInspector } from '@/lib/supabase/require-inspector';
import { AddInspectorForm } from './AddInspectorForm';
import { InspectorRow } from './InspectorRow';
import { FilterBar } from '@/app/inspector/FilterBar';
import { parseInspectionFilters } from '@/lib/inspections-filters';

type InspectorListRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

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

export default async function ManagerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, user, inspector } = await requireInspector();
  const filters = parseInspectionFilters(await searchParams);

  if (inspector?.role !== 'manager') {
    redirect('/inspector/dashboard');
  }

  // Relies on the "Managers view all inspectors" RLS policy.
  const { data: inspectors } = await supabase
    .from('inspectors')
    .select('id, name, email, role, is_active')
    .order('name')
    .returns<InspectorListRow[]>();

  const inspectionColumns =
    'id, vehicle_year, vehicle_make, vehicle_model, inspection_date, status, created_at, customers(name), inspectors(name)';

  // Reporting (stats + by-inspector breakdown) always reflects the full,
  // unfiltered dataset — only the "All inspections" list below is filtered,
  // so the two don't visually contradict each other.
  const { data: allInspections } = await supabase
    .from('inspections')
    .select(inspectionColumns)
    .returns<InspectionRow[]>();

  // Relies on the "Managers view all inspections" RLS policy — no manual
  // inspector_id filter here, unlike the personal dashboard.
  let filteredQuery = supabase.from('inspections').select(inspectionColumns);
  if (filters.q) {
    filteredQuery = filteredQuery.textSearch('search_text', filters.q, {
      type: 'websearch',
      config: 'english',
    });
  }
  if (filters.status && filters.status !== 'all') {
    filteredQuery = filteredQuery.eq('status', filters.status);
  }
  if (filters.from) {
    filteredQuery = filteredQuery.gte('inspection_date', filters.from);
  }
  if (filters.to) {
    filteredQuery = filteredQuery.lte('inspection_date', filters.to);
  }
  const { data: filteredInspections } = await filteredQuery
    .order('created_at', { ascending: false })
    .returns<InspectionRow[]>();

  const rows = allInspections ?? [];
  const filteredRows = filteredInspections ?? [];

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

        <h2 className="text-lg font-semibold text-white mb-2">Inspectors</h2>
        <AddInspectorForm />
        <ul className="flex flex-col gap-2 mb-8">
          {(inspectors ?? []).map((row) => (
            <InspectorRow
              key={row.id}
              id={row.id}
              name={row.name}
              email={row.email}
              role={row.role}
              isActive={row.is_active}
              isSelf={row.id === user.id}
            />
          ))}
        </ul>

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
        <FilterBar action="/inspector/manager" filters={filters} />
        {filteredRows.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {filteredRows.map((inspection) => (
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
          <p className="text-gray-500 text-sm">
            {filters.q || filters.status || filters.from || filters.to
              ? 'No inspections match those filters.'
              : 'No inspections yet.'}
          </p>
        )}
      </div>
    </main>
  );
}
