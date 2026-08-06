import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { PublicHelpCenter } from "../../components/public-help-center";
import { helpArticles, helpCategories } from "../../lib/help-center-content";

export const metadata: Metadata = {
  title: "HisabERP Help Center",
  description: "Search practical HisabERP guides for setup, sales, inventory, finance, security, reconciliation and data migration.",
};

const featuredSlugs = ["create-your-organization", "create-your-first-customer-and-invoice", "prepare-data-for-import", "enable-administrator-mfa"];

export default function HelpCenterPage() {
  const featured = featuredSlugs.map((slug) => helpArticles.find((article) => article.slug === slug)).filter(Boolean);
  return (
    <MarketingPageShell>
      <section className="help-public-hero">
        <div>
          <span className="marketing-eyebrow">HisabERP Help Center</span>
          <h1>Practical guidance for the work your team needs to complete.</h1>
          <p>Search setup, sales, inventory, finance, security and migration guides. Every article separates product steps from business validation responsibilities.</p>
          <div className="marketing-hero-actions"><a href="mailto:mahir@hisabtech.com?subject=HisabERP%20support%20request" className="marketing-start marketing-large">Contact support</a><Link href="/product-tour" className="marketing-demo marketing-large">Open product tour</Link></div>
        </div>
        <div className="help-public-stats"><article><strong>{helpArticles.length}</strong><span>practical guides</span></article><article><strong>{helpCategories.length}</strong><span>workflow categories</span></article><article><strong>EN</strong><span>public documentation</span></article><article><strong>ET</strong><span>Ethiopian business context</span></article></div>
      </section>

      <section className="help-category-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Browse by workflow</span><h2>Start from the responsibility—not the software menu.</h2><p>Each category groups the setup, controls and validation steps required to complete a real business task.</p></div>
        <div className="help-category-grid">{helpCategories.map((category, index) => <a href={`#guides`} key={category.slug}><span>{String(index + 1).padStart(2, "0")}</span><strong>{category.title}</strong><small>{category.summary}</small></a>)}</div>
      </section>

      <section className="help-featured-section">
        <div className="marketing-section-heading"><span>Recommended first guides</span><h2>Build the workspace on a controlled foundation.</h2></div>
        <div>{featured.map((article) => article ? <Link href={`/help-center/${article.slug}`} key={article.slug}><span>{helpCategories.find((category) => category.slug === article.category)?.title}</span><h3>{article.title}</h3><p>{article.summary}</p><b>{article.readTime} →</b></Link> : null)}</div>
      </section>

      <section className="help-search-section" id="guides">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Search all documentation</span><h2>Find the guide that matches the next action.</h2><p>Search by task, module, role or business term. Results update immediately without leaving the page.</p></div>
        <PublicHelpCenter articles={helpArticles} categories={helpCategories} />
      </section>

      <section className="help-support-boundary"><div><span>Documentation boundary</span><h2>Guides explain product workflows, not professional legal or tax advice.</h2><p>Invoice, tax, payroll, privacy and statutory requirements must be confirmed for the organization’s actual jurisdiction and operating circumstances. Contact a qualified adviser when the decision requires professional interpretation.</p></div><Link href="/trust" className="marketing-demo marketing-large">Review the Trust Center</Link></section>

      <section className="marketing-cta marketing-cta-v2"><div><span>Still blocked?</span><h2>Send HisabTech the workflow, page and exact error you are seeing.</h2><p>Include the organization context and the action you were attempting, but never send passwords, secret keys, authenticator codes or full payment credentials.</p></div><div><a href="mailto:mahir@hisabtech.com?subject=HisabERP%20support%20request" className="marketing-start marketing-large">Email support</a><Link href="/request-demo" className="marketing-demo marketing-large">Request guided onboarding</Link></div></section>
    </MarketingPageShell>
  );
}
