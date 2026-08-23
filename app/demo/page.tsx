import Link from "next/link";
import { Icon } from "../../components/ui/icon";
import styles from "./demo.module.css";

export const metadata = {
  title: "Demo workspace | AetherERP",
  description: "Explore the AetherERP company dashboard with sample data. No account required.",
};

const modules = [
  ["grid", "Overview"],
  ["receipt", "Sales"],
  ["wallet", "Finance"],
  ["building", "Purchasing"],
  ["activity", "Inventory"],
  ["users", "People"],
  ["chart", "Reports"],
] as const;

const activity = [
  ["Invoice posted", "INV-2026-0819", "ETB 184,500", "2 min ago"],
  ["Customer payment received", "Abyssinia Trading PLC", "ETB 96,000", "18 min ago"],
  ["Purchase order approved", "PO-2026-0142", "ETB 72,840", "41 min ago"],
  ["Stock transfer completed", "Main → Bole Warehouse", "128 units", "1 hr ago"],
  ["Payroll run prepared", "August 2026", "38 employees", "3 hrs ago"],
] as const;

export default function DemoPage() {
  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand} aria-label="AetherERP home">
          <img src="/aether-logo.svg" alt="" width="38" height="38" />
          <span>Aether<strong>ERP</strong></span>
        </Link>

        <div className={styles.demoBadge}><i /> Demo workspace</div>

        <nav className={styles.nav} aria-label="Demo modules">
          {modules.map(([icon, label], index) => (
            <a key={label} className={index === 0 ? styles.activeNav : ""} href={`#${label.toLowerCase()}`}>
              <Icon name={icon} size={17} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <p>Sample Company PLC</p>
          <span>Addis Ababa, Ethiopia</span>
          <Link href="/auth/login">Exit demo</Link>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.eyebrow}>Executive command center</span>
            <h1>Good morning, Demo Admin</h1>
          </div>
          <div className={styles.topActions}>
            <span className={styles.period}>August 2026</span>
            <button type="button" aria-label="Notifications"><Icon name="activity" size={18} /></button>
            <div className={styles.avatar}>DA</div>
          </div>
        </header>

        <div className={styles.demoNotice}>
          <span><Icon name="shield-check" size={18} /></span>
          <div><strong>You are viewing a safe demo.</strong><p>All figures and records on this page are sample data. Nothing is connected to a real company or account.</p></div>
          <Link href="/auth/email-sign-up">Create real workspace <Icon name="arrow-right" size={15} /></Link>
        </div>

        <section className={styles.hero} id="overview">
          <div>
            <p>Company position</p>
            <h2>One operating picture.<br />Every function in sync.</h2>
          </div>
          <div className={styles.health}>
            <span>Business health</span>
            <strong>92</strong>
            <em>Excellent</em>
          </div>
        </section>

        <section className={styles.metrics}>
          <article>
            <span><Icon name="trending-up" size={17} /> Revenue</span>
            <strong>ETB 2.48M</strong>
            <p><em>+18.4%</em> vs last month</p>
          </article>
          <article>
            <span><Icon name="wallet" size={17} /> Cash balance</span>
            <strong>ETB 840K</strong>
            <p><em>Healthy</em> across 3 accounts</p>
          </article>
          <article>
            <span><Icon name="receipt" size={17} /> Receivables</span>
            <strong>ETB 316K</strong>
            <p>12 open invoices</p>
          </article>
          <article>
            <span><Icon name="activity" size={17} /> Inventory value</span>
            <strong>ETB 1.92M</strong>
            <p>4 warehouses</p>
          </article>
        </section>

        <section className={styles.mainGrid}>
          <article className={styles.chartCard}>
            <header><div><span>Net cash movement</span><strong>ETB 1.26M</strong></div><em>+24.0%</em></header>
            <div className={styles.chartLegend}><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div>
            <svg viewBox="0 0 720 220" role="img" aria-label="Sample cash movement chart">
              <defs>
                <linearGradient id="demo-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3EE0C4" stopOpacity=".28" />
                  <stop offset="100%" stopColor="#3EE0C4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className={styles.area} d="M0 184 C72 170 91 119 151 133 C222 150 252 75 324 97 C393 118 436 49 502 68 C577 90 612 32 720 21 L720 220 L0 220 Z" />
              <path className={styles.line} d="M0 184 C72 170 91 119 151 133 C222 150 252 75 324 97 C393 118 436 49 502 68 C577 90 612 32 720 21" />
              <circle cx="720" cy="21" r="6" />
            </svg>
          </article>

          <article className={styles.actionCard}>
            <header><span>Needs attention</span><strong>4</strong></header>
            <div><i className={styles.goldDot} /><span><strong>3 approvals</strong><small>Purchase & journal requests</small></span></div>
            <div><i className={styles.redDot} /><span><strong>1 overdue invoice</strong><small>ETB 42,000 · 9 days</small></span></div>
            <div><i className={styles.tealDot} /><span><strong>Bank reconciliation</strong><small>96% matched automatically</small></span></div>
            <button type="button">Review queue <Icon name="arrow-right" size={15} /></button>
          </article>
        </section>

        <section className={styles.lowerGrid}>
          <article className={styles.tableCard} id="sales">
            <header><div><span>Operational feed</span><strong>Latest company activity</strong></div><button type="button">View all</button></header>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Event</th><th>Reference</th><th>Value</th><th>Time</th></tr></thead>
                <tbody>
                  {activity.map(([event, reference, value, time]) => <tr key={event}><td>{event}</td><td>{reference}</td><td>{value}</td><td>{time}</td></tr>)}
                </tbody>
              </table>
            </div>
          </article>

          <article className={styles.snapshot} id="finance">
            <header><span>Finance snapshot</span><Icon name="wallet" size={18} /></header>
            <div><span>Gross margin</span><strong>36.8%</strong></div>
            <div><span>Operating expenses</span><strong>ETB 612K</strong></div>
            <div><span>Tax payable</span><strong>ETB 128K</strong></div>
            <div><span>Open period</span><strong>Aug 2026</strong></div>
          </article>
        </section>

        <section className={styles.moduleStrip} aria-label="Demo module summary">
          <article id="purchasing"><Icon name="building" size={19} /><span>Purchasing<strong>7 open POs</strong></span></article>
          <article id="inventory"><Icon name="activity" size={19} /><span>Inventory<strong>3 low-stock alerts</strong></span></article>
          <article id="people"><Icon name="users" size={19} /><span>People<strong>38 employees</strong></span></article>
          <article id="reports"><Icon name="chart" size={19} /><span>Reports<strong>12 saved views</strong></span></article>
        </section>

        <footer className={styles.footer}>
          <span>AetherERP demo · Sample Company PLC</span>
          <Link href="/auth/login">Return to sign in</Link>
        </footer>
      </section>
    </main>
  );
}
