'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signup, type AuthState } from '@/app/inspector/actions';

const initialState: AuthState = { status: 'idle', message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating account...' : 'Sign up'}
    </button>
  );
}

export default function InspectorSignupPage() {
  const [state, formAction] = useActionState(signup, initialState);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Inspector Sign Up
        </h1>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Full name"
            required
            className="px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            minLength={8}
            className="px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none"
          />
          <SubmitButton />
        </form>
        {state.message && (
          <p
            aria-live="polite"
            className={`mt-4 text-sm text-center ${
              state.status === 'error' ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {state.message}
          </p>
        )}
        <p className="mt-6 text-sm text-gray-400 text-center">
          Already have an account?{' '}
          <Link href="/inspector/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
