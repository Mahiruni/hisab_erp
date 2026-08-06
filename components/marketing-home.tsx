"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "./marketing-site-chrome";

/* ------------------------------------------------------------------
   Content
   ------------------------------------------------------------------ */

/* The hero posting. A single ETB 48,200 invoice at the Ethiopian 15%
   VAT rate, shown as the three ledger lines it actually creates.
   Net 41,913.04 + VAT 6,286.96 = 48,200.00 gross. */
const POSTING_LINES = [
  { code: "1200", account: "Accounts receivable", debit: "48,200.00", credit: "" },
  { code: "4000", account: "Sales revenue", debit: "", credit: "41,913.04" },
  { code: "2310", account: "VAT payable — output", debit: "", credit: "6,286.96" },
];

const FACTS = [
  { value: "15%", label: "VAT calculated and posted on issue, not at month end" },
  { value: "3", label: "Interface languages: English, Amharic and Tigrinya" },
  { value: "2×", label: "Every transaction posted twice, debit against credit" },
  { value: "ETB", label: "Birr-native amounts, documents and reporting" },
];

const MODULES: { icon: IconName; title: string; text: string; href: string; tags: string[] }[] = [
  {
    icon: "wallet",
    title: "Sales & invoicing",
    text: "Quotations become orders, orders become invoices, and each issue posts receivable, revenue, VAT and cost of goods in one transaction.",
    href: "/product/sales-invoicing",
    tags: ["Quotes", "Invoices", "Receipts", "Returns"],
  },
  {
    icon: "receipt",
    title: "Finance & accounting",
    text: "A real double-entry general ledger with chart of accounts, manual journals, bank and cash records, VAT position and period locking.",
    href: "/product/finance-cashflow",
    tags: ["Ledger", "Journals", "VAT", "Closing"],
  },
  {
    icon: "box",
    title: "Inventory & warehouse",
    text: "Stock levels move when documents post. Issues, receipts and returns adjust quantity and value together, so cost of goods stays honest.",
    href: "/product/inventory",
    tags: ["Stock", "Movement", "Valuation"],
  },
  {
    icon: "trend",
    title: "Reports & analytics",
    text: "Profit and loss, balance sheet and trial balance built from posted entries — every figure traceable back to the document that created it.",
    href: "/product/reports-analytics",
    tags: ["P&L", "Balance sheet", "Trial balance"],
  },
  {
    icon: "layers",
    title: "Purchasing & suppliers",
    text: "Record what you buy and owe alongside what you sell, so payables, stock value and cash position stay in agreement.",
    href: "/modules",
    tags: ["Purchases", "Payables", "Expenses"],
  },
  {
    icon: "shield",
    title: "Controls & audit",
    text: "Roles decide who can post. Approvals gate what matters. Every document carries a number and a history that cannot be quietly rewritten.",
    href: "/security",
    tags: ["Roles", "Approvals", "Audit trail"],
  },
];

const REPLACES = [
  {
    strong: "One number, one source.",
    rest: "Sales, stock and cash stop disagreeing because they are no longer maintained separately.",
  },
  {
    strong: "Closing stops being reconstruction.",
    rest: "The ledger is already correct when the month ends, because it was correct as the work happened.",
  },
  {
    strong: "Nothing is lost with a laptop.",
    rest: "Records live in a managed database with organisation-level access rules, not in a file on one machine.",
  },
  {
    strong: "Handover takes a day, not a quarter.",
    rest: "New staff learn a workflow instead of inheriting someone else's spreadsheet conventions.",
  },
];

const SEQUENCE = [
  {
    n: "01",
    title: "Set up the books",
    text: "Chart of accounts, VAT settings, branches, users and roles configured for how your business is actually organised.",
  },
  {
    n: "02",
    title: "Bring in your history",
    text: "Customers, suppliers, stock items and opening balances migrated from spreadsheets, with the trial balance checked before go-live.",
  },
  {
    n: "03",
    title: "Run one cycle in parallel",
    text: "Your team works in Hisab alongside the old process for a full period, so nothing is trusted before it is proven.",
  },
  {
    n: "04",
    title: "Close in Hisab",
    text: "The first close runs on posted entries. From there the old spreadsheets are archived, not maintained.",
  },
];

const LOCAL: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "receipt",
    title: "VAT that matches the return",
    text: "15% output and input VAT tracked per document, with a VAT position you can reconcile against what you file.",
  },
  {
    icon: "globe",
    title: "Amharic and Tigrinya, not just English",
    text: "The interface, labels and printed documents work in the language your team reads fastest.",
  },
  {
    icon: "wallet",
    title: "Local payment rails",
    text: "Built to record collections through the channels Ethiopian businesses already use, including Chapa and Telebirr.",
  },
  {
    icon: "building",
    title: "Support in your time zone",
    text: "Built and supported from Addis Ababa by Hisab Technologies, not resold from another market.",
  },
];

