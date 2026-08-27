'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitInspectionRequest, type RequestInspectionState } from '@/app/actions';

const initialState: RequestInspectionState = { status: 'idle', message: '' };

const inputClass =
  'w-full px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Submitting...' : 'Request an Inspection'}
    </button>
  );
}

export function RequestInspectionForm() {
  const [state, formAction] = useActionState(submitInspectionRequest, initialState);

  if (state.status === 'success') {
    return (
      <p className="text-green-400 text-center py-8" aria-live="polite">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 text-left">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px opacity-0"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" name="name" placeholder="Your name" required className={inputClass} />
        <input type="tel" name="phone" placeholder="Phone number" className={inputClass} />
      </div>

      <input type="email" name="email" placeholder="Email address" required className={inputClass} />

      <select name="vehicle_type" required defaultValue="" className={inputClass}>
        <option value="" disabled>
          Type of vehicle
        </option>
        <option value="Passenger vehicle or truck">Passenger vehicle or truck</option>
        <option value="Exotic">Exotic</option>
        <option value="Commercial truck or trailer">Commercial truck or trailer</option>
        <option value="RV">RV</option>
        <option value="Classic car (1995 or older)">Classic car (1995 or older)</option>
      </select>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input type="text" name="vehicle_year" placeholder="Year" className={inputClass} />
        <input type="text" name="vehicle_make" placeholder="Make" className={inputClass} />
        <input type="text" name="vehicle_model" placeholder="Model" className={inputClass} />
      </div>

      <input
        type="text"
        name="location"
        placeholder="Vehicle location (city or dealership)"
        className={inputClass}
      />

      <textarea
        name="notes"
        placeholder="Anything else we should know?"
        rows={3}
        className={inputClass}
      />

      {state.status === 'error' && (
        <p className="text-red-400 text-sm" aria-live="polite">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
