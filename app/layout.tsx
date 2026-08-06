import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppExperienceProvider } from "../components/app-experience-provider";
import { AuthPagePreferences } from "../components/auth-page-preferences";
import { LanguageProvider } from "../components/language-provider";
import { WorkspaceShell } from "../components/workspace-shell";

/* ------------------------------------------------------------------
   Stylesheets
   ------------------------------------------------------------------
   The public marketing site no longer loads anything here — it owns
   a single stylesheet (app/hisab-marketing.css) imported by the
   marketing chrome. Everything below belongs to the authenticated
   workspace and the auth routes.

   Do not add "-fix", "-lock" or "-final" stylesheets to this list.
   ------------------------------------------------------------------ */

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

/* Theme guards — load before the workspace colour authority below */
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

/* ------------------------------------------------------------------
   Typography
   ------------------------------------------------------------------
   Archivo carries headings, Public Sans carries body copy, and
   IBM Plex Mono carries every figure that means something — money,
   document numbers, account codes. The --font-biloo-* aliases keep
   the older workspace stylesheets resolving.
   ------------------------------------------------------------------ */

const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-hisab-display",
  preload: true,
  fallback: ["Segoe UI", "Arial", "sans-serif"],
});

const body = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-hisab-body",
  preload: true,
  fallback: ["Segoe UI", "Arial", "sans-serif"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-hisab-mono",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

/* Restores the reader's theme and language before first paint so the
   page does not flash the wrong one. */
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
    var storedTheme = window.localStorage.getItem('hisab-theme') || readCookie('hisab_theme');
    var storedLanguage = window.localStorage.getItem('hisab-erp-language') || readCookie('hisab_locale');

    var theme = storedTheme === 'dark' ? 'dark' : 'light';
    var language = storedLanguage === 'am' ? 'am' : storedLanguage === 'ti' ? 'ti' : 'en';

    root.dataset.theme = theme;
    root.dataset.language = language;
    root.lang = language;
    root.style.colorScheme = theme;
  } catch (_) {
    root.dataset.theme = 'light';
    root.dataset.language = 'en';
    root.lang = 'en';
    root.style.colorScheme = 'light';
  }
})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hisabtech.com"),
  title: {
    default: "Hisab ERP — Business operating system for Ethiopia",
    template: "%s | Hisab ERP",
  },
  description:
    "Hisab ERP connects sales, finance, inventory, customers, suppliers and reporting to one double-entry ledger, built in Addis Ababa for Ethiopian businesses.",
  applicationName: "Hisab ERP",
  keywords: [
    "Hisab ERP",
    "ERP Ethiopia",
    "accounting software Ethiopia",
    "VAT Ethiopia",
    "inventory management",
    "invoicing",
    "Addis Ababa software",
  ],
  authors: [{ name: "Hisab Technologies", url: "https://www.hisabtech.com/about" }],
  creator: "Hisab Technologies",
  publisher: "Hisab Technologies",
  alternates: { canonical: "/", languages: { "en-ET": "/" } },
  openGraph: {
    type: "website",
    locale: "en_ET",
    siteName: "Hisab ERP",
    title: "Hisab ERP — Business operating system for Ethiopia",
    description:
      "One connected workspace for sales, finance, inventory, customers, suppliers and reporting.",
    url: "/",
    images: [{ url: "/hisab-logo.svg", width: 512, height: 512, alt: "Hisab ERP" }],
  },
  twitter: {
    card: "summary",
    title: "Hisab ERP",
    description: "Business operating system for growing Ethiopian organisations.",
    images: ["/hisab-logo.svg"],
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
    icon: [{ url: "/hisab-logo.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/hisab-logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/hisab-logo.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Pinch-zoom stays available. The previous build locked
     maximum-scale to 1, which blocks readers who need to zoom. */
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0b1220",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      lang="en"
      data-language="en"
      data-theme="light"
      data-brand="hisab"
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="/biloo-workspace-utility-header.css?v=20260806-1" />
        <script dangerouslySetInnerHTML={{ __html: preferenceBootstrap }} />
      </head>
      <body data-design-system="hisab-2026">
        <LanguageProvider initialLanguage="en">
          <AppExperienceProvider>
            <AuthPagePreferences />
            <WorkspaceShell>{children}</WorkspaceShell>
          </AppExperienceProvider>
        </LanguageProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
