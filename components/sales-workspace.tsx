"use client";

import { useMemo, useState } from "react";
import {
  convertSalesOrderToInvoice,
  convertSalesQuotationToOrder,
  createSalesOrder,
  createSalesQuotation,
  postSalesInvoice,
  postSalesReturn,
  recordSalesReceipt,
  setSalesQuotationStatus,
} from "../lib/actions/sales";
import type { SalesProductRecord, SalesSnapshot } from "../lib/data/sales-types";
import { DemoNotice } from "./demo-notice";

const tabs = [
  ["overview", "Overview"],
  ["quotations", "Quotations"],
  ["orders", "Sales orders"],
  ["invoices", "Invoices"],
  ["receipts", "Receipts"],
  ["returns", "Returns"],
  ["customers", "Customer balances"],
] as const;

type SalesTab = (typeof tabs)[number][0];
type FormAction = (formData: FormData) => void | Promise<void>;
type BuilderKind = "quotation" | "order" | "invoice";
type DraftLine = { key: number; selection: string; quantity: number; unitPrice: number; discountRate: number; taxRate: number };

function money(value: number) {
  return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 2 }).format(value || 0);
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function productKey(product: SalesProductRecord) {
  return `${product.id}:${product.warehouseId}`;
}

function DocumentBuilder({
  kind,
  action,
  customers,
  products,
  disabled,
}: {
  kind: BuilderKind;
  action: FormAction;
  customers: SalesSnapshot["customers"];
  products: SalesProductRecord[];
  disabled: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + (kind === "quotation" ? 10 : 30) * 86_400_000).toISOString().slice(0, 10);
  const first = products[0];
  const [lines, setLines] = useState<DraftLine[]>([
    { key: 1, selection: first ? productKey(first) : "", quantity: 1, unitPrice: first?.unitPrice ?? 0, discountRate: 0, taxRate: 15 },
  ]);

  const payload = lines.map((line) => {
    const product = products.find((entry) => productKey(entry) === line.selection);
    return {
      productId: product?.id ?? "",
      warehouseId: product?.warehouseId ?? "",
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountRate: line.discountRate,
      taxRate: line.taxRate,
    };
  });

  const totals = useMemo(() => lines.reduce((sum, line) => {
    const gross = line.quantity * line.unitPrice;
    const discount = gross * line.discountRate / 100;
    const tax = (gross - discount) * line.taxRate / 100;
    return { gross: sum.gross + gross, discount: sum.discount + discount, tax: sum.tax + tax, total: sum.total + gross - discount + tax };
  }, { gross: 0, discount: 0, tax: 0, total: 0 }), [lines]);

  const updateLine = (key: number, patch: Partial<DraftLine>) => setLines((current) => current.map((line) => line.key === key ? { ...line, ...patch } : line));
  const addLine = () => setLines((current) => [...current, { key: Math.max(...current.map((line) => line.key), 0) + 1, selection: first ? productKey(first) : "", quantity: 1, unitPrice: first?.unitPrice ?? 0, discountRate: 0, taxRate: 15 }]);
  const removeLine = (key: number) => setLines((current) => current.length === 1 ? current : current.filter((line) => line.key !== key));

  const labels = {
    quotation: { eyebrow: "Commercial offer", title: "Create quotation", button: "Save quotation" },
    order: { eyebrow: "Confirmed demand", title: "Create sales order", button: "Confirm sales order" },
    invoice: { eyebrow: "Accounting & stock posting", title: "Post direct invoice", button: "Post invoice" },
  }[kind];

  return (
    <section className="sales-panel sales-builder">
      <div className="sales-panel-head"><div><p className="eyebrow">{labels.eyebrow}</p><h2>{labels.title}</h2></div><span>{lines.length} line{lines.length === 1 ? "" : "s"}</span></div>
      <form action={action} className="sales-form">
        <input type="hidden" name="lines" value={JSON.stringify(payload)} />
        <label>Customer<select name="customerId" required defaultValue="" disabled={disabled}><option value="" disabled>Select customer</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · Balance {money(customer.balance)}</option>)}</select></label>
        <label>{kind === "quotation" ? "Quotation date" : kind === "order" ? "Order date" : "Invoice date"}<input name="documentDate" type="date" defaultValue={today} required disabled={disabled} /></label>
        {kind === "quotation" && <label>Valid until<input name="validUntil" type="date" defaultValue={future} required disabled={disabled} /></label>}
        {kind === "order" && <label>Expected date<input name="expectedDate" type="date" defaultValue={future} disabled={disabled} /></label>}
        {kind === "invoice" && <label>Due date<input name="dueDate" type="date" defaultValue={future} disabled={disabled} /></label>}
        {kind !== "quotation" && <label>Customer reference<input name="customerReference" maxLength={120} placeholder="PO or buyer reference" disabled={disabled} /></label>}
        <label className="full">Notes<input name="notes" maxLength={1000} placeholder="Commercial terms or delivery notes" disabled={disabled} /></label>

        <div className="sales-lines full">
          <div className="sales-line sales-line-heading"><span>Product & warehouse</span><span>Qty</span><span>Unit price</span><span>Discount %</span><span>Tax %</span><span /></div>
          {lines.map((line) => (
            <div className="sales-line" key={line.key}>
              <select value={line.selection} required disabled={disabled} onChange={(event) => {
                const product = products.find((entry) => productKey(entry) === event.target.value);
                updateLine(line.key, { selection: event.target.value, unitPrice: product?.unitPrice ?? 0 });
              }}>
                <option value="" disabled>Select product</option>
                {products.map((product) => <option value={productKey(product)} key={productKey(product)}>{product.sku} · {product.name} · {product.warehouseName} · {product.quantity} available</option>)}
              </select>
              <input aria-label="Quantity" type="number" min="0.001" step="0.001" value={line.quantity} disabled={disabled} onChange={(event) => updateLine(line.key, { quantity: Number(event.target.value) })} />
              <input aria-label="Unit price" type="number" min="0" step="0.01" value={line.unitPrice} disabled={disabled} onChange={(event) => updateLine(line.key, { unitPrice: Number(event.target.value) })} />
              <input aria-label="Discount rate" type="number" min="0" max="100" step="0.01" value={line.discountRate} disabled={disabled} onChange={(event) => updateLine(line.key, { discountRate: Number(event.target.value) })} />
              <input aria-label="Tax rate" type="number" min="0" max="100" step="0.01" value={line.taxRate} disabled={disabled} onChange={(event) => updateLine(line.key, { taxRate: Number(event.target.value) })} />
              <button type="button" className="sales-remove-line" onClick={() => removeLine(line.key)} disabled={disabled || lines.length === 1}>×</button>
            </div>
          ))}
          <button type="button" className="sales-add-line" onClick={addLine} disabled={disabled || lines.length >= 100}>+ Add line</button>
        </div>

        <div className="sales-builder-total full">
          <span>Gross <strong>{money(totals.gross)}</strong></span><span>Discount <strong>{money(totals.discount)}</strong></span><span>Tax <strong>{money(totals.tax)}</strong></span><span className="grand">Total <strong>{money(totals.total)}</strong></span>
        </div>
        <button className="primary full" type="submit" disabled={disabled || !customers.length || !products.length}>{labels.button}</button>
      </form>
    </section>
  );
}

