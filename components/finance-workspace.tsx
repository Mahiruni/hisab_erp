"use client";

import { useMemo, useState } from "react";
import {
  createFinanceAccount,
  postAssetDepreciation,
  postManualJournal,
  recordFinancePayment,
  registerFixedAsset,
  setAccountingPeriodStatus,
} from "../lib/actions/finance";
import type { FinanceAccountRecord, FinanceSnapshot } from "../lib/data/types";
import { DemoNotice } from "./demo-notice";

const tabs = [
  ["overview", "Overview"],
  ["journal", "Journal"],
  ["accounts", "Chart of accounts"],
  ["payments", "Payments & expenses"],
  ["tax", "Tax"],
  ["assets", "Assets"],
  ["closing", "Period closing"],
] as const;

type FinanceTab = (typeof tabs)[number][0];

function money(value: number) {
  return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 2 }).format(value || 0);
}

function accountLabel(account: FinanceAccountRecord) {
  return `${account.code} · ${account.name}`;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function EmptyState({ children }: { children: string }) {
  return <div className="finance-empty">{children}</div>;
}

export function FinanceWorkspace({
  snapshot,
  initialTab,
  success,
  canManage,
}: {
  snapshot: FinanceSnapshot;
  initialTab: string;
  success?: string;
  canManage: boolean;
}) {
  const validInitialTab = tabs.some(([key]) => key === initialTab) ? initialTab as FinanceTab : "overview";
  const [activeTab, setActiveTab] = useState<FinanceTab>(validInitialTab);
  const today = new Date().toISOString().slice(0, 10);
  const writesDisabled = snapshot.mode === "demo" || !canManage;

  const accountGroups = useMemo(() => {
    const active = snapshot.accounts;
    return {
      active,
      manual: active.filter((account) => account.subtype !== "receivable" && account.subtype !== "inventory"),
      cash: active.filter((account) => account.subtype === "cash" || account.subtype === "bank" || account.code === "1000" || account.code === "1010"),
      tax: active.filter((account) => account.subtype === "tax"),
      asset: active.filter((account) => account.type === "asset"),
      expense: active.filter((account) => account.type === "expense"),
      funding: active.filter((account) => account.type === "asset" || account.type === "liability" || account.type === "equity"),
    };
  }, [snapshot.accounts]);

  const byCode = (code: string) => snapshot.accounts.find((account) => account.code === code)?.id ?? "";
  const trialDebit = snapshot.accounts.reduce((sum, account) => sum + account.debit, 0);
  const trialCredit = snapshot.accounts.reduce((sum, account) => sum + account.credit, 0);
  const netIncome = snapshot.metrics.revenue - snapshot.metrics.expenses;
  const outputTax = snapshot.taxCodes.filter((tax) => tax.type === "output").reduce((sum, tax) => sum + tax.balance, 0);
  const inputTax = snapshot.taxCodes.filter((tax) => tax.type === "input").reduce((sum, tax) => sum + tax.balance, 0);
  const taxPayable = outputTax - inputTax;

  return (
    <main className="finance-page">
      <header className="finance-hero">
        <div>
          <p className="eyebrow">Phase 1 · Financial control center</p>
          <h1>Finance &amp; Accounting</h1>
          <p>The financial source of truth for every sale, expense, payment, tax, asset and closing period.</p>
        </div>
        <div className="finance-hero-state">
          <span className="finance-live-dot" aria-hidden="true" />
          <div><small>Workspace</small><strong>{snapshot.organizationName}</strong></div>
        </div>
      </header>

      <DemoNotice mode={snapshot.mode} />
      {success && <div className="form-alert success finance-success">{success}</div>}
      {!canManage && snapshot.mode === "live" && <div className="form-alert warning finance-success">You have read-only finance access. An owner, administrator or accountant can post transactions.</div>}

      <nav className="finance-tabs" aria-label="Finance workspace sections">
        {tabs.map(([key, label]) => (
          <button className={activeTab === key ? "active" : ""} type="button" key={key} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="finance-view">
          <section className="finance-kpis">
            <article><span>Cash &amp; bank</span><strong>{money(snapshot.metrics.cash)}</strong><small>Available liquidity</small></article>
            <article><span>Receivables</span><strong>{money(snapshot.metrics.receivables)}</strong><small>Customer balances</small></article>
            <article><span>Payables</span><strong>{money(snapshot.metrics.payables)}</strong><small>Supplier obligations</small></article>
            <article className={netIncome >= 0 ? "positive" : "negative"}><span>Net income</span><strong>{money(netIncome)}</strong><small>Current month</small></article>
          </section>

          <section className="finance-overview-grid">
            <article className="finance-panel finance-statement">
              <div className="finance-panel-head"><div><p className="eyebrow">Income statement</p><h2>Monthly performance</h2></div><span>Current month</span></div>
              <div className="statement-line"><span>Revenue</span><strong>{money(snapshot.metrics.revenue)}</strong></div>
              <div className="statement-line"><span>Expenses</span><strong>{money(snapshot.metrics.expenses)}</strong></div>
              <div className="statement-line total"><span>Net income</span><strong>{money(netIncome)}</strong></div>
              <div className="profit-meter"><i style={{ width: `${snapshot.metrics.revenue > 0 ? Math.max(4, Math.min(100, (Math.max(netIncome, 0) / snapshot.metrics.revenue) * 100)) : 0}%` }} /></div>
            </article>

            <article className="finance-panel finance-statement">
              <div className="finance-panel-head"><div><p className="eyebrow">Balance sheet</p><h2>Financial position</h2></div><span>Posted ledger</span></div>
              <div className="statement-line"><span>Assets</span><strong>{money(snapshot.metrics.assets)}</strong></div>
              <div className="statement-line"><span>Liabilities</span><strong>{money(snapshot.metrics.liabilities)}</strong></div>
              <div className="statement-line total"><span>Equity</span><strong>{money(snapshot.metrics.equity)}</strong></div>
              <div className="finance-equation"><span>A</span><b>=</b><span>L</span><b>+</b><span>E</span></div>
            </article>

            <article className="finance-panel finance-control-card">
              <div className="finance-panel-head"><div><p className="eyebrow">Ledger integrity</p><h2>Trial balance</h2></div><span className={Math.abs(trialDebit - trialCredit) < 0.01 ? "control-ok" : "control-alert"}>{Math.abs(trialDebit - trialCredit) < 0.01 ? "Balanced" : "Review"}</span></div>
              <div className="trial-pair"><div><small>Total debits</small><strong>{money(trialDebit)}</strong></div><div><small>Total credits</small><strong>{money(trialCredit)}</strong></div></div>
              <p>Posted journals are immutable, every posting must balance, and locked periods reject new entries.</p>
            </article>
          </section>

          <section className="finance-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Recent activity</p><h2>Latest posted journals</h2></div><button type="button" onClick={() => setActiveTab("journal")}>Open journal →</button></div>
            {snapshot.journals.length ? <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Entry</th><th>Date</th><th>Memo</th><th>Status</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{snapshot.journals.slice(0, 6).map((journal) => <tr key={journal.id}><td><strong>{journal.number}</strong></td><td>{journal.date}</td><td>{journal.memo}</td><td><span className="finance-status posted">{journal.status}</span></td><td>{money(journal.debit)}</td><td>{money(journal.credit)}</td></tr>)}</tbody></table></div> : <EmptyState>No journals have been posted yet.</EmptyState>}
          </section>
        </div>
      )}

      {activeTab === "journal" && (
        <div className="finance-view finance-two-column">
          <section className="finance-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Double-entry journal</p><h2>Post a manual entry</h2></div><span className="control-ok">Balanced only</span></div>
            <form action={postManualJournal} className="finance-form">
              <label>Entry date<input name="entryDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label>
              <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required disabled={writesDisabled} /></label>
              <label className="full">Memo<input name="memo" maxLength={300} placeholder="Describe the business purpose" required disabled={writesDisabled} /></label>
              <label>Debit account<select name="debitAccountId" required defaultValue="" disabled={writesDisabled}><option value="" disabled>Select debit account</option>{accountGroups.manual.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <label>Credit account<select name="creditAccountId" required defaultValue="" disabled={writesDisabled}><option value="" disabled>Select credit account</option>{accountGroups.manual.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <button className="primary full" type="submit" disabled={writesDisabled}>Post balanced journal</button>
            </form>
          </section>

          <section className="finance-panel finance-wide-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">General ledger</p><h2>Journal history</h2></div><span>{snapshot.journals.length} entries</span></div>
            {snapshot.journals.length ? <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Entry</th><th>Date</th><th>Memo</th><th>Status</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{snapshot.journals.map((journal) => <tr key={journal.id}><td><strong>{journal.number}</strong></td><td>{journal.date}</td><td>{journal.memo}</td><td><span className={`finance-status ${journal.status}`}>{journal.status}</span></td><td>{money(journal.debit)}</td><td>{money(journal.credit)}</td></tr>)}</tbody></table></div> : <EmptyState>No journal entries are available.</EmptyState>}
          </section>
        </div>
      )}

      {activeTab === "accounts" && (
        <div className="finance-view finance-two-column">
          <section className="finance-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Ledger structure</p><h2>Add an account</h2></div><span>ETB default</span></div>
            <form action={createFinanceAccount} className="finance-form">
              <label>Account code<input name="code" placeholder="e.g. 1020" maxLength={24} required disabled={writesDisabled} /></label>
              <label>Account name<input name="name" placeholder="Commercial Bank" maxLength={160} required disabled={writesDisabled} /></label>
              <label>Type<select name="accountType" defaultValue="asset" disabled={writesDisabled}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option></select></label>
              <label>Normal side<select name="normalSide" defaultValue="debit" disabled={writesDisabled}><option value="debit">Debit</option><option value="credit">Credit</option></select></label>
              <label>Subtype<select name="accountSubtype" defaultValue="bank" disabled={writesDisabled}><option value="bank">Bank</option><option value="cash">Cash</option><option value="receivable">Receivable</option><option value="payable">Payable</option><option value="tax">Tax</option><option value="fixed_asset">Fixed asset</option><option value="operating_expense">Operating expense</option><option value="other">Other</option></select></label>
              <label>Currency<input name="currency" defaultValue="ETB" maxLength={3} required disabled={writesDisabled} /></label>
              <label>Bank name<input name="bankName" maxLength={120} placeholder="Optional" disabled={writesDisabled} /></label>
              <label>Masked account number<input name="accountNumberMasked" maxLength={40} placeholder="**** 1234" disabled={writesDisabled} /></label>
              <button className="primary full" type="submit" disabled={writesDisabled}>Create ledger account</button>
            </form>
          </section>

          <section className="finance-panel finance-wide-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Chart of accounts</p><h2>Account balances</h2></div><span>{snapshot.accounts.length} active</span></div>
            <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>{snapshot.accounts.map((account) => <tr key={account.id}><td><strong>{account.code}</strong></td><td>{account.name}<small>{account.subtype ? statusLabel(account.subtype) : "General"}</small></td><td><span className={`account-type ${account.type}`}>{account.type}</span></td><td>{money(account.debit)}</td><td>{money(account.credit)}</td><td><strong>{money(account.balance)}</strong></td></tr>)}</tbody></table></div>
          </section>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="finance-view finance-two-column">
          <section className="finance-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Cash management</p><h2>Post receipt or expense</h2></div><span>Automatic journal</span></div>
            <form action={recordFinancePayment} className="finance-form">
              <label>Transaction type<select name="paymentType" defaultValue="payment" disabled={writesDisabled}><option value="receipt">Customer receipt / income</option><option value="payment">Supplier payment / expense</option></select></label>
              <label>Date<input name="paymentDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label>
              <label>Base amount<input name="amount" type="number" min="0.01" step="0.01" required disabled={writesDisabled} /></label>
              <label>Tax amount<input name="taxAmount" type="number" min="0" step="0.01" defaultValue="0" disabled={writesDisabled} /></label>
              <label>Cash / bank account<select name="cashAccountId" required defaultValue={byCode("1000")} disabled={writesDisabled}>{accountGroups.cash.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <label>Counter account<select name="counterAccountId" required defaultValue={byCode("6000")} disabled={writesDisabled}>{snapshot.accounts.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <label>Tax account<select name="taxAccountId" defaultValue={byCode("1300")} disabled={writesDisabled}><option value="">No separate tax</option>{accountGroups.tax.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <label>Method<select name="method" defaultValue="bank_transfer" disabled={writesDisabled}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="mobile_money">Mobile money</option><option value="card">Card</option><option value="cheque">Cheque</option></select></label>
              <label>Customer<select name="customerId" defaultValue="" disabled={writesDisabled}><option value="">No customer</option>{snapshot.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label>
              <label>Allocate invoice<select name="invoiceId" defaultValue="" disabled={writesDisabled}><option value="">No invoice allocation</option>{snapshot.invoices.map((invoice) => <option value={invoice.id} key={invoice.id}>{invoice.number} · {money(invoice.outstanding)}</option>)}</select></label>
              <label>Counterparty<input name="counterpartyName" maxLength={160} placeholder="Customer or supplier" disabled={writesDisabled} /></label>
              <label>Reference<input name="reference" maxLength={100} placeholder="Bank or receipt reference" disabled={writesDisabled} /></label>
              <label className="full">Notes<textarea name="notes" rows={3} maxLength={500} disabled={writesDisabled} /></label>
              <button className="primary full" type="submit" disabled={writesDisabled}>Post transaction</button>
            </form>
          </section>

          <section className="finance-panel finance-wide-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Payment register</p><h2>Receipts and payments</h2></div><span>{snapshot.payments.length} records</span></div>
            {snapshot.payments.length ? <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Number</th><th>Date</th><th>Counterparty</th><th>Method</th><th>Type</th><th>Tax</th><th>Total</th></tr></thead><tbody>{snapshot.payments.map((payment) => <tr key={payment.id}><td><strong>{payment.number}</strong><small>{payment.reference || "No reference"}</small></td><td>{payment.date}</td><td>{payment.counterparty || "—"}</td><td>{statusLabel(payment.method)}</td><td><span className={`finance-status ${payment.type}`}>{payment.type}</span></td><td>{money(payment.taxAmount)}</td><td><strong>{money(payment.amount)}</strong></td></tr>)}</tbody></table></div> : <EmptyState>No receipts or payments have been posted.</EmptyState>}
          </section>
        </div>
      )}

      {activeTab === "tax" && (
        <div className="finance-view">
          <section className="finance-kpis tax-kpis">
            <article><span>Output tax</span><strong>{money(outputTax)}</strong><small>Collected on sales</small></article>
            <article><span>Input tax</span><strong>{money(inputTax)}</strong><small>Recoverable on purchases</small></article>
            <article className={taxPayable >= 0 ? "negative" : "positive"}><span>Net tax position</span><strong>{money(Math.abs(taxPayable))}</strong><small>{taxPayable >= 0 ? "Payable" : "Recoverable"}</small></article>
          </section>
          <section className="finance-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Tax configuration</p><h2>Effective tax codes</h2></div><span>Ethiopian base setup</span></div>
            <div className="tax-code-grid">{snapshot.taxCodes.map((tax) => <article key={tax.id}><div><span>{tax.code}</span><strong>{tax.rate}%</strong></div><h3>{tax.name}</h3><p>{tax.type === "output" ? "Collected from customers and credited to the tax liability account." : "Recorded on eligible purchases as recoverable input tax."}</p><footer><span className={`finance-status ${tax.active ? "posted" : "locked"}`}>{tax.active ? "Active" : "Inactive"}</span><strong>{money(tax.balance)}</strong></footer></article>)}</div>
            {!snapshot.taxCodes.length && <EmptyState>No tax codes have been configured.</EmptyState>}
          </section>
        </div>
      )}

      {activeTab === "assets" && (
        <div className="finance-view finance-two-column">
          <section className="finance-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Asset register</p><h2>Capitalize an asset</h2></div><span>Straight-line</span></div>
            <form action={registerFixedAsset} className="finance-form">
              <label>Asset name<input name="name" maxLength={160} required disabled={writesDisabled} /></label>
              <label>Category<input name="category" maxLength={80} placeholder="Vehicle, equipment…" required disabled={writesDisabled} /></label>
              <label>Acquisition date<input name="acquisitionDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label>
              <label>In-service date<input name="inServiceDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label>
              <label>Cost<input name="cost" type="number" min="0.01" step="0.01" required disabled={writesDisabled} /></label>
              <label>Salvage value<input name="salvageValue" type="number" min="0" step="0.01" defaultValue="0" disabled={writesDisabled} /></label>
              <label>Useful life (months)<input name="usefulLifeMonths" type="number" min="1" step="1" defaultValue="60" required disabled={writesDisabled} /></label>
              <label>Asset account<select name="assetAccountId" required defaultValue={byCode("1500")} disabled={writesDisabled}>{accountGroups.asset.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <label>Accumulated depreciation<select name="accumulatedDepreciationAccountId" required defaultValue={byCode("1510")} disabled={writesDisabled}>{accountGroups.asset.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <label>Depreciation expense<select name="depreciationExpenseAccountId" required defaultValue={byCode("6100")} disabled={writesDisabled}>{accountGroups.expense.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <label>Funding account<select name="fundingAccountId" required defaultValue={byCode("1000")} disabled={writesDisabled}>{accountGroups.funding.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label>
              <button className="primary full" type="submit" disabled={writesDisabled}>Register and post acquisition</button>
            </form>
          </section>

          <section className="finance-panel finance-wide-panel">
            <div className="finance-panel-head"><div><p className="eyebrow">Fixed assets</p><h2>Book value and depreciation</h2></div><span>{snapshot.assets.length} assets</span></div>
            {snapshot.assets.length ? <div className="asset-grid">{snapshot.assets.map((asset) => {
              const depreciable = Math.max(asset.cost - asset.salvageValue, 0);
              const progress = depreciable > 0 ? Math.min(100, (asset.accumulatedDepreciation / depreciable) * 100) : 0;
              return <article key={asset.id} className="asset-card"><header><div><span>{asset.number}</span><h3>{asset.name}</h3><p>{asset.category}</p></div><span className={`finance-status ${asset.status}`}>{statusLabel(asset.status)}</span></header><div className="asset-values"><div><small>Cost</small><strong>{money(asset.cost)}</strong></div><div><small>Accumulated depreciation</small><strong>{money(asset.accumulatedDepreciation)}</strong></div><div><small>Book value</small><strong>{money(asset.bookValue)}</strong></div></div><div className="asset-progress"><i style={{ width: `${progress}%` }} /></div><footer><span>{asset.usefulLifeMonths} months · In service {asset.inServiceDate}</span>{asset.status === "active" && <form action={postAssetDepreciation}><input type="hidden" name="assetId" value={asset.id} /><input type="hidden" name="depreciationDate" value={today} /><button type="submit" disabled={writesDisabled}>Post monthly depreciation</button></form>}</footer></article>;
            })}</div> : <EmptyState>No fixed assets have been registered.</EmptyState>}
          </section>
        </div>
      )}

      {activeTab === "closing" && (
        <div className="finance-view">
          <section className="finance-panel closing-intro">
            <div><p className="eyebrow">Close with confidence</p><h2>Accounting period controls</h2><p>Soft close signals review in progress. Locking a period blocks journal, payment, invoice, acquisition and depreciation postings dated inside that period.</p></div>
            <div className="closing-legend"><span><i className="open" />Open</span><span><i className="soft" />Soft closed</span><span><i className="locked" />Locked</span></div>
          </section>
          <section className="period-grid">
            {snapshot.periods.map((period) => <article className={`period-card ${period.status}`} key={period.id}><header><div><span>{period.startDate} → {period.endDate}</span><h3>{period.name}</h3></div><span className={`finance-status ${period.status}`}>{statusLabel(period.status)}</span></header><p>{period.status === "open" ? "Transactions can be posted normally." : period.status === "soft_closed" ? "Review is in progress; authorized users can still post adjustments." : "Posting is blocked and the ledger is protected."}</p><form action={setAccountingPeriodStatus} className="period-action"><input type="hidden" name="periodId" value={period.id} /><select name="status" defaultValue={period.status} disabled={writesDisabled}><option value="open">Open</option><option value="soft_closed">Soft close</option><option value="locked">Lock period</option></select><button type="submit" disabled={writesDisabled}>Apply</button></form></article>)}
          </section>
        </div>
      )}
    </main>
  );
}