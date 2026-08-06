"use client";

import Link from "next/link";
import { getErpModule } from "../lib/erp-modules";
import { LanguageSelector, useLanguage } from "./language-provider";

export function ModuleDetail({ slug }: { slug: string }) {
  const { dictionary } = useLanguage();
  const module = getErpModule(slug);
  if (!module) return null;

  const localized = dictionary.moduleItems[module.slug];
  const copy = dictionary.moduleDetail;

  return (
    <main className="module-detail-page">
      <div className="module-detail-inner">
        <div className="module-toolbar"><Link className="back-link" href="/modules">← {copy.allModules}</Link><LanguageSelector/></div>
        <header className="module-detail-header">
          <div><p className="eyebrow">{copy.phase} {module.phase} · {dictionary.priorityLabels[module.priority]}</p><h1>{localized.title}</h1><p>{localized.description}</p></div>
          <span className={`priority-badge phase-${module.phase}`}>{copy.implementationPhase} {module.phase}</span>
        </header>

        <section className="module-detail-grid">
          <article className="detail-panel">
            <p className="eyebrow">{copy.businessCapabilities}</p>
            <h2>{copy.manageTitle}</h2>
            <ul className="feature-checklist">{localized.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
          </article>
          <article className="detail-panel control-panel">
            <p className="eyebrow">{copy.controlsGovernance}</p>
            <h2>{copy.erpGradeTitle}</h2>
            <ul className="feature-checklist">{localized.controls.map((control) => <li key={control}><span>✓</span>{control}</li>)}</ul>
          </article>
        </section>

        <section className="implementation-banner">
          <div><p className="eyebrow">{copy.implementationStatus}</p><h2>{copy.statusTitle}</h2><p>{copy.statusDescription}</p></div>
          <Link href="/">{copy.returnDashboard}</Link>
        </section>
      </div>
    </main>
  );
}
