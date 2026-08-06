"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { UserContext } from "../lib/data/types";
import { useLanguage } from "./language-provider";
import { UserMenu } from "./user-menu";
import { Icon, type IconName } from "./ui/icon";
import { WorkspaceCommandCenter, type WorkspaceCommandItem } from "./workspace-command-center";
import { WorkspaceHeaderPreferences } from "./workspace-header-preferences";

type Props = { children: ReactNode; user?: UserContext | null };
type NavItem = { label: string; href: string; icon: IconName };
type SessionContextResponse = { user: UserContext | null };

const shellExcludedRoutes = ["/auth", "/onboarding", "/request-demo", "/product-tour", "/product", "/ethiopia", "/industries", "/pricing", "/customer-stories", "/trust", "/integrations", "/migration", "/compare", "/help-center", "/resources", "/about"];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/modules") return pathname === "/modules";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getOrganizationMark(name: string) {
  const mark = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  return mark || "B";
}

function WorkspaceSessionLoading() {
  return (
    <main className="route-loading brand-route-loading" role="status" aria-live="polite" aria-label="Loading secure Hisab workspace">
      <div className="experience-loader-card brand-loader-card">
        <div className="brand-loader-mark" aria-hidden="true">
          <span className="brand-loader-ring" />
          <span className="brand-loader-logo-shell"><img src="/hisab-logo.svg" alt="" width="48" height="48" /></span>
        </div>
        <div className="brand-loader-copy"><strong>Preparing Hisab</strong><span>Loading your secure business workspace…</span></div>
        <div className="brand-loader-progress" aria-hidden="true"><span /></div>
      </div>
    </main>
  );
}

