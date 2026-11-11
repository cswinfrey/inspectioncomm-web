import { requireInspector } from '@/lib/supabase/require-inspector';
import { NewInspectionForm } from './NewInspectionForm';

export default async function NewInspectionPage() {
  const { supabase, inspector } = await requireInspector();

  const { data: customers } = await supabase
    .from('customers')
    .select('name, email')
    .order('name');

  const isManager = inspector?.role === 'manager';
  const { data: inspectors } = isManager
    ? await supabase
        .from('inspectors')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
        .returns<{ id: string; name: string }[]>()
    : { data: null };

  return (
    <NewInspectionForm
      customers={customers ?? []}
      inspectors={inspectors ?? []}
      isManager={isManager}
    />
  );
}
