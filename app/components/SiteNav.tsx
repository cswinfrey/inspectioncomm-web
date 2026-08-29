import Link from 'next/link';

const LINKS = [
  { href: '/why', label: 'Why InspectionComm' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#request', label: 'Request an Inspection' },
];

export function SiteNav() {
  return (
    <nav className="border-b border-slate-700/60">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-y-2">
        <Link href="/" className="text-white font-bold whitespace-nowrap">
          Inspection<span className="text-blue-500">Comm</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/inspector/login"
            className="text-sm text-gray-500 hover:text-gray-300 border-l border-slate-700 pl-4 sm:pl-6"
          >
            Inspector Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
