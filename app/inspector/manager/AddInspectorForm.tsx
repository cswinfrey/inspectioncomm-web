'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addInspector, type AddInspectorState } from './actions';

const initialState: AddInspectorState = { status: 'idle', message: '' };

const inputClass =
  'px-3 py-2 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none text-sm';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Adding...' : 'Add Inspector'}
    </button>
  );
}

export function AddInspectorForm() {
  const [state, formAction] = useActionState(addInspector, initialState);

  return (
    <div className="bg-slate-800/60 rounded px-4 py-4 mb-4">
      <form action={formAction} className="flex flex-wrap gap-2 items-end">
        <input type="text" name="name" placeholder="Full name" required className={inputClass} />
        <input type="email" name="email" placeholder="Email" required className={inputClass} />
        <input
          type="text"
          name="temp_password"
          placeholder="Temp password"
          required
          minLength={8}
          className={inputClass}
        />
        <SubmitButton />
      </form>
      {state.message && (
        <p
          aria-live="polite"
          className={`mt-2 text-sm ${state.status === 'error' ? 'text-red-400' : 'text-green-400'}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
