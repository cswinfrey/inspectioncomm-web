'use client';

import { useState } from 'react';

export function CopyReportLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="flex-1 px-3 py-2 rounded bg-slate-800 text-gray-300 text-xs font-mono"
      />
      <button
        onClick={handleCopy}
        className="px-3 py-2 bg-slate-700 text-white rounded text-xs hover:bg-slate-600 whitespace-nowrap"
      >
        {copied ? 'Copied!' : 'Copy Report Link'}
      </button>
    </div>
  );
}
