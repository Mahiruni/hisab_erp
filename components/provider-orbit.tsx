import { appConfig } from "../lib/config";

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M17.05 12.54c-.02-2.27 1.85-3.37 1.94-3.43a4.16 4.16 0 0 0-3.27-1.77c-1.38-.15-2.72.83-3.42.83-.72 0-1.8-.81-2.97-.78a4.34 4.34 0 0 0-3.65 2.23c-1.58 2.73-.4 6.75 1.11 8.96.76 1.08 1.65 2.29 2.82 2.25 1.14-.05 1.57-.72 2.94-.72 1.36 0 1.76.72 2.95.69 1.23-.02 2-1.08 2.73-2.17a8.94 8.94 0 0 0 1.25-2.55 3.91 3.91 0 0 1-2.43-3.54ZM14.82 5.88a3.98 3.98 0 0 0 .91-2.86 4.07 4.07 0 0 0-2.64 1.36 3.8 3.8 0 0 0-.94 2.75 3.36 3.36 0 0 0 2.67-1.25Z"/>
    </svg>
  );
}

export function ProviderOrbit({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`provider-orbit${compact ? " compact" : ""}`} aria-label="Hisab trusted identity and payment providers">
      <span className="provider-orbit-ring provider-orbit-ring-one" aria-hidden="true" />
      <span className="provider-orbit-ring provider-orbit-ring-two" aria-hidden="true" />
      <div className="provider-orbit-core">
        <img src="/hisab-logo.svg" alt="" width="70" height="70" />
        <span><strong>Hisab ERP</strong><small>One trusted workspace</small></span>
      </div>
      {appConfig.authProviders.apple ? <span className="provider-orbit-card provider-apple" data-third-party-brand><AppleMark/><b>Apple</b><small>Private sign-in</small></span> : null}
      <span className="provider-orbit-card provider-chapa" style={{ right: "2%", bottom: "12%", color: "#171717", background: "rgba(255,255,255,.94)" }} data-third-party-brand><strong style={{ gridRow: "1 / 3", fontSize: 18 }}>Chapa</strong><small>ETB checkout</small></span>
      <span className="provider-orbit-card provider-supabase" data-third-party-brand><i aria-hidden="true"/><b>Supabase</b><small>Identity &amp; data</small></span>
      <span className="provider-orbit-caption">Identity · payments · protected business data</span>
    </div>
  );
}
