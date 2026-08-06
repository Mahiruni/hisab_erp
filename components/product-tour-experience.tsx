"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";

const scenes = [
  {
    id: "overview",
    label: "Executive dashboard",
    shortLabel: "Overview",
    eyebrow: "Start with clarity",
    title: "See the business position in one glance.",
    description: "Revenue, cash, receivables, payables, stock attention and recent activity are brought into one decision-ready view.",
    metrics: [["Today’s revenue", "ETB 84,600", "+12.8%"], ["Cash available", "ETB 318,400", "Current"], ["Receivables", "ETB 72,900", "11 accounts"]],
    rows: [["Sale · Abeba Trading", "ETB 18,900", "Paid"], ["Supplier bill · Meron Distribution", "ETB 34,500", "Due"], ["Stock alert · Cooking Oil 5L", "7 units", "Reorder"]],
    bars: [44, 58, 52, 70, 78, 92],
    moduleHref: "/product/finance-cashflow",
  },
  {
    id: "sales",
    label: "Sales & invoicing",
    shortLabel: "Sales",
    eyebrow: "Revenue workflow",
    title: "Move from sale to invoice to collection without losing the trail.",
    description: "Record the transaction, issue the invoice, collect full or partial payment and keep the customer balance current.",
    metrics: [["Sales today", "31", "Live"], ["Invoiced", "ETB 96,240", "Today"], ["Outstanding", "ETB 26,450", "4 invoices"]],
    rows: [["INV-1048 · Abeba Trading", "ETB 18,900", "Paid"], ["INV-1047 · Nuru Market", "ETB 12,400", "Partial"], ["INV-1046 · Selam Services", "ETB 8,750", "Due Friday"]],
    bars: [38, 64, 49, 76, 67, 94],
    moduleHref: "/product/sales-invoicing",
  },
  {
    id: "inventory",
    label: "Inventory control",
    shortLabel: "Inventory",
    eyebrow: "Stock visibility",
    title: "Know what is available, what is moving and what needs action.",
    description: "Sales, purchases and adjustments maintain a reliable quantity history while attention lists surface low-stock risk.",
    metrics: [["Inventory value", "ETB 684,200", "146 items"], ["Low stock", "9 items", "3 urgent"], ["Fastest mover", "A-24", "86 units"]],
    rows: [["Premium Coffee 1kg", "48 units", "Healthy"], ["Cooking Oil 5L", "7 units", "Reorder"], ["Packaging Box M", "126 units", "Stable"]],
    bars: [71, 56, 83, 48, 66, 88],
    moduleHref: "/product/inventory",
  },
  {
    id: "finance",
    label: "Finance & cash flow",
    shortLabel: "Finance",
    eyebrow: "Financial control",
    title: "Understand cash and obligations before month-end.",
    description: "Daily activity becomes a current view of income, expenses, collections, supplier obligations and operating margin.",
    metrics: [["Net cash flow", "ETB 96,240", "Positive"], ["Operating margin", "31.8%", "+4.2 pts"], ["Payables", "ETB 41,200", "6 bills"]],
    rows: [["Collections received", "ETB 148,600", "This month"], ["Operating expenses", "ETB 126,800", "This month"], ["Supplier payments", "ETB 52,400", "This month"]],
    bars: [42, 50, 61, 58, 79, 87],
    moduleHref: "/product/finance-cashflow",
  },
  {
    id: "reports",
    label: "Reports & analytics",
    shortLabel: "Reports",
    eyebrow: "Management insight",
    title: "Turn records into decisions without rebuilding spreadsheets.",
    description: "Compare periods, balances and operational performance using the same connected data that runs the business.",
    metrics: [["Revenue growth", "+24%", "Prior period"], ["Collection rate", "91.4%", "Current"], ["Inventory turnover", "4.8×", "Quarter"]],
    rows: [["Revenue performance", "+24%", "Improving"], ["Outstanding debt", "ETB 72,900", "11 accounts"], ["Expense ratio", "68.2%", "Improved"]],
    bars: [36, 49, 57, 68, 80, 96],
    moduleHref: "/product/reports-analytics",
  },
] as const;

