'use server';

import { createClient } from '@/lib/supabase/server';
import { decodeVin, type VinDecodeResult } from '@/lib/vin-decode';

export async function decodeVinAction(vin: string): Promise<VinDecodeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Not authenticated.' };
  }

  return decodeVin(vin);
}
