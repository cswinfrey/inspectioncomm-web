import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type CurrentInspector = {
  id: string;
  name: string;
  email: string;
  role: string;
  must_change_password: boolean;
};

// Server Action redirects (e.g. after login) render the destination page via
// a "seeded navigation" using the RSC payload from the same POST response —
// that does NOT pass through proxy.ts. So the must_change_password gate has
// to be checked here too, inside each protected page's own render, or a
// freshly logged-in user with a temp password would see the dashboard
// before ever hitting the gate.
export async function requireInspector(options?: { allowMustChangePassword?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/inspector/login');
  }

  const { data: inspector } = await supabase
    .from('inspectors')
    .select('id, name, email, role, must_change_password')
    .eq('id', user.id)
    .single<CurrentInspector>();

  if (!options?.allowMustChangePassword && inspector?.must_change_password) {
    redirect('/inspector/change-password');
  }

  return { supabase, user, inspector };
}
