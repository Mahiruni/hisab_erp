import Link from "next/link";
import { billingPlans, formatEtb } from "../../lib/billing/catalog";
import { billingGrantsAccess, getCurrentBillingSnapshot } from "../../lib/data/billing";

export const metadata = { title: "Billing and paid access" };
export const dynamic = "force-dynamic";

function statusLabel(status: string | null | undefined) {
  if (!status) return "No paid access";
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; next?: string }> }) {
  const [snapshot, params] = await Promise.all([getCurrentBillingSnapshot(), searchParams]);
  const access = snapshot.access;
  const plan = billingPlans.find((item) => item.code === access?.planCode) || null;
  const active = billingGrantsAccess(access?.status, access?.currentPeriodEnd);
  const safeNext = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/";

  return (
    <main className="commerce-page billing-page">
      <header className="commerce-topbar">
        <Link href="/" className="commerce-brand"><img src="/hisab-logo.svg" alt="" width="42" height="42"/><span><strong>HisabTech</strong><small>Paid access center</small></span></Link>
        <Link href={active ? safeNext : "/"}>{active ? "Continue to workspace" : "Return to HisabTech"}</Link>
      </header>

      <section className="billing-hero">
        <div><span className="commerce-kicker">Chapa payment and access</span><h1>Clear payment history, verified access, no automatic charge.</h1><p>Review the current HisabERP plan and access end date. Payments are made manually through Chapa and accepted only after direct server verification.</p></div>
        <span className={`billing-status ${active ? "active" : "inactive"}`}><i aria-hidden="true"/>{active ? "Active" : statusLabel(access?.status)}</span>
      </section>

      {params.notice ? <div className="commerce-alert warning billing-alert" role="status">{params.notice}</div> : null}
      {params.error ? <div className="commerce-alert error billing-alert" role="alert">{params.error}</div> : null}
      {!snapshot.configured ? <div className="commerce-alert warning billing-alert" role="status">Chapa is not configured in this environment. Existing access records remain protected, but new checkout is unavailable.</div> : null}

      <section className="billing-grid">
        <article className="billing-plan-card">
          <span>Current access</span>
          <h2>{plan?.name || "No paid plan"}</h2>
          <p>{plan?.description || "Choose a HisabERP plan and complete a verified Chapa payment to activate access."}</p>
          {access ? <div className="billing-price"><strong>ETB {formatEtb(access.amountEtb)}</strong><small>{access.billingCycle === "annual" ? "annual access payment" : "monthly access payment"}</small></div> : null}
          <div className="billing-card-actions">
            <Link href="/pricing" className="commerce-primary">{active ? "Renew or change plan with Chapa" : "Choose a plan"} <b aria-hidden="true">→</b></Link>
            <Link href="/help-center" className="commerce-secondary">Payment help</Link>
          </div>
        </article>

        <article className="billing-detail-card">
          <header><span>Access details</span><strong>Chapa verified</strong></header>
          <dl>
            <div><dt>Status</dt><dd>{active ? "Active" : statusLabel(access?.status)}</dd></div>
            <div><dt>Paid period</dt><dd>{access ? (access.billingCycle === "annual" ? "Annual" : "Monthly") : "—"}</dd></div>
            <div><dt>Access starts</dt><dd>{access?.currentPeriodStart ? new Intl.DateTimeFormat("en-ET", { dateStyle: "long" }).format(new Date(access.currentPeriodStart)) : "—"}</dd></div>
            <div><dt>Access ends</dt><dd>{access?.currentPeriodEnd ? new Intl.DateTimeFormat("en-ET", { dateStyle: "long" }).format(new Date(access.currentPeriodEnd)) : "—"}</dd></div>
            <div><dt>Renewal</dt><dd>Manual payment through Chapa</dd></div>
            <div><dt>Latest payment</dt><dd>{access?.lastPaymentStatus ? statusLabel(access.lastPaymentStatus) : "—"}</dd></div>
            <div><dt>Currency</dt><dd>{access?.currency || "ETB"}</dd></div>
          </dl>
        </article>

        <article className="billing-security-card">
          <span>How access is protected</span>
          <h2>Payment state cannot be changed from the browser.</h2>
          <p>HisabTech rechecks the transaction with Chapa and validates the transaction reference, ETB amount, currency and final status before updating the access ledger.</p>
          <div><span><b>01</b> Authenticated webhook delivery</span><span><b>02</b> Direct transaction verification</span><span><b>03</b> User-isolated RLS</span></div>
          <Link href="/trust">Review the Trust Center →</Link>
        </article>
      </section>
    </main>
  );
}
