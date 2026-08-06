"use client";

import Link from "next/link";
import { erpModules, type ModulePriority } from "../lib/erp-modules";
import { LanguageSelector, useLanguage } from "./language-provider";

export function ModuleCatalog() {
  const { dictionary } = useLanguage();
  const copy = dictionary.modulesPage;
  const priorities: ModulePriority[] = ["Must have", "Should have", "Growth"];

  return (
    <main className="module-page module-page-modern">
      <div className="module-page-inner">
        <nav className="module-toolbar" aria-label="Module catalog navigation">
          <Link className="back-link" href="/">← {copy.backDashboard}</Link>
          <LanguageSelector />
        </nav>

        <header className="module-hero">
          <div className="module-hero-copy">
            <p className="eyebrow">{copy.architecture}</p>
            <h1>{copy.title}</h1>
            <p className="module-intro">{copy.intro}</p>
          </div>
          <div className="roadmap-summary" aria-label={copy.plannedModules}>
            <strong>{erpModules.length}</strong>
            <span>{copy.plannedModules}</span>
            <div><b>8</b> {copy.requiredPhase1}</div>
            <div><b>3</b> {copy.operationalPhase2}</div>
            <div><b>1</b> {copy.growthPhase3}</div>
          </div>
        </header>

        <section className="module-summary-strip" aria-label={copy.plannedModules}>
          {priorities.map((priority) => {
            const count = erpModules.filter((module) => module.priority === priority).length;
            return (
              <article key={priority}>
                <span>{dictionary.priorityLabels[priority]}</span>
                <strong>{count}</strong>
                <small>{copy.priorityCopy[priority]}</small>
              </article>
            );
          })}
        </section>

        {priorities.map((priority) => {
          const modules = erpModules.filter((module) => module.priority === priority);
          return (
            <section className="module-group" key={priority}>
              <div className="module-group-head">
                <div>
                  <p className="eyebrow">{dictionary.priorityLabels[priority]}</p>
                  <h2>{copy.priorityCopy[priority]}</h2>
                </div>
                <span>{modules.length} {modules.length === 1 ? copy.moduleSingular : copy.modulePlural}</span>
              </div>
              <div className="module-grid">
                {modules.map((module) => {
                  const localized = dictionary.moduleItems[module.slug];
                  return (
                    <Link className="module-card" href={`/modules/${module.slug}`} key={module.slug}>
                      <div className="module-card-top">
                        <span className={`priority-badge phase-${module.phase}`}>{copy.phase} {module.phase}</span>
                        <span className="module-arrow" aria-hidden="true">↗</span>
                      </div>
                      <div className="module-card-copy">
                        <h3>{localized.title}</h3>
                        <p>{localized.description}</p>
                      </div>
                      <ul>{localized.features.slice(0, 3).map((feature) => <li key={feature}>{feature}</li>)}</ul>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
