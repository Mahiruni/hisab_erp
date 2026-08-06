"use client";

import { useDeferredValue, useEffect, useMemo, useReducer } from "react";
import {
  createFinanceAccount,
  postAssetDepreciation,
  postManualJournal,
  recordFinancePayment,
  registerFixedAsset,
  setAccountingPeriodStatus,
} from "../lib/actions/finance";
import type {
  FinanceAccountRecord,
  FinancePaymentRecord,
  FinanceSnapshot,
  JournalRecord,
} from "../lib/data/types";
import { DemoNotice } from "./demo-notice";
import { FinancialActionButton } from "./ui/financial-action-button";
import {
  VirtualizedDataGrid,
  type VirtualizedDataGridColumn,
} from "./ui/virtualized-data-grid";

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
type DataTab = "journal" | "accounts" | "payments";
type Density = "compact" | "comfortable";
type JournalSort = "newest" | "oldest";

type FinanceUiState = {
  activeTab: FinanceTab;
  density: Density;
  journalSort: JournalSort;
  search: Record<DataTab, string>;
};

type FinanceUiEvent =
  | { type: "SWITCH_TAB"; tab: FinanceTab }
  | { type: "SET_SEARCH"; tab: DataTab; value: string }
  | { type: "TOGGLE_DENSITY" }
  | { type: "TOGGLE_JOURNAL_SORT" };

function financeUiMachine(state: FinanceUiState, event: FinanceUiEvent): FinanceUiState {
  switch (event.type) {
    case "SWITCH_TAB":
      return state.activeTab === event.tab ? state : { ...state, activeTab: event.tab };
    case "SET_SEARCH":
      return { ...state, search: { ...state.search, [event.tab]: event.value } };
    case "TOGGLE_DENSITY":
      return { ...state, density: state.density === "compact" ? "comfortable" : "compact" };
    case "TOGGLE_JOURNAL_SORT":
      return { ...state, journalSort: state.journalSort === "newest" ? "oldest" : "newest" };
    default:
      return state;
  }
}

