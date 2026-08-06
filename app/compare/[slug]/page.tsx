import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "../../../components/marketing-site-chrome";
import { getMarketingComparison, marketingComparisons } from "../../../lib/marketing-comparisons";

export function generateStaticParams() {
  return marketingComparisons.map((comparison) => ({ slug: comparison.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getMarketingComparison(slug);
  if (!comparison) return { title: "HisabERP comparison" };
  return { title: comparison.title, description: comparison.summary };
}

export default async function ComparisonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = getMarketingComparison(slug);
  if (!comparison) notFound();
  const related = marketingComparisons.filter((item) => item.slug !== comparison.slug).slice(0, 3);

  return (
    <MarketingPageShell>
      <section className="comparison-detail-hero">
        <div>
          <span className="marketing-eyebrow">{comparison.eyebrow}</span>
          <h1>{comparison.title}</h1>
          <p>{comparison.summary}</p>
          <div className="marketing-hero-actions"><Link href="/request-demo?topic=comparison" className="marketing-start marketing-large">Compare using my workflow</Link><Link href="/migration" className="marketing-demo marketing-large">Plan migration</Link></div>
          <div className="comparison-fit-note"><strong>Best suited to evaluate when:</strong><span>{comparison.bestFor}</span></div>
        </div>
        <div className="comparison-versus-card">
          <span>Operating model comparison</span>
          <div><article><small>Current approach</small><strong>{comparison.alternativeLabel}</strong></article><b>VS</b><article><small>Connected workspace</small><strong>{comparison.hisabLabel}</strong></article></div>
          <p>{comparison.caution}</p>
        </div>
      </section>

      <section className="comparison-table-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Capability-by-capability review</span><h2>Where the operating experience changes.</h2><p>The comparison focuses on how records are created, controlled and used—not only whether a feature name appears on a checklist.</p></div>
        <div className="comparison-table" role="table" aria-label={`${comparison.shortTitle} capability comparison`}>
          <div className="comparison-table-head" role="row"><strong role="columnheader">Capability</strong><strong role="columnheader">{comparison.alternativeLabel}</strong><strong role="columnheader">{comparison.hisabLabel}</strong><strong role="columnheader">Why it matters</strong></div>
          {comparison.rows.map((row) => <div className="comparison-table-row" role="row" key={row.capability}><strong role="cell">{row.capability}</strong><span role="cell">{row.alternative}</span><span role="cell">{row.hisab}</span><p role="cell">{row.why}</p></div>)}
        </div>
      </section>

      <section className="comparison-questions-section">
        <div><span className="marketing-eyebrow">Questions before deciding</span><h2>Test the business case against your current reality.</h2><p>A useful evaluation should produce specific answers, owners and evidence for each question.</p></div>
        <ol>{comparison.decisionQuestions.map((question, index) => <li key={question}><span>{String(index + 1).padStart(2, "0")}</span><strong>{question}</strong></li>)}</ol>
      </section>

      <section className="comparison-next-step-section">
        <div><span>Recommended transition approach</span><h2>{comparison.nextStep}</h2><p>Migration scope, historical data, opening balances and required integrations must be confirmed during assessment. Do not retire the existing source until the new position is reconciled and approved.</p></div>
        <div><Link href="/migration" className="marketing-start marketing-large">Open migration center</Link><Link href="/help-center/validate-opening-balances-and-cutover" className="marketing-demo marketing-large">Read cutover guide</Link></div>
      </section>

      <section className="marketing-section comparison-related-section">
        <div className="marketing-section-heading"><span>Other comparisons</span><h2>Evaluate another operating model.</h2></div>
        <div>{related.map((item) => <Link href={`/compare/${item.slug}`} key={item.slug}><span>{item.number}</span><strong>{item.shortTitle}</strong><small>{item.summary}</small><b>Compare →</b></Link>)}</div>
      </section>

      <section className="marketing-cta marketing-cta-v2"><div><span>Validate the highest-risk workflow</span><h2>Use a focused demonstration to test whether HisabERP fits.</h2><p>Bring examples of the records, reports and approval steps your team uses today. The evaluation should confirm gaps as clearly as it confirms strengths.</p></div><div><Link href="/request-demo?topic=comparison" className="marketing-start marketing-large">Request comparison demo</Link><Link href="/compare" className="marketing-demo marketing-large">All comparisons</Link></div></section>
    </MarketingPageShell>
  );
}
