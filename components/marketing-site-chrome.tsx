"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import "../app/hisab-marketing.css";
import "../app/marketing-routes.css";
import "../app/marketing-polish.css";
import "../app/marketing-editorial-system.css";

type Locale = "en" | "am";
type MenuId = "product" | "solutions" | "resources" | "company";
type Item = { label: string; href: string; description?: string };
type Group = {
  id: MenuId;
  label: string;
  intro: string;
  items: Item[];
  feature: { eyebrow: string; title: string; body: string; href: string; cta: string };
};
type IconName = "arrow" | "chevronDown" | "chevronRight" | "search" | "close" | "globe" | "menu";

function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {name === "arrow" ? <path d="M5 12h14M13 6l6 6-6 6" /> : null}
      {name === "chevronDown" ? <path d="m5 9 7 7 7-7" /> : null}
      {name === "chevronRight" ? <path d="m9 5 7 7-7 7" /> : null}
      {name === "search" ? <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></> : null}
      {name === "close" ? <path d="M6 6l12 12M18 6 6 18" /> : null}
      {name === "globe" ? <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.4 2.2 3.6 4.9 3.6 8S14.4 17.8 12 20c-2.4-2.2-3.6-4.9-3.6-8S9.6 6.2 12 4Z" /></> : null}
      {name === "menu" ? <path d="M5 7h14M5 12h14M5 17h9" /> : null}
    </svg>
  );
}

const copy = {
  en: {
    navigation: "Main navigation", pricing: "Pricing", search: "Search", searchTitle: "Search Biloo",
    searchPlaceholder: "Search products and resources", noResults: "No matching pages found.", signIn: "Sign in",
    startFree: "Start free", openMenu: "Open menu", closeMenu: "Close menu", language: "Language",
    menu: "Menu", quickLinks: "Quick links",
    footerIntro: "One secure business operating system for Ethiopian companies that want clearer operations and better decisions.",
    product: "Product", resources: "Learn & implement", company: "Company & trust", rights: "All rights reserved.",
    location: "Addis Ababa, Ethiopia",
  },
  am: {
    navigation: "ዋና አሰሳ", pricing: "ዋጋ", search: "ፈልግ", searchTitle: "Biloo ፈልግ",
    searchPlaceholder: "ምርቶችን እና መረጃዎችን ፈልግ", noResults: "ተዛማጅ ገጽ አልተገኘም።", signIn: "ግባ",
    startFree: "በነፃ ይጀምሩ", openMenu: "ምናሌ ክፈት", closeMenu: "ምናሌ ዝጋ", language: "ቋንቋ",
    menu: "ምናሌ", quickLinks: "ፈጣን አገናኞች",
    footerIntro: "ለግልጽ አሰራር እና ለተሻለ ውሳኔ የተገነባ የኢትዮጵያ ንግድ ስርዓት።",
    product: "ምርት", resources: "ይማሩ እና ይተግብሩ", company: "ኩባንያ እና እምነት", rights: "መብቶቹ ሁሉ የተጠበቁ ናቸው።",
    location: "አዲስ አበባ፣ ኢትዮጵያ",
  },
} as const;

