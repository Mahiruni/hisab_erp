"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "../app/hisab-marketing.css";
import "../app/marketing-routes.css";
import "../app/marketing-polish.css";

/* ------------------------------------------------------------------
   Icons
   ------------------------------------------------------------------ */

export type IconName =
  | "arrow"
  | "chevron"
  | "check"
  | "menu"
  | "close"
  | "globe"
  | "shield"
  | "grid"
  | "help"
  | "user"
  | "receipt"
  | "wallet"
  | "box"
  | "trend"
  | "layers"
  | "lock"
  | "clock"
  | "building";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const base = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };

  switch (name) {
    case "arrow":
      return <svg {...base}><path d="M5 12h13M12 6l6 6-6 6" /></svg>;
    case "chevron":
      return <svg {...base}><path d="m6 9 6 6 6-6" /></svg>;
    case "check":
      return <svg {...base}><path d="m5 12 4 4L19 6" /></svg>;
    case "menu":
      return <svg {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "close":
      return <svg {...base}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "globe":
      return <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>;
    case "shield":
      return <svg {...base}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "grid":
      return <svg {...base}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "help":
      return <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1.1v.5M12 17h.01" /></svg>;
    case "user":
      return <svg {...base}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case "receipt":
      return <svg {...base}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
    case "wallet":
      return <svg {...base}><path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12" /><path d="M15 11h5v4h-5a2 2 0 0 1 0-4Z" /></svg>;
    case "box":
      return <svg {...base}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>;
    case "trend":
      return <svg {...base}><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></svg>;
    case "layers":
      return <svg {...base}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></svg>;
    case "lock":
      return <svg {...base}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    case "clock":
      return <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "building":
      return <svg {...base}><path d="M4 21V5l8-3 8 3v16M9 21v-4h6v4" /><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01" /></svg>;
  }
}