type SceneId = (typeof scenes)[number]["id"];

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={direction === "left" ? "M19 12H5m6 6-6-6 6-6" : "M5 12h14m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductTourExperience({ compact = false }: { compact?: boolean }) {
  const [activeId, setActiveId] = useState<SceneId>("overview");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = scenes.findIndex((item) => item.id === activeId);
  const scene = useMemo(() => scenes[activeIndex] ?? scenes[0], [activeIndex]);

  const activateIndex = (index: number, moveFocus = false) => {
    const normalized = (index + scenes.length) % scenes.length;
    setActiveId(scenes[normalized].id);
    if (moveFocus) window.requestAnimationFrame(() => tabRefs.current[normalized]?.focus());
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      activateIndex(index + 1, true);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      activateIndex(index - 1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      activateIndex(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      activateIndex(scenes.length - 1, true);
    }
  };

  return (
    <section
      className={compact ? "product-tour product-tour-compact" : "product-tour"}
      aria-label="Interactive Hisab ERP product tour"
      data-active-scene={scene.id}
    >
      <div className="product-tour-toolbar">
        <div>
          <span>Interactive workspace</span>
          <strong>{String(activeIndex + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</strong>
        </div>
        <div className="product-tour-progress" aria-hidden="true">
          {scenes.map((item, index) => <span className={index <= activeIndex ? "complete" : undefined} key={item.id} />)}
        </div>
        <span className="product-tour-live"><i /> Live product preview</span>
      </div>

      <div className="product-tour-tabs" role="tablist" aria-label="Product areas">
        {scenes.map((item, index) => (
          <button
            ref={(node) => { tabRefs.current[index] = node; }}
            id={`product-tour-tab-${item.id}`}
            type="button"
            role="tab"
            tabIndex={item.id === activeId ? 0 : -1}
            aria-selected={item.id === activeId}
            aria-controls="product-tour-panel"
            className={item.id === activeId ? "active" : undefined}
            onClick={() => setActiveId(item.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            key={item.id}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.label}</strong>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>

      <div
        className="product-tour-stage"
        id="product-tour-panel"
        role="tabpanel"
        aria-labelledby={`product-tour-tab-${scene.id}`}
        tabIndex={0}
      >
        <div className="product-tour-copy" aria-live="polite">
          <span className="marketing-eyebrow">{scene.eyebrow}</span>
          <h2>{scene.title}</h2>
          <p>{scene.description}</p>
          <div className="product-tour-copy-actions">
            <Link href={scene.moduleHref} className="marketing-start">Explore this module <ArrowIcon /></Link>
            {!compact && <Link href="/request-demo" className="marketing-demo">Request a guided demo</Link>}
          </div>
          <div className="product-tour-scene-nav">
            <button type="button" onClick={() => activateIndex(activeIndex - 1)} aria-label="Show previous product area"><ArrowIcon direction="left" /> Previous</button>
            <span>{scene.shortLabel}</span>
            <button type="button" onClick={() => activateIndex(activeIndex + 1)} aria-label="Show next product area">Next <ArrowIcon /></button>
          </div>
        </div>

        <div className="tour-device-showroom">
          <div className="tour-showroom-glow" aria-hidden="true" />
          <div className="tour-macbook" key={`desktop-${scene.id}`}>
            <div className="tour-app-window">
              <div className="tour-window-top">
                <div><i /><i /><i /></div>
                <strong>Hisab ERP · {scene.label}</strong>
                <span>Live workspace</span>
              </div>
              <div className="tour-window-layout">
                <aside>
                  <img src="/hisab-logo.svg" alt="" width="34" height="34" />
                  {scenes.map((item) => <span className={item.id === activeId ? "active" : undefined} key={item.id}>{item.shortLabel}</span>)}
                </aside>
                <div className="tour-window-content">
                  <div className="tour-content-heading"><div><small>Good afternoon, Mahir</small><h3>{scene.label}</h3></div><button type="button">+ New record</button></div>
                  <div className="tour-metrics">
                    {scene.metrics.map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}
                  </div>
                  <div className="tour-data-grid">
                    <section className="tour-chart">
                      <header><strong>Performance trend</strong><small>Last six periods</small></header>
                      <div className="tour-bars">{scene.bars.map((height, index) => <span style={{ height: `${height}%` }} key={`${scene.id}-${index}`} />)}</div>
                    </section>
                    <section className="tour-activity">
                      <header><strong>Current activity</strong><small>Updated now</small></header>
                      <div>{scene.rows.map(([label, value, meta]) => <article key={label}><span><strong>{label}</strong><small>{meta}</small></span><b>{value}</b></article>)}</div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
            <div className="tour-macbook-base" aria-hidden="true"><span /></div>
          </div>

          <div className="tour-iphone" aria-hidden="true" key={`mobile-${scene.id}`}>
            <div className="tour-iphone-screen">
              <div className="tour-dynamic-island" />
              <header><img src="/hisab-logo.svg" alt="" width="26" height="26" /><span><small>Hisab mobile</small><strong>{scene.shortLabel}</strong></span><b>MA</b></header>
              <section className="tour-phone-primary"><small>{scene.metrics[0][0]}</small><strong>{scene.metrics[0][1]}</strong><span>{scene.metrics[0][2]}</span></section>
              <section className="tour-phone-chart"><div>{scene.bars.map((height, index) => <span style={{ height: `${height}%` }} key={`phone-${scene.id}-${index}`} />)}</div></section>
              <section className="tour-phone-activity"><strong>Latest activity</strong>{scene.rows.slice(0, 2).map(([label, value, meta]) => <article key={label}><span><b>{label}</b><small>{meta}</small></span><strong>{value}</strong></article>)}</section>
              <nav><span className="active" /><span /><span /><span /></nav>
            </div>
          </div>

          <div className="tour-device-note" aria-hidden="true"><span>Desktop precision</span><i /> <span>Mobile continuity</span></div>
        </div>
      </div>
    </section>
  );
}
