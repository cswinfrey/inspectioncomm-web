import { requireInspector } from '@/lib/supabase/require-inspector';
import { NewInspectionForm } from './NewInspectionForm';

export default async function NewInspectionPage() {
  const { supabase } = await requireInspector();

  const { data: customers } = await supabase
    .from('customers')
    .select('name, email')
    .order('name');

  return <NewInspectionForm customers={customers ?? []} />;
}
