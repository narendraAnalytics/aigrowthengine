import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're offline",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="glass-panel flex size-16 items-center justify-center rounded-2xl">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f3cd7c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 className="text-cream text-2xl font-bold">You&rsquo;re offline</h1>
      <p className="text-muted-warm text-sm leading-relaxed">
        This page isn&rsquo;t available without a connection. Reconnect and try
        again — your assessment progress is saved locally.
      </p>
    </main>
  );
}
