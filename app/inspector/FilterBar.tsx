import type { InspectionFilters } from '@/lib/inspections-filters';

const inputClass =
  'px-3 py-2 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none text-sm';

export function FilterBar({
  action,
  filters,
}: {
  action: string;
  filters: InspectionFilters;
}) {
  const hasFilters = filters.q || filters.status || filters.from || filters.to;

  return (
    <form action={action} method="get" className="flex flex-wrap gap-2 items-end mb-4">
      <input
        type="text"
        name="q"
        placeholder="Search vehicle, VIN, customer..."
        defaultValue={filters.q ?? ''}
        className={`${inputClass} min-w-56`}
      />
      <select name="status" defaultValue={filters.status ?? 'all'} className={inputClass}>
        <option value="all">All statuses</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
      </select>
      <label className="text-xs text-gray-400 flex flex-col gap-1">
        From
        <input
          type="date"
          name="from"
          defaultValue={filters.from ?? ''}
          className={inputClass}
        />
      </label>
      <label className="text-xs text-gray-400 flex flex-col gap-1">
        To
        <input type="date" name="to" defaultValue={filters.to ?? ''} className={inputClass} />
      </label>
      <button
        type="submit"
        className="px-4 py-2 bg-slate-700 text-white rounded font-semibold hover:bg-slate-600 text-sm"
      >
        Filter
      </button>
      {hasFilters && (
        <a href={action} className="text-sm text-blue-400 hover:underline px-2 py-2">
          Clear
        </a>
      )}
    </form>
  );
}
