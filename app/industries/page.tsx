import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "../../components/marketing-site-chrome";
import { marketingIndustries } from "../../lib/marketing-industries";

export const metadata: Metadata = {
  title: "ERP Solutions by Industry",
  description: "Explore HisabERP solutions for retail, wholesale, hospitality, services, construction, manufacturing, cooperatives, trade and multi-branch Ethiopian businesses.",
};

export default function IndustriesPage() {
  return (
    <MarketingPageShell>
      <section className="industry-index-hero">
        <div><span className="marketing-eyebrow">Industry solutions</span><h1>See HisabERP through the workflow of your business.</h1><p>Every industry uses sales, expenses, inventory, customers, suppliers and finance differently. These solution pages show how connected ERP records support the decisions each team makes.</p><div className="marketing-hero-actions"><Link href="/request-demo" className="marketing-start marketing-large">Request an industry demo</Link><Link href="/product-tour" className="marketing-demo marketing-large">Explore the product</Link></div></div>
        <div className="industry-index-summary"><span>Industry coverage</span><strong>{marketingIndustries.length}</strong><p>Focused solution paths for Ethiopian businesses moving from manual records to a connected operating system.</p><div><b>Local context</b><b>Connected modules</b><b>Practical workflows</b></div></div>
      </section>

      <section className="marketing-section industry-index-section">
        <div className="marketing-section-heading marketing-section-heading-wide"><span>Choose your operating model</span><h2>Start with the business problems your team already recognizes.</h2><p>Each solution connects the most relevant product modules, daily workflow and management indicators for that industry.</p></div>
        <div className="industry-card-grid">{marketingIndustries.map((industry)=><article key={industry.slug}><span>{industry.number}</span><small>{industry.eyebrow}</small><h2>{industry.shortTitle}</h2><p>{industry.summary}</p><div>{industry.teams.slice(0,3).map((team)=><b key={team}>{team}</b>)}</div><Link href={`/industries/${industry.slug}`}>View solution <i aria-hidden="true">→</i></Link></article>)}</div>
      </section>

      <section className="industry-connected-section"><div><span className="marketing-eyebrow">One product foundation</span><h2>Industry relevance without creating disconnected software.</h2><p>HisabERP uses the same controlled business records across industries. The difference is which workflows, metrics and modules receive priority during setup.</p></div><div className="industry-connected-list"><p><span>Sales activity</span><b>Updates revenue, customer balances and stock</b></p><p><span>Purchasing activity</span><b>Updates supplier obligations, expenses and inventory</b></p><p><span>Payments</span><b>Update cash position and reconciliation records</b></p><p><span>Management reporting</span><b>Combines activity into decision-ready indicators</b></p></div></section>

      <section className="marketing-cta marketing-cta-v2"><div><span>Do not see your exact industry?</span><h2>HisabTech can map your workflow before recommending a configuration.</h2><p>Describe how the organization sells, buys, manages stock, collects money and reports performance. We will show the closest HisabERP operating model.</p></div><div><Link href="/request-demo" className="marketing-start marketing-large">Discuss your industry</Link><Link href="/ethiopia" className="marketing-demo marketing-large">Why HisabERP for Ethiopia</Link></div></section>
    </MarketingPageShell>
  );
}
