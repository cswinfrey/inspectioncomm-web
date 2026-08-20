'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { subscribeEmail, type SignupState } from '@/app/actions';

const initialState: SignupState = { status: 'idle', message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Submitting...' : 'Notify Me'}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(subscribeEmail, initialState);

  return (
    <div>
      <form action={formAction} className="flex gap-2 justify-center flex-wrap">
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
          className="px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none min-w-64"
        />
        <SubmitButton />
      </form>
      {state.message && (
        <p
          aria-live="polite"
          className={`mt-3 text-sm ${
            state.status === 'error' ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