function money(value: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(value || 0);
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

const journalColumns: readonly VirtualizedDataGridColumn<JournalRecord>[] = [
  { key: "entry", header: "Entry", width: "140px", render: (journal) => <strong>{journal.number}</strong> },
  { key: "date", header: "Date", width: "120px", render: (journal) => journal.date },
  { key: "memo", header: "Memo", width: "minmax(240px, 1fr)", render: (journal) => journal.memo },
  { key: "status", header: "Status", width: "120px", render: (journal) => <span className={`finance-status ${journal.status}`}>{statusLabel(journal.status)}</span> },
  { key: "debit", header: "Debit", width: "150px", align: "end", render: (journal) => money(journal.debit) },
  { key: "credit", header: "Credit", width: "150px", align: "end", render: (journal) => money(journal.credit) },
];

const accountColumns: readonly VirtualizedDataGridColumn<FinanceAccountRecord>[] = [
  { key: "code", header: "Code", width: "110px", render: (account) => <strong>{account.code}</strong> },
  { key: "account", header: "Account", width: "minmax(230px, 1fr)", render: (account) => <><strong>{account.name}</strong><small>{account.subtype ? statusLabel(account.subtype) : "General"}</small></> },
  { key: "type", header: "Type", width: "120px", render: (account) => <span className={`account-type ${account.type}`}>{account.type}</span> },
  { key: "debit", header: "Debit", width: "145px", align: "end", render: (account) => money(account.debit) },
  { key: "credit", header: "Credit", width: "145px", align: "end", render: (account) => money(account.credit) },
  { key: "balance", header: "Balance", width: "155px", align: "end", render: (account) => <strong>{money(account.balance)}</strong> },
];

const paymentColumns: readonly VirtualizedDataGridColumn<FinancePaymentRecord>[] = [
  { key: "number", header: "Number", width: "150px", render: (payment) => <><strong>{payment.number}</strong><small>{payment.reference || "No reference"}</small></> },
  { key: "date", header: "Date", width: "120px", render: (payment) => payment.date },
  { key: "counterparty", header: "Counterparty", width: "minmax(200px, 1fr)", render: (payment) => payment.counterparty || "—" },
  { key: "method", header: "Method", width: "145px", render: (payment) => statusLabel(payment.method) },
  { key: "type", header: "Type", width: "120px", render: (payment) => <span className={`finance-status ${payment.type}`}>{statusLabel(payment.type)}</span> },
  { key: "tax", header: "Tax", width: "135px", align: "end", render: (payment) => money(payment.taxAmount) },
  { key: "total", header: "Total", width: "155px", align: "end", render: (payment) => <strong>{money(payment.amount)}</strong> },
];

function GridToolbar({ ariaLabel, density, onDensityChange, onSearchChange, query, sortLabel, onSortChange }: {
  ariaLabel: string;
  density: Density;
  onDensityChange: () => void;
  onSearchChange: (value: string) => void;
  query: string;
  sortLabel?: string;
  onSortChange?: () => void;
}) {
  return (
    <div className="finance-grid-toolbar" aria-label={ariaLabel}>
      <label className="finance-grid-search">
        <span className="sr-only">Search records</span>
        <input type="search" value={query} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search records…" autoComplete="off" />
      </label>
      {sortLabel && onSortChange ? <button type="button" onClick={onSortChange} data-haptic="selection">{sortLabel}</button> : null}
      <button type="button" aria-pressed={density === "compact"} onClick={onDensityChange} data-haptic="selection">
        {density === "compact" ? "Compact rows" : "Comfortable rows"}
      </button>
    </div>
  );
}

export function FinanceWorkspaceV2({ snapshot, initialTab, success, canManage }: {
  snapshot: FinanceSnapshot;
  initialTab: string;
  success?: string;
  canManage: boolean;
}) {
  const validInitialTab = tabs.some(([key]) => key === initialTab) ? initialTab as FinanceTab : "overview";
  const [ui, dispatch] = useReducer(financeUiMachine, {
    activeTab: validInitialTab,
    density: "compact",
    journalSort: "newest",
    search: { journal: "", accounts: "", payments: "" },
  });
  const deferredJournalSearch = useDeferredValue(ui.search.journal.trim().toLowerCase());
  const deferredAccountSearch = useDeferredValue(ui.search.accounts.trim().toLowerCase());
  const deferredPaymentSearch = useDeferredValue(ui.search.payments.trim().toLowerCase());
  const today = new Date().toISOString().slice(0, 10);
  const writesDisabled = snapshot.mode === "demo" || !canManage;
  const rowHeight = ui.density === "compact" ? 48 : 60;

  useEffect(() => {
    if (!success) return;
    window.dispatchEvent(new CustomEvent("hisab:haptic", { detail: { pattern: "success" } }));
  }, [success]);

  const accountGroups = useMemo(() => {
    const active = snapshot.accounts;
    return {
      manual: active.filter((account) => account.subtype !== "receivable" && account.subtype !== "inventory"),
      cash: active.filter((account) => account.subtype === "cash" || account.subtype === "bank" || account.code === "1000" || account.code === "1010"),
      tax: active.filter((account) => account.subtype === "tax"),
      asset: active.filter((account) => account.type === "asset"),
      expense: active.filter((account) => account.type === "expense"),
      funding: active.filter((account) => account.type === "asset" || account.type === "liability" || account.type === "equity"),
    };
  }, [snapshot.accounts]);

  const journalRows = useMemo(() => {
    const matching = deferredJournalSearch ? snapshot.journals.filter((journal) => [journal.number, journal.date, journal.memo, journal.status].join(" ").toLowerCase().includes(deferredJournalSearch)) : snapshot.journals;
    return [...matching].sort((left, right) => ui.journalSort === "newest" ? right.date.localeCompare(left.date) : left.date.localeCompare(right.date));
  }, [deferredJournalSearch, snapshot.journals, ui.journalSort]);

  const accountRows = useMemo(() => deferredAccountSearch ? snapshot.accounts.filter((account) => [account.code, account.name, account.type, account.subtype || ""].join(" ").toLowerCase().includes(deferredAccountSearch)) : snapshot.accounts, [deferredAccountSearch, snapshot.accounts]);
  const paymentRows = useMemo(() => deferredPaymentSearch ? snapshot.payments.filter((payment) => [payment.number, payment.date, payment.counterparty || "", payment.reference || "", payment.method, payment.type].join(" ").toLowerCase().includes(deferredPaymentSearch)) : snapshot.payments, [deferredPaymentSearch, snapshot.payments]);

  const byCode = (code: string) => snapshot.accounts.find((account) => account.code === code)?.id ?? "";
  const trialDebit = snapshot.accounts.reduce((sum, account) => sum + account.debit, 0);
  const trialCredit = snapshot.accounts.reduce((sum, account) => sum + account.credit, 0);
  const netIncome = snapshot.metrics.revenue - snapshot.metrics.expenses;
  const outputTax = snapshot.taxCodes.filter((tax) => tax.type === "output").reduce((sum, tax) => sum + tax.balance, 0);
  const inputTax = snapshot.taxCodes.filter((tax) => tax.type === "input").reduce((sum, tax) => sum + tax.balance, 0);
  const taxPayable = outputTax - inputTax;

  return (
    <main className="finance-page finance-runtime-page">
      <header className="finance-hero" data-motion-enter>
        <div><p className="eyebrow">Financial operating system</p><h1>Finance &amp; Accounting</h1><p>The financial source of truth for every sale, expense, payment, tax, asset and closing period.</p></div>
        <div className="finance-hero-state"><span className="finance-live-dot" aria-hidden="true" /><div><small>Live workspace</small><strong>{snapshot.organizationName}</strong></div></div>
      </header>
      <DemoNotice mode={snapshot.mode} />
      {success ? <div className="form-alert success finance-success" data-motion-enter>{success}</div> : null}
      {!canManage && snapshot.mode === "live" ? <div className="form-alert warning finance-success">You have read-only finance access. An owner, administrator or accountant can post transactions.</div> : null}

      <nav className="finance-tabs" aria-label="Finance workspace sections">
        {tabs.map(([key, label]) => <button aria-selected={ui.activeTab === key} className={ui.activeTab === key ? "active" : ""} type="button" key={key} onClick={() => dispatch({ type: "SWITCH_TAB", tab: key })} data-haptic="selection">{label}</button>)}
      </nav>

      {ui.activeTab === "overview" ? <div className="finance-view" data-motion-enter>
        <section className="finance-kpis">
          <article><span>Cash &amp; bank</span><strong>{money(snapshot.metrics.cash)}</strong><small>Available liquidity</small></article>
          <article><span>Receivables</span><strong>{money(snapshot.metrics.receivables)}</strong><small>Customer balances</small></article>
          <article><span>Payables</span><strong>{money(snapshot.metrics.payables)}</strong><small>Supplier obligations</small></article>
          <article className={netIncome >= 0 ? "positive" : "negative"}><span>Net income</span><strong>{money(netIncome)}</strong><small>Current month</small></article>
        </section>
        <section className="finance-overview-grid">
          <article className="finance-panel finance-statement"><div className="finance-panel-head"><div><p className="eyebrow">Income statement</p><h2>Monthly performance</h2></div><span>Current month</span></div><div className="statement-line"><span>Revenue</span><strong>{money(snapshot.metrics.revenue)}</strong></div><div className="statement-line"><span>Expenses</span><strong>{money(snapshot.metrics.expenses)}</strong></div><div className="statement-line total"><span>Net income</span><strong>{money(netIncome)}</strong></div><div className="profit-meter"><i style={{ width: `${snapshot.metrics.revenue > 0 ? Math.max(4, Math.min(100, (Math.max(netIncome, 0) / snapshot.metrics.revenue) * 100)) : 0}%` }} /></div></article>
          <article className="finance-panel finance-statement"><div className="finance-panel-head"><div><p className="eyebrow">Balance sheet</p><h2>Financial position</h2></div><span>Posted ledger</span></div><div className="statement-line"><span>Assets</span><strong>{money(snapshot.metrics.assets)}</strong></div><div className="statement-line"><span>Liabilities</span><strong>{money(snapshot.metrics.liabilities)}</strong></div><div className="statement-line total"><span>Equity</span><strong>{money(snapshot.metrics.equity)}</strong></div><div className="finance-equation"><span>A</span><b>=</b><span>L</span><b>+</b><span>E</span></div></article>
          <article className="finance-panel finance-control-card"><div className="finance-panel-head"><div><p className="eyebrow">Ledger integrity</p><h2>Trial balance</h2></div><span className={Math.abs(trialDebit - trialCredit) < 0.01 ? "control-ok" : "control-alert"}>{Math.abs(trialDebit - trialCredit) < 0.01 ? "Balanced" : "Review"}</span></div><div className="trial-pair"><div><small>Total debits</small><strong>{money(trialDebit)}</strong></div><div><small>Total credits</small><strong>{money(trialCredit)}</strong></div></div><p>Posted journals are immutable, every posting must balance, and locked periods reject new entries.</p></article>
        </section>
        <section className="finance-panel"><div className="finance-panel-head"><div><p className="eyebrow">Recent activity</p><h2>Latest posted journals</h2></div><button type="button" onClick={() => dispatch({ type: "SWITCH_TAB", tab: "journal" })}>Open journal →</button></div>{snapshot.journals.length ? <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Entry</th><th>Date</th><th>Memo</th><th>Status</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{snapshot.journals.slice(0, 6).map((journal) => <tr key={journal.id}><td><strong>{journal.number}</strong></td><td>{journal.date}</td><td>{journal.memo}</td><td><span className={`finance-status ${journal.status}`}>{statusLabel(journal.status)}</span></td><td>{money(journal.debit)}</td><td>{money(journal.credit)}</td></tr>)}</tbody></table></div> : <EmptyState>No journals have been posted yet.</EmptyState>}</section>
      </div> : null}

      {ui.activeTab === "journal" ? <div className="finance-view finance-two-column" data-motion-enter>
        <section className="finance-panel"><div className="finance-panel-head"><div><p className="eyebrow">Double-entry journal</p><h2>Post a manual entry</h2></div><span className="control-ok">Balanced only</span></div><form action={postManualJournal} className="finance-form"><label>Entry date<input name="entryDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required disabled={writesDisabled} /></label><label className="full">Memo<input name="memo" maxLength={300} placeholder="Describe the business purpose" required disabled={writesDisabled} /></label><label>Debit account<select name="debitAccountId" required defaultValue="" disabled={writesDisabled}><option value="" disabled>Select debit account</option>{accountGroups.manual.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><label>Credit account<select name="creditAccountId" required defaultValue="" disabled={writesDisabled}><option value="" disabled>Select credit account</option>{accountGroups.manual.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><FinancialActionButton className="primary full" disabled={writesDisabled} pendingLabel="Posting journal…">Post balanced journal</FinancialActionButton></form></section>
        <section className="finance-panel finance-wide-panel"><div className="finance-panel-head"><div><p className="eyebrow">General ledger</p><h2>Journal history</h2></div><span>{journalRows.length.toLocaleString("en-US")} entries</span></div><GridToolbar ariaLabel="Journal table controls" density={ui.density} onDensityChange={() => dispatch({ type: "TOGGLE_DENSITY" })} onSearchChange={(value) => dispatch({ type: "SET_SEARCH", tab: "journal", value })} query={ui.search.journal} sortLabel={ui.journalSort === "newest" ? "Newest first" : "Oldest first"} onSortChange={() => dispatch({ type: "TOGGLE_JOURNAL_SORT" })} /><VirtualizedDataGrid ariaLabel="General ledger journal history" rows={journalRows} columns={journalColumns} getRowKey={(journal) => journal.id} getRowClassName={(journal) => Math.abs(journal.debit - journal.credit) >= 0.01 ? "is-unbalanced" : undefined} emptyState="No journal entries match the current search." maxHeight={560} minWidth={920} rowHeight={rowHeight} /></section>
      </div> : null}

      {ui.activeTab === "accounts" ? <div className="finance-view finance-two-column" data-motion-enter>
        <section className="finance-panel"><div className="finance-panel-head"><div><p className="eyebrow">Ledger structure</p><h2>Add an account</h2></div><span>ETB default</span></div><form action={createFinanceAccount} className="finance-form"><label>Account code<input name="code" placeholder="e.g. 1020" maxLength={24} required disabled={writesDisabled} /></label><label>Account name<input name="name" placeholder="Commercial Bank" maxLength={160} required disabled={writesDisabled} /></label><label>Type<select name="accountType" defaultValue="asset" disabled={writesDisabled}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option></select></label><label>Normal side<select name="normalSide" defaultValue="debit" disabled={writesDisabled}><option value="debit">Debit</option><option value="credit">Credit</option></select></label><label>Subtype<select name="accountSubtype" defaultValue="bank" disabled={writesDisabled}><option value="bank">Bank</option><option value="cash">Cash</option><option value="receivable">Receivable</option><option value="payable">Payable</option><option value="tax">Tax</option><option value="fixed_asset">Fixed asset</option><option value="operating_expense">Operating expense</option><option value="other">Other</option></select></label><label>Currency<input name="currency" defaultValue="ETB" maxLength={3} required disabled={writesDisabled} /></label><label>Bank name<input name="bankName" maxLength={120} placeholder="Optional" disabled={writesDisabled} /></label><label>Masked account number<input name="accountNumberMasked" maxLength={40} placeholder="**** 1234" disabled={writesDisabled} /></label><FinancialActionButton className="primary full" disabled={writesDisabled} pendingLabel="Creating account…">Create ledger account</FinancialActionButton></form></section>
        <section className="finance-panel finance-wide-panel"><div className="finance-panel-head"><div><p className="eyebrow">Chart of accounts</p><h2>Account balances</h2></div><span>{accountRows.length.toLocaleString("en-US")} active</span></div><GridToolbar ariaLabel="Account table controls" density={ui.density} onDensityChange={() => dispatch({ type: "TOGGLE_DENSITY" })} onSearchChange={(value) => dispatch({ type: "SET_SEARCH", tab: "accounts", value })} query={ui.search.accounts} /><VirtualizedDataGrid ariaLabel="Chart of accounts" rows={accountRows} columns={accountColumns} getRowKey={(account) => account.id} emptyState="No accounts match the current search." maxHeight={560} minWidth={930} rowHeight={rowHeight} /></section>
      </div> : null}

      {ui.activeTab === "payments" ? <div className="finance-view finance-two-column" data-motion-enter>
        <section className="finance-panel"><div className="finance-panel-head"><div><p className="eyebrow">Cash management</p><h2>Post receipt or expense</h2></div><span>Automatic journal</span></div><form action={recordFinancePayment} className="finance-form"><label>Transaction type<select name="paymentType" defaultValue="payment" disabled={writesDisabled}><option value="receipt">Customer receipt / income</option><option value="payment">Supplier payment / expense</option></select></label><label>Date<input name="paymentDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label><label>Base amount<input name="amount" type="number" min="0.01" step="0.01" required disabled={writesDisabled} /></label><label>Tax amount<input name="taxAmount" type="number" min="0" step="0.01" defaultValue="0" disabled={writesDisabled} /></label><label>Cash / bank account<select name="cashAccountId" required defaultValue={byCode("1000")} disabled={writesDisabled}>{accountGroups.cash.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><label>Counter account<select name="counterAccountId" required defaultValue={byCode("6000")} disabled={writesDisabled}>{snapshot.accounts.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><label>Tax account<select name="taxAccountId" defaultValue={byCode("1300")} disabled={writesDisabled}><option value="">No separate tax</option>{accountGroups.tax.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><label>Method<select name="method" defaultValue="bank_transfer" disabled={writesDisabled}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="mobile_money">Mobile money</option><option value="card">Card</option><option value="cheque">Cheque</option></select></label><label>Customer<select name="customerId" defaultValue="" disabled={writesDisabled}><option value="">No customer</option>{snapshot.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label><label>Allocate invoice<select name="invoiceId" defaultValue="" disabled={writesDisabled}><option value="">No invoice allocation</option>{snapshot.invoices.map((invoice) => <option value={invoice.id} key={invoice.id}>{invoice.number} · {money(invoice.outstanding)}</option>)}</select></label><label>Counterparty<input name="counterpartyName" maxLength={160} placeholder="Customer or supplier" disabled={writesDisabled} /></label><label>Reference<input name="reference" maxLength={100} placeholder="Bank or receipt reference" disabled={writesDisabled} /></label><label className="full">Notes<textarea name="notes" rows={3} maxLength={500} disabled={writesDisabled} /></label><FinancialActionButton className="primary full" disabled={writesDisabled} pendingLabel="Posting transaction…">Post transaction</FinancialActionButton></form></section>
        <section className="finance-panel finance-wide-panel"><div className="finance-panel-head"><div><p className="eyebrow">Payment register</p><h2>Receipts and payments</h2></div><span>{paymentRows.length.toLocaleString("en-US")} records</span></div><GridToolbar ariaLabel="Payment table controls" density={ui.density} onDensityChange={() => dispatch({ type: "TOGGLE_DENSITY" })} onSearchChange={(value) => dispatch({ type: "SET_SEARCH", tab: "payments", value })} query={ui.search.payments} /><VirtualizedDataGrid ariaLabel="Receipts and payments" rows={paymentRows} columns={paymentColumns} getRowKey={(payment) => payment.id} getRowClassName={(payment) => payment.status === "flagged" ? "is-flagged" : undefined} emptyState="No receipts or payments match the current search." maxHeight={560} minWidth={1040} rowHeight={rowHeight} /></section>
      </div> : null}

      {ui.activeTab === "tax" ? <div className="finance-view" data-motion-enter><section className="finance-kpis tax-kpis"><article><span>Output tax</span><strong>{money(outputTax)}</strong><small>Collected on sales</small></article><article><span>Input tax</span><strong>{money(inputTax)}</strong><small>Recoverable on purchases</small></article><article className={taxPayable >= 0 ? "negative" : "positive"}><span>Net tax position</span><strong>{money(Math.abs(taxPayable))}</strong><small>{taxPayable >= 0 ? "Payable" : "Recoverable"}</small></article></section><section className="finance-panel"><div className="finance-panel-head"><div><p className="eyebrow">Tax configuration</p><h2>Effective tax codes</h2></div><span>Ethiopian base setup</span></div><div className="tax-code-grid">{snapshot.taxCodes.map((tax) => <article key={tax.id}><div><span>{tax.code}</span><strong>{tax.rate}%</strong></div><h3>{tax.name}</h3><p>{tax.type === "output" ? "Collected from customers and credited to the tax liability account." : "Recorded on eligible purchases as recoverable input tax."}</p><footer><span className={`finance-status ${tax.active ? "posted" : "locked"}`}>{tax.active ? "Active" : "Inactive"}</span><strong>{money(tax.balance)}</strong></footer></article>)}</div>{!snapshot.taxCodes.length ? <EmptyState>No tax codes have been configured.</EmptyState> : null}</section></div> : null}

      {ui.activeTab === "assets" ? <div className="finance-view finance-two-column" data-motion-enter><section className="finance-panel"><div className="finance-panel-head"><div><p className="eyebrow">Asset register</p><h2>Capitalize an asset</h2></div><span>Straight-line</span></div><form action={registerFixedAsset} className="finance-form"><label>Asset name<input name="name" maxLength={160} required disabled={writesDisabled} /></label><label>Category<input name="category" maxLength={80} placeholder="Vehicle, equipment…" required disabled={writesDisabled} /></label><label>Acquisition date<input name="acquisitionDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label><label>In-service date<input name="inServiceDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label><label>Cost<input name="cost" type="number" min="0.01" step="0.01" required disabled={writesDisabled} /></label><label>Salvage value<input name="salvageValue" type="number" min="0" step="0.01" defaultValue="0" disabled={writesDisabled} /></label><label>Useful life (months)<input name="usefulLifeMonths" type="number" min="1" step="1" defaultValue="60" required disabled={writesDisabled} /></label><label>Asset account<select name="assetAccountId" required defaultValue={byCode("1500")} disabled={writesDisabled}>{accountGroups.asset.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><label>Accumulated depreciation<select name="accumulatedDepreciationAccountId" required defaultValue={byCode("1510")} disabled={writesDisabled}>{accountGroups.asset.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><label>Depreciation expense<select name="depreciationExpenseAccountId" required defaultValue={byCode("6100")} disabled={writesDisabled}>{accountGroups.expense.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><label>Funding account<select name="fundingAccountId" required defaultValue={byCode("1000")} disabled={writesDisabled}>{accountGroups.funding.map((account) => <option value={account.id} key={account.id}>{accountLabel(account)}</option>)}</select></label><FinancialActionButton className="primary full" disabled={writesDisabled} pendingLabel="Registering asset…">Register and post acquisition</FinancialActionButton></form></section><section className="finance-panel finance-wide-panel"><div className="finance-panel-head"><div><p className="eyebrow">Fixed assets</p><h2>Book value and depreciation</h2></div><span>{snapshot.assets.length} assets</span></div>{snapshot.assets.length ? <div className="asset-grid">{snapshot.assets.map((asset) => { const depreciable = Math.max(asset.cost - asset.salvageValue, 0); const progress = depreciable > 0 ? Math.min(100, (asset.accumulatedDepreciation / depreciable) * 100) : 0; return <article key={asset.id} className="asset-card" data-motion-enter><header><div><span>{asset.number}</span><h3>{asset.name}</h3><p>{asset.category}</p></div><span className={`finance-status ${asset.status}`}>{statusLabel(asset.status)}</span></header><div className="asset-values"><div><small>Cost</small><strong>{money(asset.cost)}</strong></div><div><small>Accumulated depreciation</small><strong>{money(asset.accumulatedDepreciation)}</strong></div><div><small>Book value</small><strong>{money(asset.bookValue)}</strong></div></div><div className="asset-progress"><i style={{ width: `${progress}%` }} /></div><footer><span>{asset.usefulLifeMonths} months · In service {asset.inServiceDate}</span>{asset.status === "active" ? <form action={postAssetDepreciation}><input type="hidden" name="assetId" value={asset.id} /><input type="hidden" name="depreciationDate" value={today} /><FinancialActionButton disabled={writesDisabled} pendingLabel="Posting…">Post monthly depreciation</FinancialActionButton></form> : null}</footer></article>; })}</div> : <EmptyState>No fixed assets have been registered.</EmptyState>}</section></div> : null}

      {ui.activeTab === "closing" ? <div className="finance-view" data-motion-enter><section className="finance-panel closing-intro"><div><p className="eyebrow">Close with confidence</p><h2>Accounting period controls</h2><p>Soft close signals review in progress. Locking a period blocks journal, payment, invoice, acquisition and depreciation postings dated inside that period.</p></div><div className="closing-legend"><span><i className="open" />Open</span><span><i className="soft" />Soft closed</span><span><i className="locked" />Locked</span></div></section><section className="period-grid">{snapshot.periods.map((period) => <article className={`period-card ${period.status}`} key={period.id} data-motion-enter><header><div><span>{period.startDate} → {period.endDate}</span><h3>{period.name}</h3></div><span className={`finance-status ${period.status}`}>{statusLabel(period.status)}</span></header><p>{period.status === "open" ? "Transactions can be posted normally." : period.status === "soft_closed" ? "Review is in progress; authorized users can still post adjustments." : "Posting is blocked and the ledger is protected."}</p><form action={setAccountingPeriodStatus} className="period-action"><input type="hidden" name="periodId" value={period.id} /><select name="status" defaultValue={period.status} disabled={writesDisabled}><option value="open">Open</option><option value="soft_closed">Soft close</option><option value="locked">Lock period</option></select><FinancialActionButton disabled={writesDisabled} pendingLabel="Applying…">Apply</FinancialActionButton></form></article>)}</section></div> : null}
    </main>
  );
}
