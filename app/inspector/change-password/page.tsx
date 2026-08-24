'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { changePassword, type ChangePasswordState } from './actions';

const initialState: ChangePasswordState = { status: 'idle', message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Set Password'}
    </button>
  );
}

export default function ChangePasswordPage() {
  const [state, formAction] = useActionState(changePassword, initialState);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Set Your Password</h1>
        <p className="text-gray-400 text-sm mb-6 text-center">
          You&apos;re using a temporary password. Choose a new one to continue.
        </p>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="password"
            placeholder="New password"
            required
            minLength={8}
            className="px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none"
          />
          <input
            type="password"
            name="confirm_password"
            placeholder="Confirm new password"
            required
            minLength={8}
            className="px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none"
          />
          <SubmitButton />
        </form>
        {state.message && (
          <p aria-live="polite" className="mt-4 text-sm text-red-400 text-center">
            {state.message}
          </p>
        )}
      </div>
    </main>
  );
}