const groups: Group[] = [
  {
    id: "product", label: "Product", intro: "One connected system for the whole business",
    items: [
      { label: "Product overview", href: "/product-tour", description: "See how the modules work together in one workspace." },
      { label: "Finance & accounting", href: "/product/finance-cashflow", description: "Double-entry ledger, VAT, receipts and period close." },
      { label: "Sales & invoicing", href: "/product/sales-invoicing", description: "Quote to cash, with stock and revenue posted in one step." },
      { label: "Inventory & procurement", href: "/product/inventory", description: "Stock levels, purchase orders and supplier records." },
      { label: "Reports & analytics", href: "/product/reports-analytics", description: "Live financial reporting with CSV export." },
    ],
    feature: { eyebrow: "Guided tour", title: "Walk through Biloo in six minutes", body: "A narrated tour of finance, sales and inventory using sample company data.", href: "/product-tour", cta: "Start the tour" },
  },
  {
    id: "solutions", label: "Solutions", intro: "Built for how Ethiopian companies actually operate",
    items: [
      { label: "ERP for Ethiopia", href: "/ethiopia", description: "VAT, ETB, Amharic and Tigrinya, local compliance." },
      { label: "Industry solutions", href: "/industries", description: "Trading, manufacturing, services and retail setups." },
      { label: "Data migration", href: "/migration", description: "Move off spreadsheets without losing your history." },
      { label: "Integrations", href: "/integrations", description: "Banks, payments and the tools already in your stack." },
      { label: "Customer stories", href: "/customer-stories", description: "How other teams run their books on Biloo." },
    ],
    feature: { eyebrow: "Migration", title: "Bring your existing books across", body: "A structured path from spreadsheets or legacy accounting software, with opening balances checked.", href: "/migration", cta: "See the migration path" },
  },
  {
    id: "resources", label: "Resources", intro: "Everything you need to evaluate and roll out",
    items: [
      { label: "Learning center", href: "/resources", description: "Guides on accounting, stock and month-end in Biloo." },
      { label: "Help Center", href: "/help-center", description: "Step-by-step answers for day-to-day questions." },
      { label: "ERP comparisons", href: "/compare", description: "How Biloo compares to the alternatives you are weighing." },
      { label: "Trust Center", href: "/trust", description: "Security, data handling and availability commitments." },
      { label: "Book a walkthrough", href: "/request-demo", description: "A live session with the team, tailored to your business." },
    ],
    feature: { eyebrow: "Talk to us", title: "Book a walkthrough", body: "Bring your chart of accounts and we will show you the setup on a call.", href: "/request-demo", cta: "Choose a time" },
  },
  {
    id: "company", label: "Company", intro: "Who builds Biloo, and how your data is handled",
    items: [
      { label: "About Biloo", href: "/about", description: "The team and the reason this product exists." },
      { label: "Trust & security", href: "/trust", description: "Access control, encryption and audit history." },
      { label: "Contact", href: "mailto:mahir@hisabtech.com", description: "Reach sales, support or the security team." },
    ],
    feature: { eyebrow: "Trust Center", title: "How your data is protected", body: "Organization-level row security, audit events and documented recovery procedures.", href: "/trust", cta: "Read the Trust Center" },
  },
];

const searchItems: Item[] = [
  { label: "Biloo ERP overview", href: "/" },
  ...groups.flatMap((group) => group.items),
  { label: "Pricing", href: "/pricing" },
  { label: "Sign in", href: "/auth/login?next=%2F" },
];

