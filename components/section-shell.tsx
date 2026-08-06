"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getFoundationCopy } from "../lib/foundation-copy";
import { LanguageSelector, useLanguage } from "./language-provider";

type SectionShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function SectionShell({ title, description, children, actions }: SectionShellProps) {
  const { language } = useLanguage();
  const common = getFoundationCopy(language).common;
  const mark = title.trim().charAt(0).toUpperCase() || "H";

  return (
    <main className="section-page section-page-modern">
      <div className="section-container">
        <nav className="section-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">{common.dashboard}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>

        <header className="section-shell-hero">
          <div className="section-shell-title">
            <span className="section-shell-mark" aria-hidden="true">{mark}</span>
            <div>
              <p className="eyebrow">HisabTech</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>
          <div className="section-actions">
            <LanguageSelector />
            {actions}
          </div>
        </header>

        <div className="section-shell-content">{children}</div>
      </div>
    </main>
  );
}
