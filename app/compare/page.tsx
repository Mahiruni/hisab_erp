import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { marketingComparisons } from "../../lib/marketing-comparisons";

export const metadata: Metadata = {
  title: "Compare HisabERP",
  description: "Compare HisabERP with spreadsheets, notebooks, disconnected tools, desktop software and larger enterprise ERP approaches.",
};

export default function ComparisonHubPage() {
  return (
    <MarketingPageShell>
      <section className="comparison-hub-hero">
        <div>
          <span className="marketing-eyebrow">Honest ERP comparisons</span>
          <h1>Compare operating models—not only feature lists.</h1>
          <p>The right system depends on the number of users, control risks, reporting effort, connectivity and specialist requirements. These comparisons explain where HisabERP can improve operations and where another approach may still be appropriate.</p>
          <div className="marketing-hero-actions"><Link href="/product-tour" className="marketing-start marketing-large">Inspect the product</Link><Link href="/request-demo?topic=comparison" className="marketing-demo marketing-large">Discuss your requirements</Link></div>
        </div>
        <div className="comparison-principles">
          <article><span>01</span><strong>No false certainty</strong><p>Every comparison includes limitations and decision questions.</p></article>
          <article><span>02</span><strong>Workflow before branding</strong><p>Evaluate the real process, records and people involved.</p></article>
          <article><span>03</span><strong>Migration included</strong><p>Consider how the source will be prepared and validated.</p></article>
          <article><span>04</span><strong>Fit can change</strong><p>A tool that works today may become risky as the business grows.</p></article>
        </div>
      </section>

      <section className="marketing-section comparison-index-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Choose a current operating model</span><h2>Start with the system your business relies on today.</h2><p>Each comparison covers daily transactions, access, reporting, auditability, implementation fit and the most important questions to answer before changing systems.</p></div>
        <div className="comparison-index-grid">
          {marketingComparisons.map((comparison) => (
            <Link href={`/compare/${comparison.slug}`} key={comparison.slug}>
              <span>{comparison.number}</span>
              <h2>{comparison.shortTitle}</h2>
              <p>{comparison.summary}</p>
              <small>{comparison.bestFor}</small>
              <b>Open comparison →</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="comparison-method-section">
        <div><span className="marketing-eyebrow">Evaluation method</span><h2>A practical five-question decision frame.</h2><p>Use the same questions for every vendor or internal option so the decision remains tied to business outcomes.</p></div>
        <ol><li><span>01</span><div><strong>What is the source of truth?</strong><p>Identify where customers, products, balances and approvals currently live.</p></div></li><li><span>02</span><div><strong>Where does manual re-entry happen?</strong><p>Measure duplicated data, exports and reconciliation work.</p></div></li><li><span>03</span><div><strong>Which errors create real risk?</strong><p>Prioritize stock, cash, payroll, customer debt and access-control failures.</p></div></li><li><span>04</span><div><strong>What must remain specialized?</strong><p>Do not remove a specialist tool unless the replacement workflow is proven.</p></div></li><li><span>05</span><div><strong>How will the cutover be validated?</strong><p>Define opening balances, reviewers, evidence and rollback decisions.</p></div></li></ol>
      </section>

      <section className="comparison-disclaimer"><div><span>Comparison policy</span><h2>HisabTech does not claim that one ERP is correct for every organization.</h2><p>The pages describe product and operating-model differences based on the current HisabERP implementation. Requirements such as global consolidation, complex manufacturing, country-specific statutory reporting or offline operation require separate validation.</p></div><Link href="/migration" className="marketing-demo marketing-large">Review migration planning</Link></section>

      <section className="marketing-cta marketing-cta-v2"><div><span>Bring your current workflow</span><h2>Compare HisabERP using the records and controls that matter to your team.</h2><p>A focused evaluation should use your actual transaction flow, reporting needs, user responsibilities and migration constraints.</p></div><div><Link href="/request-demo?topic=comparison" className="marketing-start marketing-large">Request focused demo</Link><Link href="/pricing" className="marketing-demo marketing-large">View ETB pricing</Link></div></section>
    </MarketingPageShell>
  );
}