function routeMatches(pathname: string, href: string) {
  if (href.startsWith("mailto:")) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function MarketingStructuredData() {
  const data = [
    { "@context": "https://schema.org", "@type": "Organization", name: "Biloo", url: "https://www.hisabtech.com", logo: "https://www.hisabtech.com/hisab-logo.svg", email: "mahir@hisabtech.com", telephone: "+251924093037", address: { "@type": "PostalAddress", addressLocality: "Addis Ababa", addressCountry: "ET" } },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Biloo ERP", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: "https://www.hisabtech.com", description: "A business operating system for Ethiopian organizations.", offers: { "@type": "AggregateOffer", priceCurrency: "ETB", lowPrice: "1500", offerCount: "4" }, provider: { "@type": "Organization", name: "Biloo" } },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function MarketingHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MenuId | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [locale, setLocale] = useState<Locale>("en");
  const [scrolled, setScrolled] = useState(false);
  const c = copy[locale];

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (needle ? searchItems.filter((item) => item.label.toLowerCase().includes(needle)) : searchItems).slice(0, 10);
  }, [query]);

  useEffect(() => {
    document.body.dataset.publicMarketing = "true";
    const stored = window.localStorage.getItem("biloo-public-language");
    const next: Locale = stored === "am" ? "am" : "en";
    setLocale(next);
    document.documentElement.dataset.publicLanguage = next;
    document.documentElement.dataset.publicTheme = "light";
    return () => { delete document.body.dataset.publicMarketing; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpenMenu(null); setMobileOpen(false); setSearchOpen(false); setQuery("");
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpenMenu(null); setMobileOpen(false); setSearchOpen(false); }
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    if (searchOpen) window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [searchOpen]);

  const toggleLocale = () => {
    const next: Locale = locale === "en" ? "am" : "en";
    setLocale(next);
    document.documentElement.dataset.publicLanguage = next;
    window.localStorage.setItem("biloo-public-language", next);
  };

  return (
    <>
      <a href="#public-main-content" className="wb-skip-link">Skip to main content</a>
      <header ref={headerRef} className={`wb-header${scrolled ? " is-scrolled" : ""}${openMenu ? " is-menu-open" : ""}`}>
        <div className="wb-header-inner">
          <Link href="/" className="wb-brand" aria-label="Biloo home"><img src="/biloo-header-logo.svg" alt="Biloo" width="112" height="56" /></Link>
          <nav className="wb-primary-nav" aria-label={c.navigation}>
            {groups.map((group) => {
              const open = openMenu === group.id;
              const active = group.items.some((item) => routeMatches(pathname, item.href));
              return (
                <div className={`wb-nav-group${open ? " is-open" : ""}`} key={group.id} onMouseEnter={() => setOpenMenu(group.id)} onMouseLeave={() => setOpenMenu(null)}>
                  <button type="button" aria-expanded={open} aria-haspopup="true" className={active ? "is-active" : undefined} onClick={() => setOpenMenu(open ? null : group.id)}>
                    {group.label}<Icon name="chevronDown" width={13} height={13} strokeWidth={2} />
                  </button>
                  <div className="wb-mega" aria-hidden={!open}>
                    <div className="wb-mega-inner">
                      <div className="wb-mega-links">
                        <p className="wb-mega-intro">{group.intro}</p>
                        <div className="wb-mega-grid">
                          {group.items.map((item) => (
                            <Link href={item.href} key={`${group.id}-${item.href}-${item.label}`} aria-current={routeMatches(pathname, item.href) ? "page" : undefined} onClick={() => setOpenMenu(null)}>
                              <span className="wb-mega-label">{item.label}<Icon name="chevronRight" width={13} height={13} strokeWidth={2} /></span>
                              {item.description ? <span className="wb-mega-description">{item.description}</span> : null}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <Link href={group.feature.href} className="wb-mega-feature" onClick={() => setOpenMenu(null)}>
                        <span className="wb-mega-feature-eyebrow">{group.feature.eyebrow}</span><strong>{group.feature.title}</strong><span className="wb-mega-feature-body">{group.feature.body}</span>
                        <span className="wb-mega-feature-cta">{group.feature.cta}<Icon name="arrow" width={14} height={14} strokeWidth={2} /></span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            <Link href="/pricing" className={routeMatches(pathname, "/pricing") ? "is-active" : undefined}>{c.pricing}</Link>
          </nav>
          <div className="wb-header-actions">
            <button type="button" className="wb-icon-button" aria-label={c.search} onClick={() => setSearchOpen(true)}><Icon name="search" width={18} height={18} strokeWidth={1.8} /></button>
            <button type="button" className="wb-language-switch" aria-label={c.language} onClick={toggleLocale}><Icon name="globe" width={16} height={16} strokeWidth={1.8} /><span>{locale === "en" ? "EN" : "አማ"}</span></button>
            <span className="wb-action-divider" aria-hidden />
            <Link href="/auth/login?next=%2F" className="wb-sign-in">{c.signIn}</Link>
            <Link href="/auth/email-sign-up" className="wb-primary-action">{c.startFree}</Link>
            <button type="button" className="wb-mobile-toggle" aria-label={mobileOpen ? c.closeMenu : c.openMenu} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
              <Icon name={mobileOpen ? "close" : "menu"} width={20} height={20} strokeWidth={1.8} /><span>{mobileOpen ? c.closeMenu : c.menu}</span>
            </button>
          </div>
        </div>
      </header>

      <div className={`wb-search-overlay${searchOpen ? " is-open" : ""}`} aria-hidden={!searchOpen}>
        <button type="button" className="wb-overlay-backdrop" tabIndex={-1} aria-label="Close search" onClick={() => setSearchOpen(false)} />
        <div className="wb-search-panel" role="dialog" aria-modal="true" aria-label={c.searchTitle}>
          <header><div><span>{c.search}</span><h2>{c.searchTitle}</h2></div><button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><Icon name="close" width={19} height={19} strokeWidth={1.8} /></button></header>
          <label className="wb-search-field"><span className="wb-visually-hidden">{c.searchPlaceholder}</span><Icon name="search" width={17} height={17} strokeWidth={1.8} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.searchPlaceholder} autoComplete="off" /></label>
          <p className="wb-search-hint">{c.quickLinks}</p>
          <div className="wb-search-results">{results.length ? results.map((item) => <Link href={item.href} key={`${item.href}-${item.label}`} onClick={() => setSearchOpen(false)}><span>{item.label}</span><Icon name="chevronRight" width={14} height={14} strokeWidth={2} /></Link>) : <p className="wb-no-results">{c.noResults}</p>}</div>
        </div>
      </div>

      <div className={`wb-mobile-drawer${mobileOpen ? " is-open" : ""}`} aria-hidden={!mobileOpen}>
        <button type="button" className="wb-overlay-backdrop" tabIndex={-1} aria-label={c.closeMenu} onClick={() => setMobileOpen(false)} />
        <aside className="wb-mobile-panel" role="dialog" aria-modal="true" aria-label={c.navigation}>
          <header><Link href="/" onClick={() => setMobileOpen(false)}><img src="/biloo-header-logo.svg" alt="Biloo" width="106" height="52" /></Link><button type="button" onClick={() => setMobileOpen(false)} aria-label={c.closeMenu}><Icon name="close" width={20} height={20} strokeWidth={1.8} /></button></header>
          <button type="button" className="wb-mobile-search" onClick={() => { setMobileOpen(false); setSearchOpen(true); }}><Icon name="search" width={17} height={17} strokeWidth={1.8} /><span>{c.searchPlaceholder}</span></button>
          <nav className="wb-mobile-navigation" aria-label={c.navigation}>
            {groups.map((group) => {
              const expanded = mobileSection === group.id;
              return <div className={`wb-mobile-section${expanded ? " is-open" : ""}`} key={group.id}><button type="button" aria-expanded={expanded} onClick={() => setMobileSection(expanded ? null : group.id)}>{group.label}<Icon name="chevronDown" width={16} height={16} strokeWidth={2} /></button><div className="wb-mobile-section-body" hidden={!expanded}>{group.items.map((item) => <Link href={item.href} key={`${group.id}-${item.href}-${item.label}`} onClick={() => setMobileOpen(false)}><strong>{item.label}</strong>{item.description ? <span>{item.description}</span> : null}</Link>)}</div></div>;
            })}
            <div className="wb-mobile-section"><Link className="wb-mobile-direct" href="/pricing" onClick={() => setMobileOpen(false)}>{c.pricing}</Link></div>
          </nav>
          <div className="wb-mobile-utilities"><Link href="/help-center" onClick={() => setMobileOpen(false)}>Help Center</Link><Link href="/account" onClick={() => setMobileOpen(false)}>Account</Link><button type="button" onClick={toggleLocale}><Icon name="globe" width={15} height={15} strokeWidth={1.8} />{locale === "en" ? "English" : "አማርኛ"}</button></div>
          <div className="wb-mobile-actions"><Link href="/auth/login?next=%2F" onClick={() => setMobileOpen(false)}>{c.signIn}</Link><Link href="/auth/email-sign-up" onClick={() => setMobileOpen(false)}>{c.startFree}</Link></div>
        </aside>
      </div>
    </>
  );
}

export function MarketingFooter() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => { setLocale(window.localStorage.getItem("biloo-public-language") === "am" ? "am" : "en"); }, []);
  const c = copy[locale];
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-top">
        <div><Link href="/" className="marketing-brand marketing-footer-brand"><img src="/biloo-header-logo.svg" alt="Biloo" width="108" height="54" /><span className="marketing-brand-copy"><strong>Biloo</strong><small>Business operating system</small></span></Link><p>{c.footerIntro}</p><a href="mailto:mahir@hisabtech.com">mahir@hisabtech.com</a><a href="tel:+251924093037">+251 924 093 037</a></div>
        <div><strong>{c.product}</strong><Link href="/product-tour">Product tour</Link><Link href="/product/sales-invoicing">Sales & invoicing</Link><Link href="/product/finance-cashflow">Finance & cash flow</Link><Link href="/product/inventory">Inventory</Link><Link href="/pricing">{c.pricing}</Link></div>
        <div><strong>{c.resources}</strong><Link href="/resources">Learning center</Link><Link href="/migration">Data migration</Link><Link href="/compare">ERP comparisons</Link><Link href="/help-center">Help Center</Link><Link href="/customer-stories">Customer stories</Link></div>
        <div><strong>{c.company}</strong><Link href="/about">About Biloo</Link><Link href="/trust">Trust Center</Link><Link href="/integrations">Integrations</Link><Link href="/auth/login">{c.signIn}</Link><a href="mailto:mahir@hisabtech.com?subject=Biloo%20security%20question">Security contact</a></div>
      </div>
      <div className="marketing-footer-bottom"><span>© {new Date().getFullYear()} Biloo. {c.rights}</span><span>{c.location}</span></div>
    </footer>
  );
}

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return <div className="marketing-site marketing-site-v2 marketing-editorial-v1"><MarketingStructuredData /><MarketingHeader /><main id="public-main-content">{children}</main><MarketingFooter /></div>;
}
