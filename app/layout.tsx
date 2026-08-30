import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Sora } from "next/font/google";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AetherBrandMigrationGuard } from "../components/aether-brand-migration-guard";
import { AppExperienceProvider } from "../components/app-experience-provider";
import { AuthPagePreferences } from "../components/auth-page-preferences";
import { LanguageProvider } from "../components/language-provider";
import { WorkspaceShell } from "../components/workspace-shell";

/* Foundation */
import "./fonts.css";
import "./globals.css";
import "./design-system.css";
import "./workspace-tokens.css";
import "./icon-system.css";
import "./i18n.css";
import "./production.css";
import "./font-benaiah-1.css";
import "./font-benaiah-2.css";
import "./font-benaiah-3.css";
import "./public-site-wide.css";

/* Auth routes */
import "./auth-i18n.css";
import "./auth-premium.css";
import "./auth-social.css";
import "./auth-official.css";
import "./auth-login-slack.css";
import "./auth-login-award.css";
import "./auth-hisab-brand.css";
import "./auth-page-preferences.css";
import "./auth-standard-experience.css";
import "./phone-auth-standard.css";
import "./account-security-premium.css";

/* Workspace shell */
import "./docked-sidebar.css";
import "./supabase-sidebar.css";
import "./sidebar-icon-cleanup.css";
import "./user-menu.css";
import "./user-menu-layout.css";
import "./workspace-standardization.css";
import "./workspace-command-center.css";
import "./workspace-header-preferences.css";
import "./workspace-theme-visibility.css";
import "./workspace-brand-completion.css";
import "./workspace-phase-2-5.css";
import "./mobile-workspace.css";
import "./apple-workspace-redesign.css";
import "./apple-workspace-redesign-fixes.css";
import "./biloo-workspace-final-lock.css";
import "./biloo-all-workspace-routes-contrast-lock.css";
import "./biloo-workspace-utility-visibility-lock.css";
import "./biloo-pure-white-workspace-lock.css";

/* Theme guards */
import "./light-theme-contrast.css";
import "./light-theme-component-guards.css";

/* Workspace modules */
import "./erp-modules.css";
import "./internal-premium.css";
import "./internal-modules-premium.css";
import "./core-operations.css";
import "./finance.css";
import "./financial-workspace-foundation.css";
import "./financial-workspace-components.css";
import "./financial-dashboard.css";
import "./dashboard-color-system.css";
import "./sales.css";
import "./e-invoicing.css";
import "./reconciliation.css";
import "./setup-controls.css";
import "./onboarding-launch.css";
import "./readiness.css";
import "./product-experience.css";
import "./brand-refinements.css";
import "./brand-loading.css";

/* AetherERP owns the final customer-facing visual layer. It deliberately
   loads after all legacy compatibility styles. */
import "./aether-brand.css";
import "./aether-compat-tokens.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-aether-display",
  preload: true,
  fallback: ["Georgia", "serif"],
});

const body = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-aether-body",
  preload: true,
  fallback: ["Helvetica Neue", "sans-serif"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-aether-mono",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

/* Legacy preference keys remain readable so existing users keep their
   saved language/session presentation after the brand migration. */
const preferenceBootstrap = `
(function () {
  var root = document.documentElement;

  function readCookie(name) {
    var prefix = name + '=';
    var match = document.cookie
      .split(';')
      .map(function (value) { return value.trim(); })
      .find(function (value) { return value.indexOf(prefix) === 0; });
    return match ? decodeURIComponent(match.slice(prefix.length)) : '';
  }

  try {
    var storedTheme = window.localStorage.getItem('aether-theme') || window.localStorage.getItem('hisab-theme') || readCookie('aether_theme') || readCookie('hisab_theme');
    var storedLanguage = window.localStorage.getItem('aether-erp-language') || window.localStorage.getItem('hisab-erp-language') || readCookie('aether_locale') || readCookie('hisab_locale');

    var theme = storedTheme === 'light' ? 'light' : 'dark';
    var language = storedLanguage === 'am' ? 'am' : storedLanguage === 'ti' ? 'ti' : 'en';

    root.dataset.theme = theme;
    root.dataset.language = language;
    root.lang = language;
    root.style.colorScheme = 'dark';
  } catch (_) {
    root.dataset.theme = 'dark';
    root.dataset.language = 'en';
    root.lang = 'en';
    root.style.colorScheme = 'dark';
  }
})();`;

export const metadata: Metadata = {
  /* Keep the existing deployed origin until the production domain migration is approved. */
  metadataBase: new URL("https://www.hisabtech.com"),
  title: {
    default: "AetherERP — One operating system for the entire company.",
    template: "%s | AetherERP",
  },
  description:
    "Finance, inventory, HR, CRM, manufacturing, procurement and analytics on one governed operating model — one ledger, one truth, one command center.",
  applicationName: "AetherERP",
  keywords: [
    "AetherERP",
    "ERP Ethiopia",
    "enterprise resource planning Ethiopia",
    "finance and inventory ERP",
    "Ethiopian VAT ERP",
    "procurement software",
    "payroll Ethiopia",
    "Addis Ababa ERP",
  ],
  authors: [{ name: "AetherERP" }],
  creator: "AetherERP",
  publisher: "AetherERP",
  alternates: { canonical: "/", languages: { "en-ET": "/" } },
  openGraph: {
    type: "website",
    locale: "en_ET",
    siteName: "AetherERP",
    title: "AetherERP — One operating system for the entire company.",
    description: "One governed command center for finance, stock, people, customers, procurement, production and analytics.",
    url: "/",
    images: [{ url: "/aether-logo.svg", width: 512, height: 512, alt: "AetherERP" }],
  },
  twitter: {
    card: "summary",
    title: "AetherERP",
    description: "One operating system for the entire company.",
    images: ["/aether-logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/aether-logo.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/aether-logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/aether-logo.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#07090C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      lang="en"
      data-language="en"
      data-theme="dark"
      data-brand="aether"
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="/biloo-workspace-utility-header.css?v=20260806-1" />
        <script dangerouslySetInnerHTML={{ __html: preferenceBootstrap }} />
      </head>
      <body data-design-system="aether-erp-2026">
        <LanguageProvider initialLanguage="en">
          <AppExperienceProvider>
            <AetherBrandMigrationGuard />
            <AuthPagePreferences />
            <WorkspaceShell>{children}</WorkspaceShell>
          </AppExperienceProvider>
        </LanguageProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
