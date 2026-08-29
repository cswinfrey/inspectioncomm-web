import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/app/components/SiteNav';

export const metadata: Metadata = {
  title: 'Why InspectionComm',
  description:
    'Unbiased, technician-trained pre-purchase vehicle inspections for Atlanta and the extended metro area, including Marietta, Kennesaw, Covington, Jonesboro, and Douglasville.',
};

export default function WhyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <SiteNav />
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Why InspectionComm</h1>
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

          <div className="mt-10 text-center">
            <Link
              href="/#request"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
            >
              Request an Inspection
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
