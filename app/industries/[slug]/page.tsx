import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "../../../components/marketing-site-chrome";
import { getMarketingIndustry, marketingIndustries } from "../../../lib/marketing-industries";
import { marketingModules } from "../../../lib/marketing-modules";

export function generateStaticParams() {
  return marketingIndustries.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const industry = getMarketingIndustry(slug);
  if (!industry) return { title: "Industry solution" };
  return { title: industry.title, description: industry.summary };
}

export default async function IndustrySolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = getMarketingIndustry(slug);
  if (!industry) notFound();
  const relatedModules = industry.modules.map((moduleSlug) => marketingModules.find((module) => module.slug === moduleSlug)).filter(Boolean);
  const relatedIndustries = marketingIndustries.filter((item) => item.slug !== industry.slug).slice(0, 3);

  return (
    <MarketingPageShell>
      <section className="industry-detail-hero">
        <div><span className="marketing-eyebrow">{industry.eyebrow}</span><h1>{industry.title}</h1><p>{industry.summary}</p><div className="marketing-hero-actions"><Link href={`/request-demo?industry=${industry.slug}`} className="marketing-start marketing-large">Request a focused demo</Link><Link href="/pricing" className="marketing-demo marketing-large">View pricing</Link></div><div className="industry-team-pills">{industry.teams.map((team)=><span key={team}>{team}</span>)}</div></div>
        <div className="industry-metric-board"><header><div><small>{industry.shortTitle}</small><strong>Management overview</strong></div><span>Illustrative workspace</span></header><div>{industry.metrics.map((metric)=><article key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.detail}</span></article>)}</div><footer><span>Connected records</span><b>Sales · Costs · Stock · Balances · Reporting</b></footer></div>
      </section>

      <section className="industry-problem-outcome"><article><span>Operating challenge</span><h2>The problem businesses recognize</h2><p>{industry.challenge}</p></article><article><span>HisabERP outcome</span><h2>The management position to create</h2><p>{industry.outcome}</p></article></section>

      <section className="marketing-section industry-capability-section"><div className="marketing-section-heading"><span>Relevant capabilities</span><h2>Prioritize the controls that matter most in {industry.shortTitle.toLowerCase()}.</h2><p>The implementation can focus the workspace, user access and reporting around these operating requirements.</p></div><div className="industry-capability-grid">{industry.capabilities.map((capability,index)=><article key={capability}><span>{String(index+1).padStart(2,"0")}</span><h3>{capability}</h3><p>Connected to the same controlled business records used across the wider HisabERP workspace.</p></article>)}</div></section>

      <section className="industry-workflow-section"><div className="marketing-section-heading"><span>Daily workflow</span><h2>A clearer operating rhythm from activity to review.</h2></div><div className="industry-workflow-grid">{industry.workflow.map((step,index)=><article key={step.title}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div></section>

      <section className="marketing-section industry-module-section"><div className="marketing-section-heading"><span>Recommended product foundation</span><h2>Modules commonly combined for this industry.</h2></div><div className="industry-module-grid">{relatedModules.map((module)=><article key={module!.slug}><span>{module!.number}</span><h3>{module!.shortTitle}</h3><p>{module!.summary}</p><Link href={`/product/${module!.slug}`}>Explore module →</Link></article>)}</div></section>

      <section className="industry-related-section"><div><span className="marketing-eyebrow">Explore related operating models</span><h2>Compare how HisabERP supports other industries.</h2></div><div>{relatedIndustries.map((item)=><Link href={`/industries/${item.slug}`} key={item.slug}><span>{item.number}</span><strong>{item.shortTitle}</strong><small>{item.eyebrow}</small></Link>)}</div></section>

      <section className="marketing-cta marketing-cta-v2"><div><span>See this workflow using your business context</span><h2>Request a demonstration focused on {industry.shortTitle.toLowerCase()}.</h2><p>Share the team structure, current records and main control problem. HisabTech will use the session to show the most relevant workflow.</p></div><div><Link href={`/request-demo?industry=${industry.slug}`} className="marketing-start marketing-large">Request demo</Link><Link href="/industries" className="marketing-demo marketing-large">All industries</Link></div></section>
    </MarketingPageShell>
  );
}
