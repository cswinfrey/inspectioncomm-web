import 'server-only';

// NHTSA's vPIC VIN decoder — free, no API key, official US government data
// source. decodevinvalues returns one flat object per VIN (unlike the
// decodevin endpoint's Variable/Value pair array), which is much simpler to
// consume. Convenience only: a bad/unknown VIN should never block manual
// entry, so every failure path returns a plain, editable-by-hand message
// rather than throwing.
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i; // 17 chars; I/O/Q are never used in a VIN

export type VinDecodeResult =
  | { ok: true; year: number | null; make: string | null; model: string | null }
  | { ok: false; error: string };

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const cleaned = vin.trim().toUpperCase();
  if (!VIN_REGEX.test(cleaned)) {
    return { ok: false, error: 'VIN must be 17 characters (letters and numbers, no I/O/Q).' };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(cleaned)}?format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
  } catch {
    return { ok: false, error: 'Could not reach the VIN decoder — enter details manually.' };
  }

  if (!response.ok) {
    return { ok: false, error: 'VIN decoder is unavailable right now.' };
  }

  const data = await response.json();
  const result = data?.Results?.[0];
  if (!result) {
    return { ok: false, error: 'No data returned for this VIN.' };
  }

  const make = result.Make ? titleCaseIfShouting(String(result.Make)) : null;
  const model = result.Model ? String(result.Model) : null;
  const yearRaw = result.ModelYear ? Number(result.ModelYear) : null;
  const year = yearRaw && !Number.isNaN(yearRaw) ? yearRaw : null;

  if (!make && !model && !year) {
    return { ok: false, error: result.ErrorText || 'Could not decode this VIN.' };
  }

  return { ok: true, year, make, model };
}

// NHTSA returns most makes in ALL CAPS ("TOYOTA"). Title-case those for
// display, but leave short (<=3 char) all-caps values alone — those are
// almost always real acronym brands (GMC, BMW, RAM), not shouting.
function titleCaseIfShouting(make: string): string {
  if (make.length <= 3 || make !== make.toUpperCase()) {
    return make;
  }
  return make.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
