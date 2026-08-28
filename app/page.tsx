import Image from 'next/image';
import { RequestInspectionForm } from '@/app/components/RequestInspectionForm';
import { SiteNav } from '@/app/components/SiteNav';

const PRICING = [
  {
    label: 'Passenger vehicles & trucks',
    detail: 'Non-commercial',
    price: '$175',
  },
  {
    label: 'Exotics',
    detail: 'Qualifying makes/models to be listed soon',
    price: '$225',
  },
  {
    label: 'Commercial trucks & trailers',
    detail: 'Truck and trailer as one inspection unless separated at locations; includes box trucks and flatbeds',
    price: '$225',
  },
  {
    label: 'RV inspections',
    detail: null,
    price: '$215',
  },
  {
    label: 'Classic cars',
    detail: '1995 and older, across the board',
    price: '$225',
  },
];

export default function Home() {
  return (
    <main className="bg-gradient-to-b from-slate-900 to-slate-800">
      <SiteNav />
      <section className="flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="max-w-2xl">
          <div className="mb-8 flex justify-center">
            <Image
              src="/company_logo.png"
              alt="InspectionComm Logo"
              width={240}
              height={240}
              className="drop-shadow-lg"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Inspection<span className="text-blue-500">Comm</span>
          </h1>
          <p className="text-2xl text-blue-400 font-semibold mb-4">
            Pre-Purchase Vehicle Inspections
          </p>
          <p className="text-lg text-gray-300 mb-8">
            Professional, unbiased inspections for the Atlanta metropolitan area
          </p>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Get a comprehensive, unbiased inspection with detailed photo and video documentation
            before you buy. We&apos;re here to help you make an informed decision on a
            substantial investment.
          </p>

          <a
            href="#request"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
          >
            Request an Inspection
          </a>
        </div>
      </section>

      <section id="pricing" className="px-4 py-16 border-t border-slate-700/60">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Pricing</h2>
          <ul className="flex flex-col gap-2">
            {PRICING.map((tier) => (
              <li
                key={tier.label}
                className="flex items-center justify-between gap-4 bg-slate-800/60 rounded px-5 py-4"
              >
                <div>
                  <div className="text-white font-semibold">{tier.label}</div>
                  {tier.detail && (
                    <div className="text-gray-400 text-sm leading-relaxed">{tier.detail}</div>
                  )}
                </div>
                <div className="text-blue-400 font-bold text-lg whitespace-nowrap">
                  {tier.price}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="request" className="px-4 py-16 border-t border-slate-700/60">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Request an Inspection</h2>
          <p className="text-gray-400 text-center mb-8">
            Tell us about the vehicle and we&apos;ll reach out to schedule.
          </p>
          <RequestInspectionForm />
        </div>
      </section>

      <footer className="px-4 py-10 border-t border-slate-700/60 text-center">
        <p className="text-gray-500 text-sm">
          Serving Atlanta, Marietta, Sandy Springs, Roswell, and surrounding areas
        </p>
      </footer>
    </main>
  );
}
