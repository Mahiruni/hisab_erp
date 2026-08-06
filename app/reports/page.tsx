import Link from "next/link";
import { DemoNotice } from "../../components/demo-notice";
import { SectionShell } from "../../components/section-shell";
import { getDashboardSnapshot } from "../../lib/data/erp";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ReportsPage() {
  const snapshot = await getDashboardSnapshot();
  const operatingResult = snapshot.metrics.sales - snapshot.metrics.expenses;
  const metrics = [
    { label: "Sales", value: snapshot.metrics.sales, note: "Revenue recorded in the active reporting period" },
    { label: "Expenses", value: snapshot.metrics.expenses, note: "Operating costs captured by the ledger" },
    { label: "Cash", value: snapshot.metrics.cash, note: "Available cash position across the workspace" },
    { label: "Outstanding debt", value: snapshot.metrics.debt, note: "Open customer balances requiring collection" },
  ] as const;

  return (
    <SectionShell
      title="Reports"
      description="Review the latest business totals and export a clean management snapshot without leaving the ERP workspace."
      actions={<Link className="primary action-link" href="/api/reports/dashboard">Export CSV</Link>}
    >
      <DemoNotice mode={snapshot.mode} />

      <section className="section-kpis report-kpis" aria-label="Report summary">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{money(metric.value)}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </section>

      <section className="report-insight-grid">
        <article className="data-panel report-result-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Operating result</p>
              <h2>{operatingResult >= 0 ? "Positive operating position" : "Cost attention required"}</h2>
            </div>
            <span className={`report-result-badge ${operatingResult >= 0 ? "positive" : "attention"}`}>
              {money(operatingResult)}
            </span>
          </div>
          <p>Sales less recorded expenses provides a fast management view. Confirm posted journals and period completeness before treating this as a finalized financial statement.</p>
          <div className="report-balance-comparison" aria-label="Sales and expenses comparison">
            <div><span>Sales</span><strong>{money(snapshot.metrics.sales)}</strong></div>
            <div><span>Expenses</span><strong>{money(snapshot.metrics.expenses)}</strong></div>
          </div>
        </article>

        <article className="data-panel report-export-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Dashboard report</p>
              <h2>Export package ready</h2>
            </div>
            <span className="status-badge">{snapshot.mode}</span>
          </div>
          <p>The CSV package includes organization details, current management metrics, and recent transactions in a spreadsheet-ready format.</p>
          <ul className="report-checklist">
            <li><span aria-hidden="true">✓</span><strong>Organization context</strong></li>
            <li><span aria-hidden="true">✓</span><strong>Current KPI snapshot</strong></li>
            <li><span aria-hidden="true">✓</span><strong>Recent transaction activity</strong></li>
          </ul>
          <Link className="primary action-link report-export-action" href="/api/reports/dashboard">Download dashboard CSV</Link>
        </article>
      </section>
    </SectionShell>
  );
}
