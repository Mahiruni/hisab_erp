import { DemoNotice } from "../../components/demo-notice";
import { SectionShell } from "../../components/section-shell";
import { createCustomer } from "../../lib/actions/erp";
import { listCustomers } from "../../lib/data/erp";
import { getServerFoundationCopy } from "../../lib/server-locale";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

function customerInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "C";
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const [params, data, localized] = await Promise.all([searchParams, listCustomers(), getServerFoundationCopy()]);
  const { mode, records } = data;
  const c = localized.copy.customers;
  const creditExposure = records.reduce((sum, customer) => sum + customer.creditLimit, 0);
  const reachableCustomers = records.filter((customer) => customer.email || customer.phone).length;

  return (
    <SectionShell title={c.title} description={c.description}>
      <DemoNotice mode={mode} />
      {params.created ? <div className="form-alert success">{c.created}</div> : null}

      <section className="section-kpis" aria-label={c.title}>
        <article>
          <span>{c.directory}</span>
          <strong>{records.length}</strong>
          <small>{c.count}</small>
        </article>
        <article>
          <span>{c.creditLimit}</span>
          <strong>ETB {creditExposure.toLocaleString()}</strong>
          <small>{records.length} {c.count}</small>
        </article>
        <article>
          <span>{c.email}</span>
          <strong>{reachableCustomers}</strong>
          <small>{records.length - reachableCustomers} {c.noContact}</small>
        </article>
      </section>

      <div className="management-grid customer-management-grid">
        <section className="data-panel customer-directory-panel">
          <div className="panel-head customer-panel-head">
            <div>
              <p className="eyebrow">{c.directory}</p>
              <h2>{records.length} {c.count}</h2>
            </div>
            <span className="status-badge">{mode}</span>
          </div>

          {records.length ? (
            <div className="customer-record-list">
              {records.map((customer) => (
                <article className="customer-record-card" key={customer.id}>
                  <span className="customer-record-avatar" aria-hidden="true">{customerInitial(customer.name)}</span>
                  <div className="customer-record-copy">
                    <strong>{customer.name}</strong>
                    <span>{customer.email || customer.phone || c.noContact}</span>
                  </div>
                  <div className="customer-record-credit">
                    <small>{c.creditLimit}</small>
                    <strong>ETB {customer.creditLimit.toLocaleString()}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="section-empty-state">
              <span aria-hidden="true">C</span>
              <strong>{c.directory}</strong>
              <p>{c.description}</p>
            </div>
          )}
        </section>

        <section className="data-panel customer-create-panel">
          <div className="panel-head customer-panel-head">
            <div>
              <p className="eyebrow">{c.newLabel}</p>
              <h2>{c.addTitle}</h2>
            </div>
          </div>
          <form action={createCustomer} className="erp-form customer-form">
            <label>{c.name}<input name="name" required disabled={mode === "demo"} /></label>
            <label>{c.email}<input name="email" type="email" disabled={mode === "demo"} /></label>
            <label>{c.phone}<input name="phone" disabled={mode === "demo"} /></label>
            <label>{c.tin}<input name="tin" disabled={mode === "demo"} /></label>
            <label>{c.creditLimitEtb}<input name="creditLimit" type="number" min="0" step="0.01" defaultValue="0" disabled={mode === "demo"} /></label>
            <button className="primary" type="submit" disabled={mode === "demo"}>{c.save}</button>
          </form>
        </section>
      </div>
    </SectionShell>
  );
}
