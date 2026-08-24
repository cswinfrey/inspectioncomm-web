'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createInspection,
  type CreateInspectionState,
} from '@/app/inspector/inspections/actions';

const initialState: CreateInspectionState = { status: 'idle', message: '' };

const inputClass =
  'px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none w-full';

type Customer = { name: string; email: string };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Create Inspection'}
    </button>
  );
}

export function NewInspectionForm({ customers }: { customers: Customer[] }) {
  const [state, formAction] = useActionState(createInspection, initialState);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/inspector/dashboard" className="text-blue-400 hover:underline text-sm">
          &larr; Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4 mb-8">New Inspection</h1>

        <form action={formAction} className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-gray-300 font-semibold mb-1">Customer</legend>
            <input
              type="text"
              name="customer_name"
              placeholder="Customer name"
              list="customer-names"
              required
              className={inputClass}
            />
            <input
              type="email"
              name="customer_email"
              placeholder="Customer email"
              list="customer-emails"
              required
              className={inputClass}
            />
            <datalist id="customer-names">
              {customers.map((c) => (
                <option key={c.email} value={c.name} />
              ))}
            </datalist>
            <datalist id="customer-emails">
              {customers.map((c) => (
                <option key={c.email} value={c.email} />
              ))}
            </datalist>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-gray-300 font-semibold mb-1">Vehicle</legend>
            <input type="text" name="vehicle_vin" placeholder="VIN" className={inputClass} />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                name="vehicle_year"
                placeholder="Year"
                className={inputClass}
              />
              <input
                type="number"
                name="vehicle_mileage"
                placeholder="Mileage"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="vehicle_make"
                placeholder="Make"
                required
                className={inputClass}
              />
              <input
                type="text"
                name="vehicle_model"
                placeholder="Model"
                required
                className={inputClass}
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-gray-300 font-semibold mb-1">Inspection</legend>
            <input
              type="date"
              name="inspection_date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
            <input
              type="text"
              name="inspection_type"
              placeholder="Inspection type"
              defaultValue="pre-purchase"
              className={inputClass}
            />
            <textarea
              name="notes"
              placeholder="Notes"
              rows={4}
              className={inputClass}
            />
          </fieldset>

          <SubmitButton />
        </form>

        {state.message && (
          <p aria-live="polite" className="mt-4 text-sm text-red-400">
            {state.message}
          </p>
        )}
      </div>
    </main>
  );
}
