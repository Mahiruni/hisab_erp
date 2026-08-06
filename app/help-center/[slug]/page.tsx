import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "../../../components/marketing-site-chrome";
import { getHelpArticle, getHelpCategory, helpArticles } from "../../../lib/help-center-content";

export function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) return { title: "HisabERP help" };
  return { title: article.title, description: article.summary };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();
  const category = getHelpCategory(article.category);
  const related = article.related.map((relatedSlug) => getHelpArticle(relatedSlug)).filter(Boolean);

  return (
    <MarketingPageShell>
      <section className="help-article-hero">
        <div>
          <nav aria-label="Breadcrumb"><Link href="/help-center">Help Center</Link><span>/</span><span>{category?.title || article.category}</span></nav>
          <span className="marketing-eyebrow">{category?.title || article.category}</span>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
          <div className="help-article-meta"><span>{article.readTime}</span><span>{article.audience}</span><span>Updated for current HisabERP workflow</span></div>
        </div>
        <aside><span>Before you begin</span><ul>{article.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></aside>
      </section>

      <section className="help-article-layout">
        <aside className="help-article-toc"><strong>In this guide</strong>{article.steps.map((step, index) => <a href={`#step-${index + 1}`} key={step.title}><span>{String(index + 1).padStart(2, "0")}</span>{step.title}</a>)}<a href="#important-notes"><span>!</span>Important notes</a></aside>
        <article className="help-article-content">
          {article.steps.map((step, index) => <section id={`step-${index + 1}`} key={step.title}><span>Step {String(index + 1).padStart(2, "0")}</span><h2>{step.title}</h2><p>{step.text}</p></section>)}
          <section className="help-article-notes" id="important-notes"><span>Important notes</span><h2>Validation and responsibility</h2><ul>{article.notes.map((note) => <li key={note}>{note}</li>)}</ul></section>
        </article>
      </section>

      {related.length ? <section className="help-related-section"><div className="marketing-section-heading"><span>Continue learning</span><h2>Related HisabERP guides</h2></div><div>{related.map((item) => item ? <Link href={`/help-center/${item.slug}`} key={item.slug}><span>{getHelpCategory(item.category)?.title}</span><strong>{item.title}</strong><small>{item.summary}</small><b>{item.readTime} →</b></Link> : null)}</div></section> : null}

      <section className="help-article-support"><div><span>Need support with this workflow?</span><h2>Describe the exact action and where the process stopped.</h2><p>Include the page, expected result and visible error. Never send passwords, authenticator codes, secret keys or complete payment credentials.</p></div><div><a href={`mailto:mahir@hisabtech.com?subject=${encodeURIComponent(`HisabERP help: ${article.title}`)}`} className="marketing-start marketing-large">Contact support</a><Link href="/help-center" className="marketing-demo marketing-large">All guides</Link></div></section>
    </MarketingPageShell>
  );
}
