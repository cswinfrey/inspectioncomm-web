export type InspectionFilters = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
};

export function parseInspectionFilters(
  searchParams: Record<string, string | string[] | undefined>
): InspectionFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return {
    q: first(searchParams.q)?.trim() || undefined,
    status: first(searchParams.status) || undefined,
    from: first(searchParams.from) || undefined,
    to: first(searchParams.to) || undefined,
  };
}
