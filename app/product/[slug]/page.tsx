import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "../../../components/marketing-site-chrome";
import { getMarketingModule, marketingModules } from "../../../lib/marketing-modules";

export function generateStaticParams() {
  return marketingModules.map((module) => ({ slug: module.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const module = getMarketingModule(slug);
  if (!module) return { title: "HisabERP Product Module" };
  return {
    title: `${module.shortTitle} | HisabERP`,
    description: module.summary,
  };
}

export default async function ProductModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = getMarketingModule(slug);
  if (!module) notFound();

  const related = marketingModules.filter((item) => item.slug !== module.slug).slice(0, 3);

  return (
    <MarketingPageShell>
      <section className="module-page-hero">
        <div className="module-page-hero-copy">
          <span className="marketing-eyebrow">{module.eyebrow}</span>
          <p className="module-page-index">HisabERP module {module.number}</p>
          <h1>{module.title}</h1>
          <p>{module.summary}</p>
          <div className="marketing-hero-actions">
            <Link href="/auth/email-sign-up" className="marketing-start marketing-large">Start free</Link>
            <Link href="/request-demo" className="marketing-demo marketing-large">Request a demo</Link>
            <Link href="/product-tour" className="marketing-text-action">Open product tour <span aria-hidden="true">→</span></Link>
          </div>
        </div>

        <div className="module-preview-card">
          <header><div><img src="/hisab-logo.svg" alt="" width="34" height="34"/><span><small>HisabERP</small><strong>{module.shortTitle}</strong></span></div><b>Live workspace</b></header>
          <div className="module-preview-metrics">{module.metrics.map((metric) => <article key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.note}</span></article>)}</div>
          <div className="module-preview-table"><header><strong>Current activity</strong><small>Operational records</small></header>{module.previewRows.map((row) => <p key={row.label}><span><strong>{row.label}</strong><small>{row.meta}</small></span><b>{row.value}</b></p>)}</div>
        </div>
      </section>

      <section className="module-problem-outcome">
        <article><span>Without a connected system</span><h2>The operational problem</h2><p>{module.problem}</p></article>
        <article><span>With HisabERP</span><h2>The business outcome</h2><p>{module.outcome}</p></article>
      </section>

      <section className="marketing-section module-capabilities-section">
        <div className="marketing-section-heading"><span>Core capabilities</span><h2>Everything required to run this workflow with greater control.</h2></div>
        <div className="module-capability-grid">{module.features.map((feature, index) => <article key={feature}><b>{String(index + 1).padStart(2, "0")}</b><p>{feature}</p></article>)}</div>
      </section>

      <section className="module-workflow-section">
        <div className="marketing-section-heading marketing-section-heading-centered"><span>How the workflow operates</span><h2>From business activity to a reliable management record.</h2></div>
        <div className="module-workflow-grid">{module.workflow.map((step) => <article key={step.step}><span>{step.step}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
      </section>

      <section className="module-audience-section">
        <div><span className="marketing-eyebrow">Designed for real operating teams</span><h2>Useful across the people responsible for this part of the business.</h2><p>HisabERP gives each role access to the information and actions required for their responsibility, while keeping the broader business record connected.</p></div>
        <div>{module.audiences.map((audience) => <span key={audience}>{audience}</span>)}</div>
      </section>

      <section className="marketing-section related-modules-section">
        <div className="marketing-section-heading"><span>Continue exploring</span><h2>See the connected modules around {module.shortTitle.toLowerCase()}.</h2></div>
        <div className="related-module-grid">{related.map((item) => <Link href={`/product/${item.slug}`} key={item.slug}><span>{item.number}</span><h3>{item.shortTitle}</h3><p>{item.summary}</p><b>Explore module →</b></Link>)}</div>
      </section>

      <section className="marketing-cta marketing-cta-v2">
        <div><span>Evaluate {module.shortTitle.toLowerCase()} in your business</span><h2>See how this workflow fits your current operations.</h2><p>Start a workspace or request a demonstration based on your company, industry and reporting needs.</p></div>
        <div><Link href="/auth/email-sign-up" className="marketing-start marketing-large">Start free</Link><Link href="/request-demo" className="marketing-demo marketing-large">Request a demo</Link></div>
      </section>
    </MarketingPageShell>
  );
}
