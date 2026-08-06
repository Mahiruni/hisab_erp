import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "../../../components/marketing-site-chrome";
import { getMarketingResource, marketingResources } from "../../../lib/marketing-resources";
import { getPublicLanguage, localize } from "../../../lib/public-localization";

export function generateStaticParams() {
  return marketingResources.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = getMarketingResource((await params).slug);
  if (!article) return { title: "Business guide" };
  return { title: article.title.en, description: article.summary.en };
}

const copy = {
  en: {
    center: "Business Learning Center",
    read: "min read",
    for: "For",
    article: "Practical operating guide",
    apply: "Apply this guide",
    applyTitle: "Turn the guidance into a controlled HisabERP workflow.",
    applyText: "Use a focused demo to map this operating routine to your team, records and approval responsibilities.",
    demo: "Request a focused demo",
    migration: "Migration guidance",
    related: "Continue learning",
    relatedTitle: "Related guides for the next operating decision.",
    open: "Open guide",
  },
  am: {
    center: "የንግድ ትምህርት ማዕከል",
    read: "ደቂቃ ንባብ",
    for: "ለ",
    article: "ተግባራዊ የአሰራር መመሪያ",
    apply: "ይህን መመሪያ ይተግብሩ",
    applyTitle: "መመሪያውን ወደ ቁጥጥር ያለው የHisabERP የሥራ ሂደት ይቀይሩ።",
    applyText: "ይህን የሥራ ልማድ ከቡድንዎ፣ ከመዝገቦችዎ እና ከማጽደቅ ኃላፊነቶችዎ ጋር ለማገናኘት የተመረጠ ማሳያ ይጠቀሙ።",
    demo: "የተመረጠ ማሳያ ይጠይቁ",
    migration: "የሽግግር መመሪያ",
    related: "መማርዎን ይቀጥሉ",
    relatedTitle: "ለቀጣዩ የአሰራር ውሳኔ ተዛማጅ መመሪያዎች።",
    open: "መመሪያውን ይክፈቱ",
  },
} as const;

export default async function ResourceArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getMarketingResource((await params).slug);
  if (!article) notFound();
  const language = await getPublicLanguage();
  const c = copy[language];
  const related = marketingResources.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <MarketingPageShell>
      <article className="resource-article">
        <header className="resource-article-hero">
          <div>
            <Link href="/resources" className="resource-back-link">← {c.center}</Link>
            <span className="marketing-eyebrow">{localize(article.category, language)}</span>
            <h1>{localize(article.title, language)}</h1>
            <p>{localize(article.summary, language)}</p>
            <div className="resource-article-meta"><span>{article.readingMinutes} {c.read}</span><span>{c.for} {localize(article.audience, language)}</span><span>{article.published}</span></div>
          </div>
          <aside><span>{c.article}</span><strong>{localize(article.category, language)}</strong><p>{localize(article.audience, language)}</p></aside>
        </header>

        <div className="resource-article-body">
          {article.sections.map((section, index) => (
            <section key={section.heading.en}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h2>{localize(section.heading, language)}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph.en}>{localize(paragraph, language)}</p>)}{section.checklist ? <ul>{section.checklist.map((item) => <li key={item.en}>{localize(item, language)}</li>)}</ul> : null}</div>
            </section>
          ))}
        </div>
      </article>

      <section className="resource-apply-section"><div><span>{c.apply}</span><h2>{c.applyTitle}</h2><p>{c.applyText}</p></div><div><Link href={`/request-demo?source=resource&topic=${article.slug}`} className="marketing-start marketing-large">{c.demo}</Link><Link href="/migration" className="marketing-demo marketing-large">{c.migration}</Link></div></section>

      <section className="marketing-section resource-related-section"><div className="marketing-section-heading"><span>{c.related}</span><h2>{c.relatedTitle}</h2></div><div>{related.map((item) => <Link href={`/resources/${item.slug}`} key={item.slug}><span>{localize(item.category, language)}</span><strong>{localize(item.title, language)}</strong><small>{localize(item.summary, language)}</small><b>{c.open} →</b></Link>)}</div></section>
    </MarketingPageShell>
  );
}
