'use client';

import { useState, useTransition } from 'react';
import { deactivateInspector, reactivateInspector } from './actions';

type Props = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
};

export function InspectorRow({ id, name, email, role, isActive, isSelf }: Props) {
  const [active, setActive] = useState(isActive);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError('');
    startTransition(async () => {
      const result = active ? await deactivateInspector(id) : await reactivateInspector(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setActive(!active);
    });
  }

  return (
    <li className="bg-slate-800/60 rounded px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white font-medium">{name}</span>
          {role === 'manager' && (
            <span className="ml-2 text-xs text-blue-400">manager</span>
          )}
          {!active && <span className="ml-2 text-xs text-red-400">inactive</span>}
        </div>
        {!isSelf && (
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="px-3 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-60"
          >
            {isPending ? '...' : active ? 'Deactivate' : 'Reactivate'}
          </button>
        )}
      </div>
      <div className="text-sm text-gray-400">{email}</div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </li>
  );
}