type NavItem = { label: string; note: string; href: string };
type NavGroup = { id: string; label: string; title: string; blurb: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    id: "product",
    label: "Product",
    title: "One ledger, every function",
    blurb: "Sales, purchasing, stock and cash all post to the same set of books.",
    items: [
      { label: "Product tour", note: "Walk the full workflow", href: "/product-tour" },
      { label: "Sales & invoicing", note: "Quote, invoice, collect", href: "/product/sales-invoicing" },
      { label: "Finance & cash flow", note: "Ledger, VAT and closing", href: "/product/finance-cashflow" },
      { label: "Inventory control", note: "Stock, movement, reorder", href: "/product/inventory" },
      { label: "Reports & analytics", note: "Answers from source records", href: "/product/reports-analytics" },
      { label: "Pricing", note: "Plans in ETB", href: "/pricing" },
    ],
  },
  {
    id: "solutions",
    label: "Solutions",
    title: "Built for how you already work",
    blurb: "Ethiopian compliance, local payments and sector-specific workflows.",
    items: [
      { label: "ERP for Ethiopia", note: "VAT, ETB and local practice", href: "/ethiopia" },
      { label: "Industries", note: "Trade, distribution, services", href: "/industries" },
      { label: "Move off spreadsheets", note: "Migrate without losing history", href: "/migration" },
      { label: "Integrations", note: "Banks, payments and tools", href: "/integrations" },
      { label: "E-invoicing", note: "Compliant document issuing", href: "/e-invoicing" },
      { label: "Customer stories", note: "What changed after rollout", href: "/customer-stories" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    title: "Decide with evidence",
    blurb: "Read the guidance before you change the system your business runs on.",
    items: [
      { label: "Learning centre", note: "Operating guides", href: "/resources" },
      { label: "Help Centre", note: "Product and account answers", href: "/help-center" },
      { label: "Compare ERPs", note: "Side-by-side evaluation", href: "/compare" },
      { label: "Trust Centre", note: "Security and availability", href: "/trust" },
    ],
  },
  {
    id: "company",
    label: "Company",
    title: "Made in Addis Ababa",
    blurb: "Built by Hisab Technologies for businesses operating in Ethiopia.",
    items: [
      { label: "About Hisab", note: "Team and direction", href: "/about" },
      { label: "Security", note: "How your data is protected", href: "/security" },
      { label: "Book a demo", note: "Talk through your workflow", href: "/request-demo" },
      { label: "Contact", note: "mahir@hisabtech.com", href: "mailto:mahir@hisabtech.com" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href.startsWith("mailto:")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link className="h-brand" href={href} aria-label="Hisab ERP — home">
      <span className="h-brand__mark" aria-hidden="true">H</span>
      Hisab
    </Link>
  );
}

export function MarketingHeader() {
  const pathname = usePathname() ?? "/";
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileMenuGroup, setMobileMenuGroup] = useState<string | null>("product");
  const [stuck, setStuck] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHoverClose = useCallback(() => {
    if (!hoverCloseTimer.current) return;
    clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = null;
  }, []);

  const close = useCallback(() => {
    cancelHoverClose();
    setOpenMenu(null);
  }, [cancelHoverClose]);

  const openFromHover = useCallback((menuId: string) => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    cancelHoverClose();
    setOpenMenu(menuId);
  }, [cancelHoverClose]);

  const scheduleHoverClose = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    cancelHoverClose();
    hoverCloseTimer.current = setTimeout(() => {
      setOpenMenu(null);
      hoverCloseTimer.current = null;
    }, 140);
  }, [cancelHoverClose]);

  const openDrawer = useCallback(() => {
    setOpenMenu(null);
    setMobileMenuGroup("product");
    setDrawerOpen(true);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
    setMobileMenuGroup("product");
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!openMenu && !drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      setDrawerOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!headerRef.current || headerRef.current.contains(event.target as Node)) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [openMenu, drawerOpen, close]);

  useEffect(() => () => cancelHoverClose(), [cancelHoverClose]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = drawerOpen ? "hidden" : previous || "";
    return () => {
      document.body.style.overflow = previous || "";
    };
  }, [drawerOpen]);

  return (
    <header className="h-header" data-stuck={stuck} ref={headerRef}>
      <div className="h-shell h-header__bar" style={{ position: "relative" }}>
        <Brand />
        <nav className="h-nav" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => {
            const expanded = openMenu === group.id;
            const active = group.items.some((item) => isActive(pathname, item.href));
            return (
              <div className="h-nav__group" key={group.id} onMouseEnter={() => openFromHover(group.id)} onMouseLeave={scheduleHoverClose}>
                <button type="button" className="h-nav__trigger" aria-expanded={expanded} aria-haspopup="true" data-active={active} onFocus={() => setOpenMenu(group.id)} onClick={() => setOpenMenu(expanded ? null : group.id)}>
                  {group.label}<Icon name="chevron" size={14} />
                </button>
              </div>
            );
          })}
        </nav>
        <div className="h-header__actions">
          <Link className="h-btn h-btn--ghost h-btn--sm h-header__desktop-only" href="/auth/login">Sign in</Link>
          <Link className="h-btn h-btn--primary h-btn--sm" href="/request-demo">Book a demo</Link>
          <button type="button" className="h-icon-btn h-burger" aria-label="Open menu" aria-expanded={drawerOpen} aria-controls="mobile-site-menu" onClick={openDrawer}><Icon name="menu" size={21} /></button>
        </div>
        {NAV_GROUPS.map((group) => openMenu === group.id ? (
          <div className="h-nav__panel" key={`panel-${group.id}`} role="group" aria-label={group.label} onMouseEnter={cancelHoverClose} onMouseLeave={scheduleHoverClose} onFocus={cancelHoverClose} onBlur={(event) => { if (event.currentTarget.contains(event.relatedTarget as Node | null)) return; scheduleHoverClose(); }}>
            <div className="h-nav__panel-head"><strong>{group.title}</strong><span>{group.blurb}</span></div>
            <div className="h-nav__grid">{group.items.map((item) => <Link className="h-nav__item" key={item.href} href={item.href} onClick={close}><strong>{item.label}</strong><span>{item.note}</span></Link>)}</div>
          </div>
        ) : null)}
      </div>

      {drawerOpen ? (
        <div className="h-drawer" id="mobile-site-menu" role="dialog" aria-modal="true" aria-label="Site menu">
          <button className="h-drawer__scrim" type="button" aria-label="Close site menu" onClick={() => setDrawerOpen(false)} />
          <aside className="h-drawer__panel">
            <div className="h-drawer__top">
              <Brand />
              <button type="button" className="h-icon-btn" aria-label="Close menu" onClick={() => setDrawerOpen(false)}><Icon name="close" size={21} /></button>
            </div>
            <div className="h-drawer__body">
              <div className="h-drawer__intro">
                <strong>Explore Hisab ERP</strong>
                <span>Product, implementation, resources and company information.</span>
              </div>

              {NAV_GROUPS.map((group) => {
                const expanded = mobileMenuGroup === group.id;
                return (
                  <section className="h-drawer__group" key={`drawer-${group.id}`}>
                    <button
                      type="button"
                      className="h-drawer__group-trigger"
                      aria-expanded={expanded}
                      aria-controls={`drawer-group-${group.id}`}
                      onClick={() => setMobileMenuGroup(expanded ? null : group.id)}
                    >
                      <span className="h-drawer__group-copy"><strong>{group.label}</strong><small>{group.title}</small></span>
                      <Icon name="chevron" size={17} />
                    </button>
                    {expanded ? (
                      <div className="h-drawer__links" id={`drawer-group-${group.id}`}>
                        {group.items.map((item) => (
                          <Link className="h-drawer__link" data-active={isActive(pathname, item.href)} key={item.href} href={item.href}>
                            <strong>{item.label}</strong>
                            <span>{item.note}</span>
                            <Icon name="arrow" size={16} />
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}

              <div className="h-drawer__cta">
                <Link className="h-btn h-btn--primary" href="/request-demo">Book a demo</Link>
                <Link className="h-btn h-btn--ghost" href="/auth/login">Sign in</Link>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}

const FOOTER_COLUMNS = [
  { title: "Product", links: [{ label: "Product tour", href: "/product-tour" }, { label: "Sales & invoicing", href: "/product/sales-invoicing" }, { label: "Finance & cash flow", href: "/product/finance-cashflow" }, { label: "Inventory", href: "/product/inventory" }, { label: "Pricing", href: "/pricing" }] },
  { title: "Learn", links: [{ label: "Learning centre", href: "/resources" }, { label: "Help Centre", href: "/help-center" }, { label: "Compare ERPs", href: "/compare" }, { label: "Migration guide", href: "/migration" }, { label: "Customer stories", href: "/customer-stories" }] },
  { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Trust Centre", href: "/trust" }, { label: "Security", href: "/security" }, { label: "Integrations", href: "/integrations" }, { label: "Book a demo", href: "/request-demo" }] },
];

export function MarketingFooter() {
  return (
    <footer className="h-footer"><div className="h-shell"><div className="h-footer__grid"><div className="h-footer__intro"><Brand /><p>Hisab ERP is a connected operating system for Ethiopian businesses — sales, finance, inventory and reporting posting to one set of books.</p><Link className="h-link" href="/request-demo">Book a demo <Icon name="arrow" size={15} /></Link></div>{FOOTER_COLUMNS.map((column) => <div className="h-footer__col" key={column.title}><h3>{column.title}</h3><ul>{column.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>)}</div><div className="h-footer__base"><span>© {new Date().getFullYear()} Hisab Technologies. Addis Ababa, Ethiopia.</span><div className="h-footer__legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><a href="mailto:mahir@hisabtech.com">mahir@hisabtech.com</a></div></div></div></footer>
  );
}

function MarketingStructuredData() {
  const data = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Hisab ERP", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: "https://www.hisabtech.com", description: "Hisab ERP connects sales, finance, inventory, customers, suppliers and reporting for growing Ethiopian businesses.", publisher: { "@type": "Organization", name: "Hisab Technologies", url: "https://www.hisabtech.com", address: { "@type": "PostalAddress", addressLocality: "Addis Ababa", addressCountry: "ET" } } };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return <div className="hisab"><MarketingStructuredData /><MarketingHeader /><main id="public-main-content">{children}</main><MarketingFooter /></div>;
}
