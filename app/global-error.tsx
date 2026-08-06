"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html><body><main className="error-page"><section><h1>Hisab ERP needs to reload</h1><p>A critical interface error occurred. No financial transaction is retried automatically.</p><button onClick={reset}>Reload application</button></section></main></body></html>;
}
