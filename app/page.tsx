import Image from 'next/image';
import { RequestInspectionForm } from '@/app/components/RequestInspectionForm';

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

const STEPS = [
  {
    title: 'Tell us about the vehicle',
    body: "Submit your info below and we'll follow up to confirm details and schedule.",
  },
  {
    title: 'We inspect on location',
    body: "We come to the vehicle — dealer lot, private seller, wherever it's sitting — at a scheduled time.",
  },
  {
    title: 'Thorough, documented inspection',
    body: 'Engine, transmission, brakes, suspension, paint, structure, interior electronics, and a road test when possible — all backed by photo and video.',
  },
  {
    title: 'You get an unbiased report',
    body: "A detailed report with our honest assessment, sent straight to you — nothing withheld, nothing exaggerated.",
  },
];

export default function Home() {
  return (
    <main className="bg-gradient-to-b from-slate-900 to-slate-800">
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-4">
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

      <section className="px-4 py-16 border-t border-slate-700/60">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Why InspectionComm</h2>
          <div className="text-gray-300 leading-relaxed flex flex-col gap-4">
            <p>
              We are unbiased inspectors who provide just that — unbiased observations. We give
              you the information to make an informed decision on a substantial investment,
              saving you the financial complications and time delays you didn&apos;t sign up for
              when you found this vehicle.
            </p>
            <p>
              We&apos;re car people. We have a passion for beautiful vehicles — we talk about
              engines, speed, modifications, body lines, and comfort qualities all day because of
              it. Our inspectors are former technicians with a heart for metal on wheels
              (sometimes without). That experience means we won&apos;t miss the failures and
              concerns we used to repair every day. Our inspectors are further trained to see not
              just mechanical condition, but paint condition and structural subframe systems that
              many technicians aren&apos;t as experienced with — so your inspection gets the eyes
              of a technician with the added training of a body specialist. We look at your
              vehicle as if it were our own.
            </p>
            <p>
              Integrity is what we offer. We&apos;re unbiased, and we stay that way. We don&apos;t
              accept bribes or any attempt to sway our observations in a dealer&apos;s,
              salesperson&apos;s, or seller&apos;s favor. Inspectors are commonly told &ldquo;that&apos;s
              normal&rdquo; or &ldquo;it&apos;ll be fixed by the time you get here&rdquo; — we only
              observe and report on the condition at the time of inspection, no more, no less. We
              value morals first.
            </p>
            <p>
              If a road test can&apos;t be performed to verify the engine, transmission, brakes,
              steering, or suspension, we&apos;ll note why and won&apos;t speculate on the
              operation of any system we couldn&apos;t actually verify.
            </p>
            <p>
              Our inspectors respect your time. Appointments are scheduled ahead of the inspection
              to avoid vehicle-location surprises, dead batteries, or tag and registration issues
              that could get in the way of a full report. We value your time as well as the
              seller&apos;s.
            </p>
            <p>
              We have years of experience getting hands-on with these vehicles — but we don&apos;t
              perform repairs. We&apos;ll point out repairs or the extent of any failures, backed
              by photo and video evidence. Because we don&apos;t do repair work ourselves, both
              you and the seller can trust we&apos;re not making biased observations to sell a
              repair quote. Dealers can trust our knowledge; customers can trust us beyond the
              final signature.
            </p>
            <p className="text-blue-400 font-semibold">
              With InspectionComm, a quality inspection can save you thousands.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 border-t border-slate-700/60">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="bg-slate-800/60 rounded p-5">
                <div className="text-blue-400 font-semibold text-sm mb-1">Step {i + 1}</div>
                <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 border-t border-slate-700/60">
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
