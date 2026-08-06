import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { inspectableProof, proofStandards, referencePrograms } from "../../lib/marketing-customer-proof";

export const metadata = {
  title: "Customer Proof",
  description: "See how HisabTech verifies HisabERP customer stories and join the reference customer program.",
};

export default function CustomerStoriesPage() {
  return (
    <MarketingPageShell>
      <section className="proof-page-hero">
        <div>
          <span className="marketing-eyebrow">Customer evidence</span>
          <h1>Real proof, published only when it can be verified.</h1>
          <p>HisabTech does not use invented company logos, fabricated testimonials or unsupported performance numbers. Customer stories are published only after the business, implementation scope and measured result have been reviewed.</p>
          <div className="marketing-hero-actions">
            <a className="marketing-start marketing-large" href="mailto:mahir@hisabtech.com?subject=HisabERP%20reference%20customer%20program">Join the reference program</a>
            <Link className="marketing-demo marketing-large" href="/product-tour">Inspect the product first</Link>
          </div>
        </div>
        <aside className="proof-standard-card">
          <span>Publication standard</span>
          <strong>Evidence before promotion</strong>
          <p>Every public case study must include a confirmed customer, a documented starting point, a defined implementation scope and an approved result.</p>
          <small>Stories remain private until the participating business approves publication.</small>
        </aside>
      </section>

      <section className="proof-section proof-section-light">
        <div className="marketing-section-heading marketing-section-heading-wide">
          <span>Proof available today</span>
          <h2>Evaluate the product through evidence you can inspect directly.</h2>
          <p>Until verified customer stories are ready for publication, HisabTech directs buyers to product, pricing and security evidence rather than replacing missing proof with marketing claims.</p>
        </div>
        <div className="inspectable-proof-grid">
          {inspectableProof.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link href={item.href}>{item.action} →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="proof-section">
        <div className="marketing-section-heading marketing-section-heading-wide">
          <span>Reference customer program</span>
          <h2>Measure operational improvement with a clear baseline.</h2>
          <p>The first reference programs focus on workflows where results can be measured without exaggeration.</p>
        </div>
        <div className="reference-program-grid">
          {referencePrograms.map((program) => (
            <article key={program.title}>
              <header><span>{program.number}</span><b>{program.status}</b></header>
              <h3>{program.title}</h3>
              <p>{program.summary}</p>
              <strong>Measurement areas</strong>
              <ul>{program.measures.map((measure) => <li key={measure}>{measure}</li>)}</ul>
              <a href="mailto:mahir@hisabtech.com?subject=HisabERP%20reference%20customer%20program">Discuss participation →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="proof-dark-section">
        <div className="marketing-section-heading marketing-section-heading-wide">
          <span>How a story becomes publishable</span>
          <h2>Five checks protect the customer and the credibility of HisabERP.</h2>
        </div>
        <div className="proof-standard-grid">
          {proofStandards.map((standard) => (
            <article key={standard.number}>
              <span>{standard.number}</span>
              <h3>{standard.title}</h3>
              <p>{standard.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-cta marketing-cta-v2">
        <div><span>Use HisabERP in a measurable pilot</span><h2>Build the next verified HisabERP customer story.</h2><p>HisabTech will define the baseline, implementation scope and success measures with your team before any public claim is considered.</p></div>
        <div><a className="marketing-start marketing-large" href="mailto:mahir@hisabtech.com?subject=HisabERP%20reference%20customer%20program">Contact HisabTech</a><Link className="marketing-demo marketing-large" href="/request-demo">Request a demo</Link></div>
      </section>
    </MarketingPageShell>
  );
}
