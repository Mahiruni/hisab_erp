"use client";

import Link from "next/link";
import { HelpCenterPanel } from "./help-center-panel";
import { LanguageSelector, useLanguage } from "./language-provider";

export function HelpCenterPage() {
  const { t } = useLanguage();

  return (
    <main className="help-center-page">
      <div className="help-center-page-toolbar">
        <Link href="/" className="back-link">← {t("Dashboard")}</Link>
        <LanguageSelector />
      </div>
      <div className="help-center-page-frame">
        <header className="help-center-page-header">
          <p>{t("HisabTech support")}</p>
          <h1>{t("Help Center")}</h1>
          <span>{t("Complete product guidance for setup, daily operations, finance, security, and troubleshooting.")}</span>
        </header>
        <HelpCenterPanel activeLabel={t("Help Center")} onNavigate={() => undefined} />
      </div>
    </main>
  );
}