const CONTROLS = [
  {
    strong: "Row-level security.",
    rest: "Every query is scoped to your organisation at the database level, not only in the application.",
  },
  {
    strong: "Period locking.",
    rest: "Closed months can be soft-closed for review or hard-locked so posted history cannot be altered.",
  },
  {
    strong: "Balanced or rejected.",
    rest: "A journal that does not balance is refused. There is no partial posting and no silent correction.",
  },
  {
    strong: "Document numbering.",
    rest: "Invoices, receipts and journals carry unique sequential numbers with an event history attached.",
  },
];

const CONTROL_CARDS: { icon: IconName; title: string; text: string }[] = [
  { icon: "lock", title: "Scoped access", text: "Organisation-level row security on every table." },
  { icon: "clock", title: "Period states", text: "Open, soft-closed and locked, with review in between." },
  { icon: "shield", title: "Audit events", text: "Who posted what, when, against which document." },
  { icon: "layers", title: "Atomic posting", text: "Stock, ledger and VAT move together or not at all." },
];

const OVERVIEW_ROWS = [
  ["Gross sales", "ETB 4,821,400", "+18.6%"],
  ["Cash and bank", "ETB 2,483,900", "+8.4%"],
  ["Receivables outstanding", "ETB 1,362,100", "11 accounts"],
  ["Output VAT payable", "ETB 628,878", "Filed monthly"],
  ["Stock at cost", "ETB 3,104,500", "148 items"],
];

/* ------------------------------------------------------------------
   Scroll reveal
   ------------------------------------------------------------------ */

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setShown(true);
          observer.disconnect();
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`h-reveal ${className}`.trim()} data-shown={shown}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------
   Signature: the balanced posting
   ------------------------------------------------------------------ */