function EmptyState({ children }: { children: string }) {
  return <div className="sales-empty">{children}</div>;
}

export function SalesWorkspace({ snapshot, initialTab, success, canManage }: { snapshot: SalesSnapshot; initialTab: string; success?: string; canManage: boolean }) {
  const validTab = tabs.some(([key]) => key === initialTab) ? initialTab as SalesTab : "overview";
  const [activeTab, setActiveTab] = useState<SalesTab>(validTab);
  const [receiptCustomer, setReceiptCustomer] = useState(snapshot.customers[0]?.id ?? "");
  const [returnInvoice, setReturnInvoice] = useState(snapshot.invoices.find((invoice) => invoice.items.some((item) => item.returnableQuantity > 0))?.id ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const writesDisabled = snapshot.mode === "demo" || !canManage;
  const openInvoices = snapshot.invoices.filter((invoice) => invoice.outstanding > 0);
  const receiptInvoices = openInvoices.filter((invoice) => invoice.customerId === receiptCustomer);
  const selectedReturnInvoice = snapshot.invoices.find((invoice) => invoice.id === returnInvoice);
  const returnItems = selectedReturnInvoice?.items.filter((item) => item.returnableQuantity > 0) ?? [];
  const netSales = snapshot.metrics.invoicedThisMonth - snapshot.metrics.returnsThisMonth;

  return (
    <main className="sales-page">
      <header className="sales-hero">
        <div><p className="eyebrow">Phase 1 · Must have</p><h1>Sales &amp; Invoicing</h1><p>Manage quotations, sales orders, invoices, receipts, returns and customer balances from one workflow.</p></div>
        <div className="sales-hero-state"><span className="sales-live-dot" /><div><small>Workspace</small><strong>{snapshot.organizationName}</strong></div></div>
      </header>

      <DemoNotice mode={snapshot.mode} />
      {success && <div className="form-alert success sales-success">{success}</div>}
      {!canManage && snapshot.mode === "live" && <div className="form-alert warning sales-success">You have read-only sales access.</div>}

      <nav className="sales-tabs" aria-label="Sales workspace sections">{tabs.map(([key, label]) => <button type="button" className={activeTab === key ? "active" : ""} key={key} onClick={() => setActiveTab(key)}>{label}</button>)}</nav>

      {activeTab === "overview" && <div className="sales-view">
        <section className="sales-kpis">
          <article><span>Active quotations</span><strong>{snapshot.metrics.activeQuotations}</strong><small>Draft, sent or accepted</small></article>
          <article><span>Open orders</span><strong>{snapshot.metrics.openOrders}</strong><small>Ready for invoicing</small></article>
          <article><span>Net sales</span><strong>{money(netSales)}</strong><small>Invoices less returns this month</small></article>
          <article><span>Outstanding</span><strong>{money(snapshot.metrics.outstanding)}</strong><small>Customer receivables</small></article>
        </section>
        <section className="sales-overview-grid">
          <article className="sales-panel sales-flow-card"><div className="sales-panel-head"><div><p className="eyebrow">One workflow</p><h2>Quote to cash</h2></div><span>Atomic posting</span></div><div className="sales-flow"><button onClick={() => setActiveTab("quotations")}>Quotation</button><b>→</b><button onClick={() => setActiveTab("orders")}>Order</button><b>→</b><button onClick={() => setActiveTab("invoices")}>Invoice</button><b>→</b><button onClick={() => setActiveTab("receipts")}>Receipt</button></div><p>Quotations and orders stay commercial. Invoicing posts receivables, revenue, VAT, COGS and stock together.</p></article>
          <article className="sales-panel"><div className="sales-panel-head"><div><p className="eyebrow">Cash collection</p><h2>Month to date</h2></div><span>{money(snapshot.metrics.receivedThisMonth)}</span></div><div className="sales-progress"><i style={{ width: `${snapshot.metrics.invoicedThisMonth ? Math.min(100, snapshot.metrics.receivedThisMonth / snapshot.metrics.invoicedThisMonth * 100) : 0}%` }} /></div><p>{money(snapshot.metrics.invoicedThisMonth)} invoiced · {money(snapshot.metrics.returnsThisMonth)} credited</p></article>
          <article className="sales-panel"><div className="sales-panel-head"><div><p className="eyebrow">Customer control</p><h2>Highest balances</h2></div><button onClick={() => setActiveTab("customers")}>View all →</button></div>{snapshot.customers.slice().sort((a, b) => b.balance - a.balance).slice(0, 4).map((customer) => <div className="sales-balance-line" key={customer.id}><span>{customer.name}</span><strong>{money(customer.balance)}</strong></div>)}</article>
        </section>
      </div>}

      {activeTab === "quotations" && <div className="sales-view sales-two-column">
        <DocumentBuilder kind="quotation" action={createSalesQuotation} customers={snapshot.customers} products={snapshot.products} disabled={writesDisabled} />
        <section className="sales-panel sales-wide-panel"><div className="sales-panel-head"><div><p className="eyebrow">Commercial pipeline</p><h2>Quotation register</h2></div><span>{snapshot.quotations.length} records</span></div>{snapshot.quotations.length ? <div className="sales-table-wrap"><table className="sales-table"><thead><tr><th>Quotation</th><th>Customer</th><th>Valid until</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>{snapshot.quotations.map((quote) => <tr key={quote.id}><td><strong>{quote.number}</strong><small>{quote.date}</small></td><td>{quote.customerName}</td><td>{quote.validUntil}</td><td>{money(quote.total)}</td><td><span className={`sales-status ${quote.status}`}>{statusLabel(quote.status)}</span></td><td><div className="sales-row-actions">{!['converted','rejected','expired'].includes(quote.status) && <><form action={setSalesQuotationStatus}><input type="hidden" name="quotationId" value={quote.id} /><button name="status" value={quote.status === 'draft' ? 'sent' : 'accepted'} disabled={writesDisabled}>{quote.status === 'draft' ? 'Mark sent' : 'Accept'}</button></form><form action={convertSalesQuotationToOrder}><input type="hidden" name="quotationId" value={quote.id} /><input type="hidden" name="orderDate" value={today} /><input type="hidden" name="expectedDate" value={new Date(Date.now()+3*86_400_000).toISOString().slice(0,10)} /><button disabled={writesDisabled}>Convert to order</button></form></>}</div></td></tr>)}</tbody></table></div> : <EmptyState>No quotations yet.</EmptyState>}</section>
      </div>}

      {activeTab === "orders" && <div className="sales-view sales-two-column">
        <DocumentBuilder kind="order" action={createSalesOrder} customers={snapshot.customers} products={snapshot.products} disabled={writesDisabled} />
        <section className="sales-panel sales-wide-panel"><div className="sales-panel-head"><div><p className="eyebrow">Confirmed demand</p><h2>Sales order register</h2></div><span>{snapshot.orders.length} records</span></div>{snapshot.orders.length ? <div className="sales-table-wrap"><table className="sales-table"><thead><tr><th>Order</th><th>Customer</th><th>Expected</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>{snapshot.orders.map((order) => <tr key={order.id}><td><strong>{order.number}</strong><small>{order.date}</small></td><td>{order.customerName}<small>{order.customerReference || 'No buyer reference'}</small></td><td>{order.expectedDate || '—'}</td><td>{money(order.total)}</td><td><span className={`sales-status ${order.status}`}>{statusLabel(order.status)}</span></td><td>{order.status === 'confirmed' && <form action={convertSalesOrderToInvoice} className="sales-inline-form"><input type="hidden" name="salesOrderId" value={order.id} /><input type="hidden" name="invoiceDate" value={today} /><input type="date" name="dueDate" defaultValue={new Date(Date.now()+30*86_400_000).toISOString().slice(0,10)} disabled={writesDisabled} /><button disabled={writesDisabled}>Post invoice</button></form>}</td></tr>)}</tbody></table></div> : <EmptyState>No sales orders yet.</EmptyState>}</section>
      </div>}

      {activeTab === "invoices" && <div className="sales-view sales-two-column">
        <DocumentBuilder kind="invoice" action={postSalesInvoice} customers={snapshot.customers} products={snapshot.products} disabled={writesDisabled} />
        <section className="sales-panel sales-wide-panel"><div className="sales-panel-head"><div><p className="eyebrow">Posted sales</p><h2>Invoice register</h2></div><span>{snapshot.invoices.length} invoices</span></div>{snapshot.invoices.length ? <div className="sales-table-wrap"><table className="sales-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Due</th><th>Total</th><th>Paid</th><th>Returned</th><th>Outstanding</th><th>Status</th></tr></thead><tbody>{snapshot.invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.number}</strong><small>{invoice.date}</small></td><td>{invoice.customerName}</td><td>{invoice.dueDate}</td><td>{money(invoice.total)}</td><td>{money(invoice.paid)}</td><td>{money(invoice.returned)}</td><td><strong>{money(invoice.outstanding)}</strong></td><td><span className={`sales-status ${invoice.status}`}>{statusLabel(invoice.status)}</span></td></tr>)}</tbody></table></div> : <EmptyState>No invoices have been posted.</EmptyState>}</section>
      </div>}

      {activeTab === "receipts" && <div className="sales-view sales-two-column">
        <section className="sales-panel"><div className="sales-panel-head"><div><p className="eyebrow">Customer payment</p><h2>Record receipt</h2></div><span>Automatic journal</span></div><form action={recordSalesReceipt} className="sales-form"><label>Customer<select name="customerId" value={receiptCustomer} onChange={(event) => setReceiptCustomer(event.target.value)} disabled={writesDisabled} required>{snapshot.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {money(customer.balance)}</option>)}</select></label><label>Invoice allocation<select name="invoiceId" defaultValue="" disabled={writesDisabled}><option value="">On-account receipt</option>{receiptInvoices.map((invoice) => <option value={invoice.id} key={invoice.id}>{invoice.number} · {money(invoice.outstanding)} due</option>)}</select></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required disabled={writesDisabled} /></label><label>Method<select name="method" defaultValue="Cash" disabled={writesDisabled}><option>Cash</option><option>Bank transfer</option><option>Mobile money</option><option>Cheque</option></select></label><label>Payment date<input name="paymentDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label><label>Reference<input name="reference" maxLength={120} disabled={writesDisabled} /></label><label className="full">Notes<input name="notes" maxLength={500} disabled={writesDisabled} /></label><button className="primary full" disabled={writesDisabled || !snapshot.customers.length}>Post receipt</button></form></section>
        <section className="sales-panel sales-wide-panel"><div className="sales-panel-head"><div><p className="eyebrow">Collections</p><h2>Receipt history</h2></div><span>{money(snapshot.metrics.receivedThisMonth)} this month</span></div>{snapshot.receipts.length ? <div className="sales-table-wrap"><table className="sales-table"><thead><tr><th>Receipt</th><th>Date</th><th>Customer</th><th>Invoice</th><th>Method</th><th>Amount</th></tr></thead><tbody>{snapshot.receipts.map((receipt) => <tr key={receipt.id}><td><strong>{receipt.number}</strong><small>{receipt.reference || 'No reference'}</small></td><td>{receipt.date}</td><td>{receipt.customerName || 'Customer'}</td><td>{snapshot.invoices.find((invoice) => invoice.id === receipt.invoiceId)?.number || 'On account'}</td><td>{receipt.method}</td><td><strong>{money(receipt.amount)}</strong></td></tr>)}</tbody></table></div> : <EmptyState>No receipts posted.</EmptyState>}</section>
      </div>}

      {activeTab === "returns" && <div className="sales-view sales-two-column">
        <section className="sales-panel"><div className="sales-panel-head"><div><p className="eyebrow">Credit note workflow</p><h2>Post customer return</h2></div><span>Stock + ledger reversal</span></div><form action={postSalesReturn} className="sales-form"><label>Invoice<select name="invoiceId" value={returnInvoice} onChange={(event) => setReturnInvoice(event.target.value)} disabled={writesDisabled} required><option value="" disabled>Select invoice</option>{snapshot.invoices.filter((invoice) => invoice.items.some((item) => item.returnableQuantity > 0)).map((invoice) => <option value={invoice.id} key={invoice.id}>{invoice.number} · {invoice.customerName}</option>)}</select></label><label>Invoice item<select name="invoiceItemId" defaultValue="" disabled={writesDisabled} required><option value="" disabled>Select item</option>{returnItems.map((item) => <option value={item.id} key={item.id}>{item.description} · {item.returnableQuantity} returnable</option>)}</select></label><label>Quantity<input name="quantity" type="number" min="0.001" step="0.001" required disabled={writesDisabled} /></label><label>Return date<input name="returnDate" type="date" defaultValue={today} required disabled={writesDisabled} /></label><label className="full">Reason<input name="reason" maxLength={500} required placeholder="Damage, quality issue or buyer return" disabled={writesDisabled} /></label><button className="primary full" disabled={writesDisabled || !returnItems.length}>Post return & customer credit</button></form></section>
        <section className="sales-panel sales-wide-panel"><div className="sales-panel-head"><div><p className="eyebrow">Returns register</p><h2>Posted customer credits</h2></div><span>{money(snapshot.metrics.returnsThisMonth)} this month</span></div>{snapshot.returns.length ? <div className="sales-table-wrap"><table className="sales-table"><thead><tr><th>Return</th><th>Date</th><th>Invoice</th><th>Customer</th><th>Reason</th><th>Credit</th></tr></thead><tbody>{snapshot.returns.map((entry) => <tr key={entry.id}><td><strong>{entry.number}</strong></td><td>{entry.date}</td><td>{entry.invoiceNumber}</td><td>{entry.customerName}</td><td>{entry.reason}</td><td><strong>{money(entry.total)}</strong></td></tr>)}</tbody></table></div> : <EmptyState>No returns have been posted.</EmptyState>}</section>
      </div>}

      {activeTab === "customers" && <div className="sales-view"><section className="sales-panel"><div className="sales-panel-head"><div><p className="eyebrow">Accounts receivable</p><h2>Customer balance statements</h2></div><span>{money(snapshot.metrics.outstanding)} outstanding</span></div>{snapshot.customers.length ? <div className="sales-table-wrap"><table className="sales-table"><thead><tr><th>Customer</th><th>Terms</th><th>Credit limit</th><th>Invoiced</th><th>Received</th><th>Returns</th><th>Balance</th><th>Available credit</th></tr></thead><tbody>{snapshot.customers.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong><small>{customer.phone || customer.email || customer.tin || 'No contact details'}</small></td><td>{customer.paymentTermsDays} days</td><td>{money(customer.creditLimit)}</td><td>{money(customer.invoiced)}</td><td>{money(customer.received)}</td><td>{money(customer.returned)}</td><td><strong className={customer.balance > customer.creditLimit && customer.creditLimit > 0 ? 'sales-negative' : ''}>{money(customer.balance)}</strong></td><td>{money(customer.availableCredit)}</td></tr>)}</tbody></table></div> : <EmptyState>No customers available.</EmptyState>}</section></div>}
    </main>
  );
}
