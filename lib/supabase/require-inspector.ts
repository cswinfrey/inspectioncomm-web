import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type CurrentInspector = {
  id: string;
  name: string;
  email: string;
  role: string;
  must_change_password: boolean;
  is_active: boolean;
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
    .select('id, name, email, role, must_change_password, is_active')
    .eq('id', user.id)
    .single<CurrentInspector>();

  // Banning at the Auth level (deactivateInspector) doesn't revoke an
  // already-issued session token, so a deactivated inspector could otherwise
  // keep using the app until it expires. RLS now blocks their data access
  // immediately (current_inspector_active() in schema.sql), but without this
  // check they'd still see pages render with empty data instead of a clear
  // "you've been signed out" — so sign them out here explicitly too.
  if (inspector && !inspector.is_active) {
    await supabase.auth.signOut();
    redirect('/inspector/login');
  }

  if (!options?.allowMustChangePassword && inspector?.must_change_password) {
    redirect('/inspector/change-password');
  }

  return { supabase, user, inspector };
}