export function WorkspaceShell({ children, user: initialUser = null }: Props) {
  const pathname = usePathname();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { dictionary, language } = useLanguage();
  const isExcluded = shellExcludedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const [activeUser, setActiveUser] = useState<UserContext | null>(initialUser);
  const [sessionResolved, setSessionResolved] = useState(Boolean(initialUser) || isExcluded || pathname === "/");
  const show = Boolean(activeUser) && !isExcluded;

  useEffect(() => {
    if (isExcluded) {
      if (pathname.startsWith("/auth")) setActiveUser(null);
      setSessionResolved(true);
      return;
    }
    if (activeUser) {
      setSessionResolved(true);
      return;
    }

    const controller = new AbortController();
    if (pathname !== "/") setSessionResolved(false);

    fetch("/api/session-context", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<SessionContextResponse>;
      })
      .then((payload) => {
        if (payload?.user) setActiveUser(payload.user);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.error("Unable to load workspace session", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionResolved(true);
      });

    return () => controller.abort();
  }, [activeUser, isExcluded, pathname]);

  useEffect(() => {
    if (show) workspaceRef.current?.scrollTo({ top: 0, behavior: "auto" });
    setMobileNavOpen(false);
  }, [pathname, show]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!activeUser || isExcluded || pathname === "/account") return;
    if (!activeUser.mfaRequired || activeUser.aal === "aal2") return;

    const destination = `${pathname}${window.location.search}${window.location.hash}`;
    const query = new URLSearchParams({ verify: "mfa", next: destination });
    window.location.replace(`/account?${query.toString()}`);
  }, [activeUser, isExcluded, pathname]);

  if (!sessionResolved && !isExcluded) return <WorkspaceSessionLoading />;
  if (!show || !activeUser) return <>{children}</>;
  const user = activeUser;
  const requiresMfaConfirmation = user.mfaRequired && user.aal !== "aal2" && pathname !== "/account";
  if (requiresMfaConfirmation) return <WorkspaceSessionLoading />;

  const d = dictionary.dashboard;
  const sections = language === "am"
    ? { core: "ዋና የስራ ቦታ", phase1: "ዋና ስራዎች", phase2: "ማስፋፊያ ሞጁሎች" }
    : { core: "Core workspace", phase1: "Core operations", phase2: "Growth modules" };
  const setup = language === "am" ? "የኩባንያ ማዋቀር" : "Company setup";
  const controls = language === "am" ? "የምርት ደህነት" : "Production controls";
  const einvoice = language === "am" ? "ኤሌክትሮኒክ ደረሰኝ" : "Electronic invoicing";
  const reconciliation = language === "am" ? "የባንክ እና ክፍያ ማስታረቅ" : "Bank and payment reconciliation";
  const moreLabel = language === "am" ? "ተጨማሪ" : "More";
  const menuLabel = language === "am" ? "የስራ ቦታ ምናሌ" : "Workspace menu";

  const groups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: sections.core,
      items: [
        { label: d.nav.overview, href: "/", icon: "home" },
        { label: d.nav.modules, href: "/modules", icon: "grid" },
        { label: d.nav.finance, href: "/finance", icon: "landmark" },
        { label: d.nav.sales, href: "/sales", icon: "shopping-cart" },
        { label: einvoice, href: "/e-invoicing", icon: "file-check" },
        { label: reconciliation, href: "/reconciliation", icon: "refresh-cw" },
        { label: setup, href: "/onboarding", icon: "building" },
      ],
    },
    {
      label: sections.phase1,
      items: [
        { label: dictionary.moduleItems["purchasing-expenses"].shortTitle, href: "/purchasing", icon: "receipt" },
        { label: dictionary.moduleItems["inventory-warehouse"].shortTitle, href: "/inventory", icon: "boxes" },
        { label: dictionary.moduleItems["customers-suppliers"].shortTitle, href: "/modules/customers-suppliers", icon: "users" },
        { label: dictionary.moduleItems["human-resources-payroll"].shortTitle, href: "/hr", icon: "badge-dollar" },
        { label: controls, href: "/security", icon: "shield-check" },
        { label: dictionary.moduleItems["reports-analytics"].shortTitle, href: "/modules/reports-analytics", icon: "chart" },
      ],
    },
    {
      label: sections.phase2,
      items: [
        { label: dictionary.moduleItems["localization-compliance"].shortTitle, href: "/modules/localization-compliance", icon: "scale" },
        { label: dictionary.moduleItems["fixed-assets"].shortTitle, href: "/modules/fixed-assets", icon: "package-check" },
        { label: dictionary.moduleItems["budgeting-projects"].shortTitle, href: "/modules/budgeting-projects", icon: "folder-kanban" },
        { label: dictionary.moduleItems["integrations-automation"].shortTitle, href: "/modules/integrations-automation", icon: "workflow" },
      ],
    },
  ];

  const allItems = groups.flatMap((group) => group.items);
  const commandItems: WorkspaceCommandItem[] = groups.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.label })),
  );
  const activeItem = allItems.find((item) => isActiveRoute(pathname, item.href));
  const organizationMark = getOrganizationMark(user.organizationName);
  const mobileShortcuts: NavItem[] = [
    { label: d.nav.overview, href: "/", icon: "home" },
    { label: d.nav.sales, href: "/sales", icon: "shopping-cart" },
    { label: d.nav.finance, href: "/finance", icon: "landmark" },
    { label: dictionary.moduleItems["inventory-warehouse"].shortTitle, href: "/inventory", icon: "boxes" },
  ];

  return (
    <div
      className="erp-shell"
      data-layout-version="biloo-sidebar-v3"
      data-workspace-brand="biloo"
      data-workspace-phase="2.5"
      data-workspace-route={pathname}
      data-mobile-nav-open={mobileNavOpen ? "true" : "false"}
    >
      <WorkspaceCommandCenter items={commandItems} activeLabel={activeItem?.label ?? d.nav.overview} pathname={pathname} user={user} />
      <WorkspaceHeaderPreferences />

      <header className="mobile-workspace-header">
        <button type="button" className="mobile-menu-trigger" aria-label={menuLabel} aria-controls="primary-sidebar" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}>
          <span aria-hidden="true"><i /><i /><i /></span>
        </button>
        <Link href="/" className="mobile-workspace-brand" aria-label="Hisab dashboard"><img src="/hisab-logo.svg" alt="" width="34" height="34" className="hisab-logo" /></Link>
        <div className="mobile-workspace-title"><small>Hisab ERP</small><strong>{activeItem?.label ?? d.nav.overview}</strong></div>
      </header>

      <UserMenu user={user} />

      <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />

      <aside className="sidebar supabase-sidebar" id="primary-sidebar" data-docked="fixed" aria-label="Primary workspace navigation">
        <div className="mobile-sidebar-header">
          <div className="brand"><img src="/hisab-logo.svg" alt="" width="34" height="34" className="hisab-logo" /><div><strong>Hisab</strong><small>Business operating system</small></div></div>
          <button type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>×</button>
        </div>

        <div className="supabase-sidebar-header">
          <Link href="/" className="desktop-sidebar-brand brand" aria-label="Hisab dashboard">
            <img src="/hisab-logo.svg" alt="" width="28" height="28" className="hisab-logo" />
            <div><strong>Hisab</strong><small>Business operating system</small></div>
          </Link>
          <span className="supabase-rail-indicator" aria-hidden="true"><Icon name="chevron-right" size={14} /></span>
        </div>

        <Link className="sidebar-workspace-switcher" href="/" title={user.organizationName}>
          <span className="sidebar-workspace-mark" aria-hidden="true">{organizationMark}</span>
          <span className="sidebar-workspace-copy">
            <strong>{user.organizationName}</strong>
            <small>{activeItem?.label ?? d.nav.overview}</small>
          </span>
          <Icon className="sidebar-workspace-chevron" name="chevron-right" size={14} />
        </Link>

        <nav aria-label="Primary workspace navigation">
          {groups.map((group) => (
            <div className="sidebar-nav-group" key={group.label}>
              <span className="sidebar-section-label">{group.label}</span>
              <div className="sidebar-group-items">
                {group.items.map((item) => {
                  const active = isActiveRoute(pathname, item.href);
                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={active ? "active" : undefined}
                      data-label={item.label}
                      href={item.href}
                      key={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      title={item.label}
                    >
                      <Icon className="sidebar-nav-icon" name={item.icon} size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-dock-status" aria-label="Hisab navigation"><Icon name="chevron-right" size={14} /><strong>Hisab workspace</strong></div>
        <footer className="sidebar-footer"><p className="powered-by">Powered by <a href="https://www.hisabtech.com" target="_blank" rel="noopener noreferrer">Hisab</a></p><p>{user.organizationName}<br />Addis Ababa, Ethiopia</p></footer>
      </aside>

      <div className="workspace" id="workspace-content" ref={workspaceRef}>{children}</div>

      <nav className="mobile-bottom-nav" aria-label="Mobile workspace shortcuts">
        {mobileShortcuts.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <Link href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
              <Icon name={item.icon} size={21} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" className={mobileNavOpen ? "active" : undefined} aria-label={menuLabel} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}>
          <Icon name="grid" size={21} />
          <span>{moreLabel}</span>
        </button>
      </nav>
    </div>
  );
}
