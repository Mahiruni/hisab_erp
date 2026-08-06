"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HelpArticle, HelpCategory } from "../lib/help-center-content";

export function PublicHelpCenter({ articles, categories }: { articles: HelpArticle[]; categories: HelpCategory[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatch = category === "all" || article.category === category;
      if (!categoryMatch) return false;
      if (!normalized) return true;
      const searchable = [article.title, article.summary, article.audience, article.category, ...article.tags].join(" ").toLowerCase();
      return searchable.includes(normalized);
    });
  }, [articles, category, query]);

  return (
    <div className="public-help-experience">
      <section className="public-help-search" aria-label="Search HisabERP help articles">
        <label htmlFor="help-search">Search the help center</label>
        <div><span aria-hidden="true">⌕</span><input id="help-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: invoice, stock, MFA, migration or reconciliation" /></div>
        <small>{filtered.length} {filtered.length === 1 ? "guide" : "guides"} available</small>
      </section>

      <div className="public-help-filter" role="group" aria-label="Filter help articles by category">
        <button type="button" className={category === "all" ? "active" : undefined} onClick={() => setCategory("all")}>All guides</button>
        {categories.map((item) => <button type="button" className={category === item.slug ? "active" : undefined} onClick={() => setCategory(item.slug)} key={item.slug}>{item.title}</button>)}
      </div>

      {filtered.length ? (
        <div className="public-help-results">
          {filtered.map((article) => {
            const categoryRecord = categories.find((item) => item.slug === article.category);
            return (
              <Link href={`/help-center/${article.slug}`} key={article.slug}>
                <span>{categoryRecord?.title || article.category}</span>
                <h2>{article.title}</h2>
                <p>{article.summary}</p>
                <footer><small>{article.audience}</small><b>{article.readTime} →</b></footer>
              </Link>
            );
          })}
        </div>
      ) : (
        <section className="public-help-empty" role="status">
          <span aria-hidden="true">?</span>
          <h2>No guide matches that search.</h2>
          <p>Try a broader term or contact HisabTech with the workflow you are trying to complete.</p>
          <a href="mailto:mahir@hisabtech.com?subject=HisabERP%20help%20request">Contact support</a>
        </section>
      )}
    </div>
  );
}
