import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/app/components/SiteNav';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'How an InspectionComm pre-purchase vehicle inspection works, start to finish.',
};

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

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <SiteNav />
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="bg-slate-800/60 rounded p-5">
                <div className="text-blue-400 font-semibold text-sm mb-1">Step {i + 1}</div>
                <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
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
