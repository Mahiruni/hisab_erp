import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { sharedResponsibility, trustControls } from "../../lib/marketing-trust";

export const metadata = {
  title: "Trust Center",
  description: "Review implemented HisabERP security controls, operational safeguards and shared responsibilities.",
};

export default function TrustPage() {
  const implemented = trustControls.filter((control) => control.status === "implemented").length;
  return (
    <MarketingPageShell>
      <section className="trust-page-hero">
        <div>
          <span className="marketing-eyebrow">HisabERP Trust Center</span>
          <h1>Security claims should be specific, inspectable and honest.</h1>
          <p>This Trust Center separates controls that are implemented today from safeguards that require configuration, ongoing operational evidence or a platform upgrade.</p>
          <div className="marketing-hero-actions"><a className="marketing-start marketing-large" href="mailto:mahir@hisabtech.com?subject=HisabERP%20security%20question">Ask a security question</a><Link className="marketing-demo marketing-large" href="/request-demo">Request a controlled demo</Link></div>
        </div>
        <aside className="trust-summary-card">
          <span>Current control register</span>
          <strong>{trustControls.length} documented safeguards</strong>
          <div><p><b>{implemented}</b><small>Implemented controls</small></p><p><b>{trustControls.length - implemented}</b><small>Configuration, operations or upgrade dependent</small></p></div>
          <small>No certification, compliance or recovery capability is presented as active unless the product or platform state supports it.</small>
        </aside>
      </section>

      <section className="trust-section trust-section-light">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Control register</span><h2>What HisabERP protects—and what still depends on configuration.</h2><p>Each control includes its current state and the evidence or limitation buyers should understand.</p></div>
        <div className="trust-control-grid">
          {trustControls.map((control) => (
            <article key={control.number} data-status={control.status}>
              <header><span>{control.number}</span><b>{control.statusLabel}</b></header>
              <h3>{control.title}</h3>
              <p>{control.description}</p>
              <small>{control.evidence}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-responsibility-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Shared responsibility</span><h2>Strong software still requires disciplined administration.</h2><p>HisabTech maintains product controls. Each organization remains responsible for how users, credentials, exports, devices and operational evidence are managed.</p></div>
        <div className="trust-responsibility-grid">
          <article><span>HisabTech responsibilities</span><ul>{sharedResponsibility.hisab.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><span>Customer responsibilities</span><ul>{sharedResponsibility.customer.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
      </section>

      <section className="trust-process-section">
        <div><span className="marketing-eyebrow">Operational assurance</span><h2>Controls are useful only when their evidence stays current.</h2><p>The internal production-control workspace tracks administrator MFA, alerts, audit activity, backup evidence, restore testing, database health and monitoring configuration.</p></div>
        <div className="trust-process-grid"><article><span>01</span><strong>Protect privileged access</strong><small>Require AAL2 MFA before administrators change sensitive records or security policy.</small></article><article><span>02</span><strong>Review activity</strong><small>Inspect authentication, financial and security-alert evidence instead of relying on memory.</small></article><article><span>03</span><strong>Verify continuity</strong><small>Keep backup evidence current and document isolated restore tests.</small></article><article><span>04</span><strong>Escalate findings</strong><small>Report suspected vulnerabilities or security concerns directly to HisabTech.</small></article></div>
      </section>

      <section className="marketing-cta marketing-cta-v2">
        <div><span>Responsible security reporting</span><h2>Found a security concern?</h2><p>Provide the affected route, observed behavior, reproduction steps and any relevant timestamps. Do not include customer passwords or unnecessary personal data.</p></div>
        <div><a className="marketing-start marketing-large" href="mailto:mahir@hisabtech.com?subject=Responsible%20security%20report%20for%20HisabERP">Report securely by email</a><Link className="marketing-demo marketing-large" href="/integrations">Review integrations</Link></div>
      </section>
    </MarketingPageShell>
  );
}