function BalancedPosting() {
  return (
    <div>
      <figure className="h-ledger" style={{ margin: 0 }}>
        <div className="h-ledger__head">
          <span className="h-ledger__doc">
            <b>INV-2041</b>
            <span>23 Jul 2026</span>
          </span>
          <span className="h-ledger__state">Posted</span>
        </div>

        <div className="h-ledger__source">
          <span className="h-ledger__source-label">
            <strong>Abyssinia Trading PLC</strong>
            <span>Sales invoice · 15% VAT inclusive</span>
          </span>
          <span className="h-ledger__amount">ETB 48,200.00</span>
        </div>

        <table className="h-ledger__table">
          <caption>Journal entry created</caption>
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">Debit</th>
              <th scope="col">Credit</th>
            </tr>
          </thead>
          <tbody>
            {POSTING_LINES.map((line, index) => (
              <tr
                className="h-ledger__row"
                key={line.code}
                style={{ "--row-delay": `${240 + index * 220}ms` } as CSSProperties}
              >
                <td>
                  <span className="h-ledger__account">
                    <span className="h-ledger__code">{line.code}</span>
                    {line.account}
                  </span>
                </td>
                <td>{line.debit || "—"}</td>
                <td>{line.credit || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="h-ledger__foot">
          <span className="h-ledger__balance">
            <Icon name="check" size={15} />
            Balanced
          </span>
          <span className="h-ledger__totals">
            <span>Dr 48,200.00</span>
            <span>Cr 48,200.00</span>
          </span>
        </div>
      </figure>

      <p className="h-ledger__caption">
        One invoice. Three ledger lines. Written the moment it is issued.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */

export function MarketingHome() {
  return (
    <>
      {/* Hero ------------------------------------------------------ */}
      <section className="h-hero">
        <div className="h-shell h-hero__grid">
          <div className="h-hero__copy">
            <p className="h-eyebrow">Hisab ERP · Addis Ababa</p>
            <h1>
              Run the whole business from <em>one ledger</em>.
            </h1>
            <p className="h-hero__lead">
              Hisab connects sales, inventory, purchasing and cash to a single double-entry
              general ledger — so the number you report is the number that happened.
            </p>
            <div className="h-actions">
              <Link className="h-btn h-btn--primary" href="/request-demo">
                Book a demo <Icon name="arrow" size={16} />
              </Link>
              <Link className="h-btn h-btn--ghost" href="/product-tour">
                Take the product tour
              </Link>
            </div>
            <p className="h-hero__note">
              <span>
                <Icon name="check" size={14} /> No card to start
              </span>
              <span>
                <Icon name="check" size={14} /> Spreadsheet migration included
              </span>
            </p>
          </div>

          <BalancedPosting />
        </div>
      </section>

      {/* Facts ----------------------------------------------------- */}
      <section className="h-section h-section--tight">
        <div className="h-shell">
          <Reveal>
            <div className="h-strip">
              {FACTS.map((fact) => (
                <div className="h-strip__cell" key={fact.label}>
                  <div className="h-strip__value" data-num="">
                    {fact.value}
                  </div>
                  <p className="h-strip__label">{fact.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why businesses move --------------------------------------- */}
      <section className="h-section h-section--mist">
        <div className="h-shell h-split">
          <div className="h-split__copy">
            <p className="h-eyebrow">Why businesses move</p>
            <h2>Spreadsheets do not disagree politely. They just disagree.</h2>
            <p className="h-hero__lead">
              Most growing Ethiopian companies run on a sales sheet, a stock sheet and a
              cashbook that were each correct on a different day. Hisab removes the gap by
              making one record serve all three.
            </p>
            <ul className="h-checks">
              {REPLACES.map((item) => (
                <li key={item.strong}>
                  <Icon name="check" size={16} />
                  <span>
                    <strong>{item.strong}</strong> {item.rest}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Reveal>
            <div className="h-panel">
              <div className="h-panel__bar">
                <Icon name="grid" size={14} />
                Management overview · this period
              </div>
              <div className="h-panel__body">
                <div className="h-rows">
                  {OVERVIEW_ROWS.map(([label, value, delta]) => (
                    <div className="h-row" key={label}>
                      <span>{label}</span>
                      <span style={{ display: "flex", alignItems: "baseline", gap: "0.7rem" }}>
                        <span className="h-row__value">{value}</span>
                        <span className="h-delta">{delta}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Modules --------------------------------------------------- */}
      <section className="h-section">
        <div className="h-shell">
          <div className="h-head">
            <p className="h-eyebrow">The system</p>
            <h2>Six connected areas, one set of books.</h2>
            <p>
              Each area is a workspace your team works in daily. None of them keeps its own
              private version of the truth.
            </p>
          </div>

          <div className="h-grid h-grid--3">
            {MODULES.map((module) => (
              <Reveal key={module.title}>
                <Link className="h-card h-card--hover" href={module.href} style={{ height: "100%" }}>
                  <span className="h-card__icon">
                    <Icon name={module.icon} size={17} />
                  </span>
                  <h3>{module.title}</h3>
                  <p>{module.text}</p>
                  <div className="h-card__meta">
                    {module.tags.map((tag) => (
                      <span className="h-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Controls -------------------------------------------------- */}
      <section className="h-section h-section--ink">
        <div className="h-shell h-split">
          <div className="h-split__copy">
            <p className="h-eyebrow">Controls</p>
            <h2>Accounting software should be difficult to lie to.</h2>
            <p className="h-hero__lead" style={{ color: "var(--on-dark-muted)" }}>
              These are not settings you switch on later. They are how posting works, which is
              why the reports can be trusted without a second check.
            </p>
            <ul className="h-checks">
              {CONTROLS.map((item) => (
                <li key={item.strong}>
                  <Icon name="check" size={16} />
                  <span>
                    <strong>{item.strong}</strong> {item.rest}
                  </span>
                </li>
              ))}
            </ul>
            <div className="h-actions" style={{ marginTop: "0.4rem" }}>
              <Link className="h-btn h-btn--ghost-invert" href="/trust">
                Read the Trust Centre <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>

          <Reveal>
            <div className="h-grid h-grid--2">
              {CONTROL_CARDS.map((item) => (
                <div className="h-card" key={item.title}>
                  <span className="h-card__icon">
                    <Icon name={item.icon} size={17} />
                  </span>
                  <h3 style={{ fontSize: "0.98rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.87rem" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Local by design ------------------------------------------- */}
      <section className="h-section h-section--mist">
        <div className="h-shell">
          <div className="h-head">
            <p className="h-eyebrow">Local by design</p>
            <h2>Built for how business is done here.</h2>
            <p>
              Not a foreign system with the currency field changed. The compliance rules,
              languages and payment habits were the starting requirements.
            </p>
          </div>

          <div className="h-grid h-grid--4">
            {LOCAL.map((item) => (
              <Reveal key={item.title}>
                <div className="h-card" style={{ height: "100%" }}>
                  <span className="h-card__icon">
                    <Icon name={item.icon} size={17} />
                  </span>
                  <h3 style={{ fontSize: "1rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.89rem" }}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation -------------------------------------------- */}
      <section className="h-section">
        <div className="h-shell">
          <div className="h-head">
            <p className="h-eyebrow">Implementation</p>
            <h2>Four steps, and you never run blind.</h2>
            <p>
              Changing the system a business runs on is a real risk. This sequence is built so
              nothing is trusted before it has been proven against your own numbers.
            </p>
          </div>

          <div className="h-steps">
            {SEQUENCE.map((step) => (
              <div className="h-step" key={step.n}>
                <span className="h-step__n">{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>

          <div className="h-actions" style={{ marginTop: "2rem" }}>
            <Link className="h-link" href="/migration">
              See the migration guide <Icon name="arrow" size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Close ----------------------------------------------------- */}
      <section className="h-section h-section--tight">
        <div className="h-shell">
          <div className="h-cta">
            <h2>See it run on your own numbers.</h2>
            <p>
              Book a working session with the team in Addis Ababa. Bring a month of real
              invoices and we will post them in Hisab while you watch.
            </p>
            <div className="h-actions" style={{ justifyContent: "center" }}>
              <Link className="h-btn h-btn--accent" href="/request-demo">
                Book a demo <Icon name="arrow" size={16} />
              </Link>
              <Link className="h-btn h-btn--ghost-invert" href="/pricing">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default MarketingHome;
