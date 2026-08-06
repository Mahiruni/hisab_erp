import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { integrationStatusCopy, marketingIntegrations, type IntegrationStatus } from "../../lib/marketing-integrations";

export const metadata = {
  title: "Integrations",
  description: "Review available, configuration-required, beta and planned HisabERP integrations.",
};

const statusOrder: IntegrationStatus[] = ["available", "configuration", "beta", "planned"];

export default function IntegrationsPage() {
  return (
    <MarketingPageShell>
      <section className="integration-page-hero">
        <div>
          <span className="marketing-eyebrow">HisabERP integrations</span>
          <h1>Know what works today, what needs configuration and what is still planned.</h1>
          <p>The directory uses explicit statuses so an authentication button, callback route or roadmap item is never presented as a fully activated production integration without the required provider setup.</p>
          <div className="marketing-hero-actions"><Link className="marketing-start marketing-large" href="/request-demo">Discuss an integration</Link><Link className="marketing-demo marketing-large" href="/trust">Review security controls</Link></div>
        </div>
        <aside className="integration-status-panel">
          {statusOrder.map((status) => <article key={status}><b data-status={status}>{integrationStatusCopy[status].label}</b><p>{integrationStatusCopy[status].description}</p></article>)}
        </aside>
      </section>

      <section className="integration-directory-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Connection directory</span><h2>A transparent register of the current integration surface.</h2><p>Provider credentials, commercial agreements and production validation remain separate from the existence of an application path.</p></div>
        <div className="integration-directory-grid">
          {marketingIntegrations.map((integration) => (
            <article key={integration.name} data-status={integration.status}>
              <header><span>{integration.category}</span><b>{integration.statusLabel}</b></header>
              <h3>{integration.name}</h3>
              <p>{integration.summary}</p>
              <strong>Supported scope</strong>
              <ul>{integration.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
              <small>{integration.requirement}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="integration-method-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Production readiness path</span><h2>An integration becomes “Available” only after the complete path is verified.</h2></div>
        <div className="integration-method-grid"><article><span>01</span><h3>Confirm the business use case</h3><p>Define the exact records, provider events, teams and reconciliation outcome required.</p></article><article><span>02</span><h3>Configure credentials safely</h3><p>Store provider secrets in deployment configuration rather than source code or browser-visible settings.</p></article><article><span>03</span><h3>Validate provider behavior</h3><p>Test signatures, tokens, payload variations, duplicate events, failures and recovery handling.</p></article><article><span>04</span><h3>Control production rollout</h3><p>Document ownership, monitoring, support escalation and the status shown to customers.</p></article></div>
      </section>

      <section className="integration-request-section">
        <div><span className="marketing-eyebrow">Need another connection?</span><h2>Describe the workflow—not only the provider name.</h2><p>Share the source system, records involved, expected direction, update frequency, authentication method and business outcome. HisabTech can then assess whether the work belongs in configuration, a controlled beta or the product roadmap.</p></div>
        <a className="marketing-start marketing-large" href="mailto:mahir@hisabtech.com?subject=HisabERP%20integration%20request">Submit an integration request</a>
      </section>
    </MarketingPageShell>
  );
}
